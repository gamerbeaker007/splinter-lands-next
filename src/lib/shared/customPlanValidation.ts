import {
  computeDecNeededForResource,
  computeSwapAmounts,
} from "@/lib/shared/landManagerUtils";
import {
  computePoolHolding,
  floorSharesOut,
  MIN_SHARES_OUT,
  sharesFractionForResource,
} from "@/lib/shared/poolPositionUtils";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import {
  CustomPlanRowDraft,
  CustomPlanRowValidation,
  CustomPlanStatus,
  CustomPlanValidationResult,
} from "@/types/landManager";
import { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";

/** regionUid -> symbol -> stored balance */
export type RegionBalanceLedger = Map<string, Map<string, number>>;

interface PoolLedgerEntry {
  unlockedResource: number;
  usedFraction: number;
}

function emptyRowValidation(
  error: string | null = null
): CustomPlanRowValidation {
  return {
    valid: false,
    resolvedAmount: 0,
    estimatedValue: 0,
    currentBalance: 0,
    inputBalance: 0,
    balanceSymbol: "",
    inputAmountAbsolute: 0,
    estimatedOutputSymbol: "",
    estimatedOutputAmount: 0,
    error,
  };
}

export function buildLedger(
  balances: Record<string, Record<string, number>>
): RegionBalanceLedger {
  const ledger: RegionBalanceLedger = new Map();
  for (const [regionUid, symbolMap] of Object.entries(balances)) {
    const inner = new Map<string, number>();
    for (const sym of NATURAL_RESOURCES) {
      inner.set(sym, symbolMap[sym] ?? 0);
    }
    ledger.set(regionUid, inner);
  }
  return ledger;
}

function ledgerGet(
  ledger: RegionBalanceLedger,
  regionUid: string,
  symbol: string
): number {
  return ledger.get(regionUid)?.get(symbol) ?? 0;
}

function ledgerDeduct(
  ledger: RegionBalanceLedger,
  regionUid: string,
  symbol: string,
  amount: number
): void {
  const inner = ledger.get(regionUid);
  if (!inner) return;
  const current = inner.get(symbol) ?? 0;
  inner.set(symbol, Math.max(0, current - amount));
}

export function isRowEmpty(draft: CustomPlanRowDraft): boolean {
  return (
    !draft.action_type &&
    !draft.from_region_uid &&
    !draft.to_region_uid &&
    !draft.from_resource &&
    !draft.to_resource &&
    !draft.amount
  );
}

export function isRowComplete(draft: CustomPlanRowDraft): boolean {
  if (!draft.action_type) return false;

  const raw = parseInt(draft.amount, 10);
  const hasPositiveAmount = Number.isFinite(raw) && raw > 0;

  switch (draft.action_type) {
    case "transfer":
      return !!(
        draft.from_region_uid &&
        draft.to_region_uid &&
        draft.from_resource &&
        hasPositiveAmount &&
        draft.from_region_uid !== draft.to_region_uid
      );
    case "pool":
      return !!(
        draft.from_region_uid &&
        draft.from_resource &&
        hasPositiveAmount
      );
    case "buy":
      return !!(
        draft.to_region_uid &&
        draft.from_resource &&
        hasPositiveAmount &&
        draft.amount_type === "abs"
      );
    case "sell":
      return !!(
        draft.from_region_uid &&
        draft.from_resource &&
        hasPositiveAmount
      );
    case "swap":
      return !!(
        draft.from_region_uid &&
        draft.to_region_uid &&
        draft.from_resource &&
        draft.to_resource &&
        draft.from_resource !== draft.to_resource &&
        hasPositiveAmount
      );
    case "pool_withdraw":
      return !!(
        draft.to_region_uid &&
        draft.from_resource &&
        hasPositiveAmount
      );
    default:
      return false;
  }
}

function parseAndScaleInput(
  draft: CustomPlanRowDraft,
  sourceBalance: number,
  multiplier: number
): number {
  const raw = parseInt(draft.amount, 10);
  if (!Number.isFinite(raw) || raw <= 0) return 0;

  let baseAmount = raw;
  if (draft.amount_type === "pct") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 100) return 0;
    baseAmount = Math.floor((raw / 100) * sourceBalance);
  }

  const scaled = Math.floor(baseAmount * multiplier);
  return scaled;
}

