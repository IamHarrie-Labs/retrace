import "server-only";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { config, passportType } from "./config";

/**
 * Every onchain read in Retrace goes through Tatum's Sui Mainnet gateway.
 * Sui has retired JSON-RPC on Mainnet, so we use Tatum's Sui GraphQL interface.
 */
export function tatumGraphqlUrl() {
  const base=config.tatumSuiRpc.replace(/\/$/, "");
  return base.endsWith("/graphql")?base:`${base}/graphql`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Tatum's plan caps requests per second. Serialize server-side calls with a
// small gap and retry 429/5xx with backoff, so one page load can't trip it.
let queue: Promise<unknown> = Promise.resolve();
const MIN_GAP_MS = 220;
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(() => sleep(MIN_GAP_MS), () => sleep(MIN_GAP_MS));
  return run;
}

/** POST a raw GraphQL body to Tatum, throttled, retrying 429/5xx with backoff. */
export async function tatumFetch(body: string, timeoutMs = 25_000): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await throttled(() =>
      fetch(tatumGraphqlUrl(), {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": config.tatumApiKey() },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      }),
    );
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(retryAfter > 0 ? Math.min(retryAfter, 5) * 1000 : 400 * 2 ** attempt);
      continue;
    }
    return res;
  }
}

export async function tatumGql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await tatumFetch(JSON.stringify({ query, variables }));
  if (!res.ok) throw new Error(`Tatum GraphQL failed: HTTP ${res.status}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error(`Tatum GraphQL: ${body.errors[0].message}`);
  return body.data as T;
}

/** Short-lived memo for reads that a single page load repeats. */
const memo = new Map<string, { at: number; value: Promise<unknown> }>();
function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>;
  const value = fn().catch((e) => {
    memo.delete(key);
    throw e;
  });
  memo.set(key, { at: Date.now(), value });
  return value;
}

export type Passport = {
  id: string;
  owner: string | null;
  ownerKind: "address" | "shared" | "object" | "immutable" | "unknown";
  category: string;
  make: string;
  model: string;
  creator: string;
  createdAtMs: number;
  version: string;
};

type GqlObject = {
  address: string;
  version: number;
  owner?: { __typename: string; address?: { address: string } } | null;
  asMoveObject?: { contents?: { type?: { repr: string }; json?: Record<string, unknown> } } | null;
  /** Present when the node is already a MoveObject (e.g. owned-object listings). */
  contents?: { type?: { repr: string }; json?: Record<string, unknown> } | null;
};

const MOVE_OBJECT_FIELDS = `
  address
  version
  owner { __typename ... on AddressOwner { address { address } } }
  contents { type { repr } json }
`;

const OBJECT_FIELDS = `
  address
  version
  owner { __typename ... on AddressOwner { address { address } } }
  asMoveObject { contents { type { repr } json } }
`;

function toPassport(o: GqlObject | null | undefined): Passport | null {
  if (!o) return null;
  const contents = o.asMoveObject?.contents ?? o.contents;
  const type = contents?.type?.repr;
  if (!type || normalizeType(type) !== normalizeType(passportType())) return null;
  const f = contents?.json ?? {};
  const kind = o.owner?.__typename;
  const ownerKind: Passport["ownerKind"] =
    kind === "AddressOwner" ? "address" : kind === "Shared" ? "shared" : kind === "ObjectOwner" ? "object" : kind === "Immutable" ? "immutable" : "unknown";
  return {
    id: normalizeSuiAddress(o.address),
    owner: o.owner?.address?.address ? normalizeSuiAddress(o.owner.address.address) : null,
    ownerKind,
    category: String(f.category ?? ""),
    make: String(f.make ?? ""),
    model: String(f.model ?? ""),
    creator: f.creator ? normalizeSuiAddress(String(f.creator)) : "",
    createdAtMs: Number(f.created_at_ms ?? 0),
    version: String(o.version),
  };
}

function normalizeType(t: string) {
  const [addr, ...rest] = t.split("::");
  return [normalizeSuiAddress(addr), ...rest].join("::");
}

/** Read a passport and its *current* owner from Sui Mainnet via Tatum. */
export function getPassport(id: string, options: { fresh?: boolean } = {}): Promise<Passport | null> {
  const read = async () => {
    const d = await tatumGql<{ object: GqlObject | null }>(
      `query($id: SuiAddress!) { object(address: $id) { ${OBJECT_FIELDS} } }`,
      { id },
    );
    return toPassport(d.object);
  };
  // Display reads can share work. Authorization always bypasses this memo.
  return options.fresh ? read() : cached(`passport:${normalizeSuiAddress(id)}`, 2_000, read);
}

/** All passports a wallet holds, via Tatum. */
export async function getOwnedPassports(address: string): Promise<Passport[]> {
  const out: Passport[] = [];
  let after: string | null = null;
  for (let page = 0; ; page++) {
    if (page >= 100) throw new Error("Passport inventory exceeded the supported request size");
    const d: {
      address: { objects: { nodes: GqlObject[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } | null;
    } = await tatumGql(
      `query($owner: SuiAddress!, $type: String!, $after: String) {
        address(address: $owner) {
          objects(filter: { type: $type }, first: 50, after: $after) {
            nodes { ${MOVE_OBJECT_FIELDS} }
            pageInfo { hasNextPage endCursor }
          }
        }
      }`,
      { owner: address, type: passportType(), after },
    );
    const conn = d.address?.objects;
    if (!conn) break;
    for (const o of conn.nodes) {
      const p = toPassport(o);
      if (p) out.push(p);
    }
    if (!conn.pageInfo.hasNextPage) break;
    if (!conn.pageInfo.endCursor || conn.pageInfo.endCursor === after) throw new Error("Passport pagination did not advance");
    after = conn.pageInfo.endCursor;
  }
  return out;
}

export type ChainEvent = {
  kind: "minted" | "transferred";
  from?: string;
  to: string;
  timestampMs: number;
  txDigest: string;
};

/** Ownership history of one passport, from its Move events (via Tatum). */
export function getPassportEvents(id: string): Promise<ChainEvent[]> {
  return cached(`events:${normalizeSuiAddress(id)}`, 15_000, () => fetchPassportEvents(id));
}

async function fetchPassportEvents(id: string): Promise<ChainEvent[]> {
  const pkg = config.packageId(), target = normalizeSuiAddress(id);
  const events: ChainEvent[] = [];
  for (const [name,kind] of [["PassportMinted","minted"],["PassportTransferred","transferred"]] as const) {
    let cursor: string | null = null;
    for (let page=0;;page++) {
      if (page>=100) throw new Error("Recorded transfer history is too large for one request");
      const data: {events:{nodes:{contents:{json:Record<string,string>};timestamp:string|null;transaction:{digest:string}|null}[];pageInfo:{hasNextPage:boolean;endCursor:string|null}}} = await tatumGql(
        `query($type:String!,$checkpoint:UInt53!,$cursor:String) {
          events(filter:{type:$type,afterCheckpoint:$checkpoint},first:50,after:$cursor) {
            nodes { contents { json } timestamp transaction { digest } }
            pageInfo { hasNextPage endCursor }
          }
        }`, {type:`${pkg}::passport::${name}`,checkpoint:config.packageCheckpoint,cursor},
      );
      for (const event of data.events.nodes) {
        const fields=event.contents.json;
        if (!fields.passport_id || normalizeSuiAddress(fields.passport_id)!==target) continue;
        events.push({kind,from:kind==="transferred"?normalizeSuiAddress(fields.from):undefined,to:normalizeSuiAddress(kind==="minted"?fields.owner:fields.to),timestampMs:event.timestamp?Date.parse(event.timestamp):0,txDigest:event.transaction?.digest??""});
      }
      if (!data.events.pageInfo.hasNextPage) break;
      const next=data.events.pageInfo.endCursor;
      if (!next || next===cursor) throw new Error("Recorded transfer pagination did not advance");
      cursor=next;
    }
  }
  return events.sort((a,b)=>a.timestampMs-b.timestampMs || a.txDigest.localeCompare(b.txDigest));
}

export async function getLatestCheckpoint(): Promise<string> {
  const d = await tatumGql<{ checkpoint: { sequenceNumber: number } }>(`{ checkpoint { sequenceNumber } }`);
  return String(d.checkpoint.sequenceNumber);
}

/** SUI balance (in MIST) of an address, via Tatum. */
export async function getSuiBalance(address: string): Promise<bigint> {
  const d = await tatumGql<{ address: { balance: { totalBalance: string | null } | null } | null }>(
    `query($a: SuiAddress!) { address(address: $a) { balance(coinType: "0x2::sui::SUI") { totalBalance } } }`,
    { a: address },
  );
  return BigInt(d.address?.balance?.totalBalance ?? "0");
}

let registryTable: Promise<string> | null = null;
/** The Table<vector<u8>, ID> inside the shared Registry (its ID never changes). */
function getRegistryTableId(): Promise<string> {
  return (registryTable ??= tatumGql<{ object: { asMoveObject: { contents: { json: { serials: { id: string } } } } } | null }>(
    `query($id: SuiAddress!) { object(address: $id) { asMoveObject { contents { json } } } }`,
    { id: config.registryId() },
  ).then((d) => {
    const id = d.object?.asMoveObject.contents.json.serials.id;
    if (!id) throw new Error("Retrace registry not found");
    return id;
  }).catch((e) => { registryTable = null; throw e; }));
}

/** Passport already registered for this serial hash, if any (read from the onchain Registry via Tatum). */
export async function getRegisteredPassport(serialHash: Uint8Array): Promise<string | null> {
  const table = await getRegistryTableId();
  // BCS of vector<u8>: ULEB128 length (32 < 128, one byte) followed by the bytes.
  const bcs = Buffer.concat([Buffer.from([serialHash.length]), Buffer.from(serialHash)]).toString("base64");
  const d = await tatumGql<{ address: { dynamicField: { value: { json?: string } | null } | null } | null }>(
    `query($t: SuiAddress!, $bcs: Base64!) { address(address: $t) { dynamicField(name: { type: "vector<u8>", bcs: $bcs }) { value { ... on MoveValue { json } } } } }`,
    { t: table, bcs },
  );
  const v = d.address?.dynamicField?.value?.json;
  return v ? normalizeSuiAddress(String(v)) : null;
}
