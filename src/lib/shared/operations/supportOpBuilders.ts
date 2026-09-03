import { DONATION_MEMO } from "@/constants/support";
import { generateNonce } from "./opBuilders";

const APP = `${process.env.NEXT_PUBLIC_APP_NAME ?? "splinter-lands"}/${process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}`;

/** Approve a Splinterlands validator. Requires active key. */
export function buildApproveValidatorOp(
  username: string,
  validatorName: string
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [username],
      required_posting_auths: [],
      id: "sm_approve_validator",
      json: JSON.stringify({
        account_name: validatorName,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

/** Unapprove (remove vote for) a Splinterlands validator. Requires active key. */
export function buildUnapproveValidatorOp(
  username: string,
  validatorName: string
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [username],
      required_posting_auths: [],
      id: "sm_unapprove_validator",
      json: JSON.stringify({
        account_name: validatorName,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

/** Splinterlands token transfer (DEC or SPS). Requires active key. */
export function buildTokenTransferOp(
  username: string,
  token: "DEC" | "SPS",
  to: string,
  qty: number
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [username],
      required_posting_auths: [],
      id: "sm_token_transfer",
      json: JSON.stringify({
        token,
        to,
        qty,
        memo: DONATION_MEMO,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

/** Standard Hive transfer operation (HIVE or HBD). Requires active key. */
export function buildHiveTransferOp(
  from: string,
  to: string,
  amount: number,
  currency: "HIVE" | "HBD"
): [string, object] {
  return [
    "transfer",
    {
      from,
      to,
      amount: `${amount.toFixed(3)} ${currency}`,
      memo: DONATION_MEMO,
    },
  ];
}
