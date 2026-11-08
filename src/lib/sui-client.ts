import "server-only";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { config } from "./config";
import { tatumGraphqlUrl } from "./tatum";

let client: SuiGraphQLClient | null = null;
/** Server-side Sui client over Tatum (needed to verify zkLogin signatures from Google sign-in). */
export function suiClient() {
  return (client ??= new SuiGraphQLClient({ url: tatumGraphqlUrl(), headers: { "x-api-key": config.tatumApiKey() }, network: "mainnet" }));
}

/** Only zkLogin signatures need a client to verify; plain wallet signatures verify offline. */
export function suiClientIfConfigured() {
  return process.env.TATUM_API_KEY ? suiClient() : undefined;
}