function initPoolLedger(
  pools: SplLandPool[],
  poolPositions: Record<string, SplPlayerPoolPosition>
): Map<string, PoolLedgerEntry> {
  const map = new Map<string, PoolLedgerEntry>();
  for (const symbol of NATURAL_RESOURCES) {
    const holding = computePoolHolding(poolPositions[symbol], pools);
    map.set(symbol, {
      unlockedResource: holding.unlockedResource,
      usedFraction: 0,
    });
  }
  return map;
}

interface ValidatePlanOptions {
  multiplier?: number;
  poolPositions?: Record<string, SplPlayerPoolPosition>;
}

export function validateCustomPlan(
  rows: CustomPlanRowDraft[],
  balances: Record<string, Record<string, number>>,
  decBalance: number,
  pools: SplLandPool[],
  options?: ValidatePlanOptions
): CustomPlanValidationResult {
  const multiplier = options?.multiplier ?? 1;
  const poolPositions = options?.poolPositions ?? {};

  const configuredRows = rows.filter((r) => !isRowEmpty(r));
  const incompleteExists = configuredRows.some((r) => !isRowComplete(r));

  if (configuredRows.length === 0) {
    return {
      rows: rows.map(() => emptyRowValidation()),
      status: "empty",
    };
  }

  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    return {
      rows: rows.map(() =>
        emptyRowValidation("Multiplier must be a positive number")
      ),
      status: "invalid",
    };
  }

  const ledger = buildLedger(balances);
  const poolLedger = initPoolLedger(pools, poolPositions);
  let runningDec = decBalance;

  const results: CustomPlanRowValidation[] = rows.map((draft) => {
    if (isRowEmpty(draft)) return emptyRowValidation();
    if (!isRowComplete(draft)) return emptyRowValidation("Row is incomplete");

    switch (draft.action_type) {
      case "transfer": {
        const base =
          balances[draft.from_region_uid]?.[draft.from_resource] ?? 0;
        const resolved = parseAndScaleInput(draft, base, multiplier);
        const current = ledgerGet(
          ledger,
          draft.from_region_uid,
          draft.from_resource
        );
        if (resolved <= 0)
          return emptyRowValidation("Amount must resolve to at least 1");
        if (resolved > current) {
          const invalid = emptyRowValidation(
            `Insufficient ${draft.from_resource} in source region (need ${resolved}, have ${current})`
          );
          invalid.resolvedAmount = resolved;
          invalid.currentBalance = current;
          invalid.inputBalance = current;
          invalid.balanceSymbol = draft.from_resource;
          invalid.inputAmountAbsolute = resolved;
          invalid.estimatedOutputSymbol = draft.from_resource;
          return invalid;
        }
        const out = computeSwapAmounts(
          pools,
          draft.from_resource,
          draft.from_resource,
          resolved
        ).out_amount_2;
        ledgerDeduct(
          ledger,
          draft.from_region_uid,
          draft.from_resource,
          resolved
        );
        return {
          valid: true,
          resolvedAmount: resolved,
          estimatedValue: out,
          currentBalance: current,
          inputBalance: current - resolved,
          balanceSymbol: draft.from_resource,
          inputAmountAbsolute: resolved,
          estimatedOutputSymbol: draft.from_resource,
          estimatedOutputAmount: out,
          error: null,
        };
      }

      case "pool": {
        const base =
          balances[draft.from_region_uid]?.[draft.from_resource] ?? 0;
        const resolved = parseAndScaleInput(draft, base, multiplier);
        const current = ledgerGet(
          ledger,
          draft.from_region_uid,
          draft.from_resource
        );
        if (resolved <= 0)
          return emptyRowValidation("Amount must resolve to at least 1");
        if (resolved > current) {
          const invalid = emptyRowValidation(
            `Insufficient ${draft.from_resource} in source region (need ${resolved}, have ${current})`
          );
          invalid.resolvedAmount = resolved;
          invalid.currentBalance = current;
          invalid.inputBalance = current;
          invalid.balanceSymbol = draft.from_resource;
          invalid.inputAmountAbsolute = resolved;
          invalid.estimatedOutputSymbol = "DEC";
          return invalid;
        }

        const decNeeded = computeDecNeededForResource(
          pools,
          draft.from_resource,
          resolved
        );
        if (!Number.isFinite(decNeeded))
          return emptyRowValidation("Pool not available for this resource");
        if (decNeeded > runningDec) {
          const invalid = emptyRowValidation(
            `Insufficient DEC (need ~${decNeeded.toFixed(0)}, have ${runningDec.toFixed(0)})`
          );
          invalid.resolvedAmount = resolved;
          invalid.currentBalance = current;
          invalid.inputBalance = current;
          invalid.balanceSymbol = draft.from_resource;
          invalid.inputAmountAbsolute = resolved;
          invalid.estimatedOutputSymbol = "DEC";
          invalid.estimatedOutputAmount = decNeeded;
          invalid.estimatedValue = decNeeded;
          return invalid;
        }

        ledgerDeduct(
          ledger,
          draft.from_region_uid,
          draft.from_resource,
          resolved
        );
        runningDec -= decNeeded;
        return {
          valid: true,
          resolvedAmount: resolved,
          estimatedValue: decNeeded,
          currentBalance: current,
          inputBalance: current - resolved,
          balanceSymbol: draft.from_resource,
          inputAmountAbsolute: resolved,
          estimatedOutputSymbol: "DEC",
          estimatedOutputAmount: decNeeded,
          error: null,
        };
      }

      case "buy": {
        const desiredOut = parseAndScaleInput(draft, 0, multiplier);
        const currentDec = runningDec;
        if (desiredOut <= 0)
          return emptyRowValidation("Amount must resolve to at least 1");

        const decNeeded = computeDecNeededForResource(
          pools,
          draft.from_resource,
          desiredOut
        );
        if (!Number.isFinite(decNeeded))
          return emptyRowValidation("Pool not available for this resource");
        if (decNeeded > currentDec) {
          const invalid = emptyRowValidation(
            `Insufficient DEC (need ~${decNeeded.toFixed(0)}, have ${currentDec.toFixed(0)})`
          );
          invalid.resolvedAmount = desiredOut;
          invalid.currentBalance = currentDec;
          invalid.inputBalance = currentDec;
          invalid.balanceSymbol = "DEC";
          invalid.inputAmountAbsolute = decNeeded;
          invalid.estimatedOutputSymbol = draft.from_resource;
          invalid.estimatedOutputAmount = desiredOut;
          invalid.estimatedValue = decNeeded;
          return invalid;
        }

        runningDec -= decNeeded;
        return {
          valid: true,
          resolvedAmount: desiredOut,
          estimatedValue: decNeeded,
          currentBalance: currentDec,
          inputBalance: currentDec - decNeeded,
          balanceSymbol: "DEC",
          inputAmountAbsolute: decNeeded,
          estimatedOutputSymbol: draft.from_resource,
          estimatedOutputAmount: desiredOut,
          error: null,
        };
      }

      case "sell": {
        const base =
          balances[draft.from_region_uid]?.[draft.from_resource] ?? 0;
        const resolved = parseAndScaleInput(draft, base, multiplier);
        const current = ledgerGet(
          ledger,
          draft.from_region_uid,
          draft.from_resource
        );
        if (resolved <= 0)
          return emptyRowValidation("Amount must resolve to at least 1");
        if (resolved > current) {
          const invalid = emptyRowValidation(
            `Insufficient ${draft.from_resource} (need ${resolved}, have ${current})`
          );
          invalid.resolvedAmount = resolved;
          invalid.currentBalance = current;
          invalid.inputBalance = current;
          invalid.balanceSymbol = draft.from_resource;
          invalid.inputAmountAbsolute = resolved;
          invalid.estimatedOutputSymbol = "DEC";
          return invalid;
        }

        const decOut = computeSwapAmounts(
          pools,
          draft.from_resource,
          "DEC",
          resolved
        ).out_amount_2;
        ledgerDeduct(
          ledger,
          draft.from_region_uid,
          draft.from_resource,
          resolved
        );
        return {
          valid: true,
          resolvedAmount: resolved,
          estimatedValue: decOut,
          currentBalance: current,
          inputBalance: current - resolved,
          balanceSymbol: draft.from_resource,
          inputAmountAbsolute: resolved,
          estimatedOutputSymbol: "DEC",
          estimatedOutputAmount: decOut,
          error: null,
        };
      }

      case "swap": {
        const base =
          balances[draft.from_region_uid]?.[draft.from_resource] ?? 0;
        const resolved = parseAndScaleInput(draft, base, multiplier);
        const current = ledgerGet(
          ledger,
          draft.from_region_uid,
          draft.from_resource
        );
        if (resolved <= 0)
          return emptyRowValidation("Amount must resolve to at least 1");
        if (resolved > current) {
          const invalid = emptyRowValidation(
            `Insufficient ${draft.from_resource} (need ${resolved}, have ${current})`
          );
          invalid.resolvedAmount = resolved;
          invalid.currentBalance = current;
          invalid.inputBalance = current;
          invalid.balanceSymbol = draft.from_resource;
          invalid.inputAmountAbsolute = resolved;
          invalid.estimatedOutputSymbol = draft.to_resource;
          return invalid;
        }

        const swap = computeSwapAmounts(
          pools,
          draft.from_resource,
          draft.to_resource,
          resolved
        );
        ledgerDeduct(
          ledger,
          draft.from_region_uid,
          draft.from_resource,
          resolved
        );
        return {
          valid: true,
          resolvedAmount: resolved,
          estimatedValue: swap.out_amount_2,
          currentBalance: current,
          inputBalance: current - resolved,
          balanceSymbol: draft.from_resource,
          inputAmountAbsolute: resolved,
          estimatedOutputSymbol: draft.to_resource,
          estimatedOutputAmount: swap.out_amount_2,
          error: null,
        };
      }

      case "pool_withdraw": {
        const symbol = draft.from_resource;
        const entry = poolLedger.get(symbol) ?? {
          unlockedResource: 0,
          usedFraction: 0,
        };
        const holding = computePoolHolding(poolPositions[symbol], pools);
        const resolved = parseAndScaleInput(
          draft,
          holding.unlockedResource,
          multiplier
        );
        const current = entry.unlockedResource;
        if (resolved <= 0)
          return emptyRowValidation("Amount must resolve to at least 1");
        if (resolved > current) {
          const invalid = emptyRowValidation(
            `Insufficient unlocked ${symbol} in pool position (need ${resolved}, have ${current.toFixed(3)})`
          );
          invalid.resolvedAmount = resolved;
          invalid.currentBalance = current;
          invalid.inputBalance = current;
          invalid.balanceSymbol = symbol;
          invalid.inputAmountAbsolute = resolved;
          invalid.estimatedOutputSymbol = symbol;
          return invalid;
        }

        const fraction = sharesFractionForResource(
          holding,
          resolved,
          entry.usedFraction
        );
        if (fraction <= 0) {
          return emptyRowValidation(
            "No unlocked pool shares available to withdraw"
          );
        }
        // Truncated to the precision the chain reads — see floorSharesOut.
        const sharesOut = floorSharesOut(fraction);
        if (sharesOut < MIN_SHARES_OUT) {
          return emptyRowValidation(
            `Withdrawal too small for chain precision (minimum is ${MIN_SHARES_OUT * 100}% of the position)`
          );
        }

        const resourceOut = holding.resource * sharesOut;
        const decOut = holding.dec * sharesOut;
        poolLedger.set(symbol, {
          unlockedResource: Math.max(0, current - resourceOut),
          usedFraction: entry.usedFraction + sharesOut,
        });

        return {
          valid: true,
          resolvedAmount: resolved,
          estimatedValue: resourceOut,
          currentBalance: current,
          inputBalance: Math.max(0, current - resourceOut),
          balanceSymbol: symbol,
          inputAmountAbsolute: resolved,
          estimatedOutputSymbol: symbol,
          estimatedOutputAmount: resourceOut,
          estimatedOutputSymbol2: "DEC",
          estimatedOutputAmount2: decOut,
          poolSharesOut: sharesOut,
          error: null,
        };
      }

      default:
        return emptyRowValidation("Unknown action type");
    }
  });

  const configuredResults = results.filter((_, i) => !isRowEmpty(rows[i]));
  let status: CustomPlanStatus;
  if (configuredResults.length === 0) status = "empty";
  else if (incompleteExists) status = "incomplete";
  else if (configuredResults.every((r) => r.valid)) status = "valid";
  else status = "invalid";

  return { rows: results, status };
}
