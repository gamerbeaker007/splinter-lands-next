import { Client } from "@hiveio/dhive";
import logger from "../../log/logger.server";

const HIVE_NODES = [
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://rpc.mahdiyari.info",
  "https://api.deathwing.me",
];

export interface HiveAccountBalances {
  hive: number;
  hbd: number;
}

export async function fetchHiveAccountBalances(
  username: string
): Promise<HiveAccountBalances> {
  const client = new Client(HIVE_NODES);
  logger.info(`Fetch Hive account balances for: ${username}`);
  const accounts = await client.database.getAccounts([username]);
  if (!accounts || accounts.length === 0) {
    throw new Error(`Hive account not found: ${username}`);
  }
  const account = accounts[0];
  const hive = parseFloat(String(account.balance).split(" ")[0]) || 0;
  const hbd = parseFloat(String(account.hbd_balance).split(" ")[0]) || 0;
  return { hive, hbd };
}
