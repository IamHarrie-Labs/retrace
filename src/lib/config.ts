import "server-only";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return v;
}

export const config = {
  tatumApiKey: () => required("TATUM_API_KEY"),
  tatumSuiRpc: process.env.TATUM_SUI_RPC_URL ?? "https://sui-mainnet.gateway.tatum.io",
  memwalKey: () => required("MEMWAL_PRIVATE_KEY"),
  memwalAccountId: () => required("MEMWAL_ACCOUNT_ID"),
  memwalServerUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
  packageId: () => required("NEXT_PUBLIC_RETRACE_PACKAGE_ID"),
  registryId: () => required("NEXT_PUBLIC_RETRACE_REGISTRY_ID"),
  serialPepper: () => required("SERIAL_PEPPER"),
  sessionSecret: () => required("SESSION_SECRET"),
  /** Checkpoint just before the Retrace package was published; event scans start here. */
  packageCheckpoint: Number(process.env.RETRACE_PACKAGE_CHECKPOINT ?? 342751141),
};

export function passportType(): string {
  return `${config.packageId()}::passport::DevicePassport`;
}
