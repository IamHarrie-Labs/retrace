import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { RepairRecord } from "./records";

type StoredRow = { record_json: string; fingerprint: string; blob_id: string | null; job_id: string | null; attempt: number };

/** Exact, persistent event index. Semantic search is never the timeline database. */
export class RecordLedger {
  readonly db: DatabaseSync;
  constructor(filename: string) {
    if (filename !== ":memory:") mkdirSync(dirname(resolve(filename)), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS repair_records (
        id TEXT PRIMARY KEY, passport_id TEXT NOT NULL, request_key TEXT NOT NULL,
        fingerprint TEXT NOT NULL, record_json TEXT NOT NULL, blob_id TEXT, job_id TEXT,
        created_at TEXT NOT NULL, attempt INTEGER NOT NULL DEFAULT 0, UNIQUE(passport_id, request_key)
      );
      CREATE INDEX IF NOT EXISTS repair_passport ON repair_records(passport_id, created_at, id);
      CREATE TABLE IF NOT EXISTS initialized_devices (passport_id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS used_challenges (nonce TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS request_limits (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS attestations (
        record_id TEXT PRIMARY KEY, passport_id TEXT NOT NULL, signer TEXT NOT NULL, shop TEXT NOT NULL,
        message TEXT NOT NULL, signature TEXT NOT NULL, signed_at TEXT NOT NULL, blob_id TEXT
      );
      CREATE INDEX IF NOT EXISTS attestations_passport ON attestations(passport_id);
      CREATE TABLE IF NOT EXISTS handovers (
        id TEXT PRIMARY KEY, passport_id TEXT NOT NULL, seller TEXT NOT NULL, buyer TEXT,
        created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, claimed_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS handovers_passport ON handovers(passport_id, created_at);
    `);
    if (!(this.db.prepare("PRAGMA table_info(repair_records)").all() as {name:string}[]).some(column=>column.name==="attempt")) {
      this.db.exec("ALTER TABLE repair_records ADD COLUMN attempt INTEGER NOT NULL DEFAULT 0");
    }
  }
  prepare(record: RepairRecord, requestKey: string, fingerprint: string) {
    this.db.prepare(`INSERT OR IGNORE INTO repair_records
      (id,passport_id,request_key,fingerprint,record_json,created_at) VALUES (?,?,?,?,?,?)`)
      .run(record.id, record.passportId, requestKey, fingerprint, JSON.stringify(record), record.createdAt);
    const row = this.db.prepare("SELECT record_json,fingerprint,blob_id,job_id,attempt FROM repair_records WHERE passport_id=? AND request_key=?")
      .get(record.passportId, requestKey) as StoredRow;
    if (row.fingerprint !== fingerprint) throw new Error("IDEMPOTENCY_CONFLICT");
    return { record: { ...JSON.parse(row.record_json), ...(row.blob_id ? { blobId: row.blob_id } : {}) } as RepairRecord, jobId: row.job_id, attempt: row.attempt };
  }
  setJob(id: string, jobId: string) { this.db.prepare("UPDATE repair_records SET job_id=? WHERE id=?").run(jobId, id); }
  retryFailed(id: string) { this.db.prepare("UPDATE repair_records SET job_id=NULL,attempt=attempt+1 WHERE id=? AND blob_id IS NULL").run(id); }
  confirm(record: RepairRecord, blobId: string) {
    this.db.prepare("UPDATE repair_records SET blob_id=?,record_json=? WHERE id=?")
      .run(blobId, JSON.stringify({ ...record, blobId }), record.id);
    return { ...record, blobId };
  }
  records(passportId: string): RepairRecord[] {
    return (this.db.prepare("SELECT record_json,blob_id FROM repair_records WHERE passport_id=? AND blob_id IS NOT NULL ORDER BY created_at,id")
      .all(passportId) as { record_json: string; blob_id: string }[])
      .map(row => ({ ...JSON.parse(row.record_json), blobId: row.blob_id }));
  }
  pending(passportId: string) {
    return this.db.prepare("SELECT count(*) AS count FROM repair_records WHERE passport_id=? AND blob_id IS NULL").get(passportId)?.count as number;
  }
  initialized(passportId: string) { return !!this.db.prepare("SELECT passport_id FROM initialized_devices WHERE passport_id=?").get(passportId); }
  initialize(passportId: string) { this.db.prepare("INSERT OR IGNORE INTO initialized_devices VALUES (?)").run(passportId); }
  consumeChallenge(nonce: string, expiresAt: number) {
    this.db.prepare("DELETE FROM used_challenges WHERE expires_at < ?").run(Date.now());
    return this.db.prepare("INSERT OR IGNORE INTO used_challenges VALUES (?,?)").run(nonce, expiresAt).changes === 1;
  }
  allow(bucket: string, limit: number, windowMs: number) {
    const now = Date.now();
    this.db.prepare("DELETE FROM request_limits WHERE reset_at < ?").run(now);
    const row = this.db.prepare(`INSERT INTO request_limits(bucket,count,reset_at) VALUES (?,1,?)
      ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count,reset_at`).get(bucket, now + windowMs) as {count:number;reset_at:number};
    return { allowed: row.count <= limit, retryAfter: Math.max(1, Math.ceil((row.reset_at-now)/1000)) };
  }
  saveAttestation(a: Attestation) {
    return this.db.prepare(`INSERT OR IGNORE INTO attestations (record_id,passport_id,signer,shop,message,signature,signed_at,blob_id)
      VALUES (?,?,?,?,?,?,?,?)`).run(a.recordId, a.passportId, a.signer, a.shop, a.message, a.signature, a.signedAt, a.blobId ?? null).changes === 1;
  }
  setAttestationBlob(recordId: string, blobId: string) { this.db.prepare("UPDATE attestations SET blob_id=? WHERE record_id=?").run(blobId, recordId); }
  attestations(passportId: string): Attestation[] {
    return (this.db.prepare("SELECT * FROM attestations WHERE passport_id=?").all(passportId) as Record<string, string | null>[]).map((r) => ({
      recordId: r.record_id!, passportId: r.passport_id!, signer: r.signer!, shop: r.shop!, message: r.message!, signature: r.signature!, signedAt: r.signed_at!, blobId: r.blob_id ?? undefined,
    }));
  }
  createHandover(id: string, passportId: string, seller: string, expiresAt: number) {
    this.db.prepare("INSERT OR IGNORE INTO handovers (id,passport_id,seller,created_at,expires_at) VALUES (?,?,?,?,?)").run(id, passportId, seller, Date.now(), expiresAt);
  }
  /** First signed-in wallet to open the link becomes the buyer; the link cannot be re-claimed. */
  claimHandover(id: string, buyer: string): Handover | null {
    this.db.prepare("UPDATE handovers SET buyer=?,claimed_at=? WHERE id=? AND buyer IS NULL AND expires_at>? AND seller<>?").run(buyer, Date.now(), id, Date.now(), buyer);
    return this.handover(id);
  }
  handover(id: string): Handover | null {
    const r = this.db.prepare("SELECT * FROM handovers WHERE id=?").get(id) as Record<string, string | number | null> | undefined;
    return r ? toHandover(r) : null;
  }
  latestHandover(passportId: string, seller: string): Handover | null {
    const r = this.db.prepare("SELECT * FROM handovers WHERE passport_id=? AND seller=? AND expires_at>? ORDER BY created_at DESC LIMIT 1").get(passportId, seller, Date.now()) as Record<string, string | number | null> | undefined;
    return r ? toHandover(r) : null;
  }
  cancelHandovers(passportId: string, seller: string) { this.db.prepare("UPDATE handovers SET expires_at=0 WHERE passport_id=? AND seller=?").run(passportId, seller); }
  close() { this.db.close(); }
}

export type Attestation = { recordId: string; passportId: string; signer: string; shop: string; message: string; signature: string; signedAt: string; blobId?: string };
export type Handover = { id: string; passportId: string; seller: string; buyer: string | null; createdAt: number; expiresAt: number; claimedAt: number | null };
function toHandover(r: Record<string, string | number | null>): Handover {
  return { id: String(r.id), passportId: String(r.passport_id), seller: String(r.seller), buyer: r.buyer ? String(r.buyer) : null, createdAt: Number(r.created_at), expiresAt: Number(r.expires_at), claimedAt: r.claimed_at == null ? null : Number(r.claimed_at) };
}

let singleton: RecordLedger | undefined;
export function ledger() {
  return singleton ??= new RecordLedger(resolve(process.env.RETRACE_DATA_DIR || resolve(process.cwd(), ".data"), "retrace.sqlite"));
}
