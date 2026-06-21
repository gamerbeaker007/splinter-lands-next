import { DecPowerDirection } from "@/lib/backend/actions/land-manager/dec-power-actions";
import { Bolt, FlashOff } from "@mui/icons-material";
import { SvgIconComponent } from "@mui/icons-material";

export interface DecPowerVariant {
  /** "Stake" / "Unstake" — button + confirm labels. */
  verb: string;
  /** "Staked" / "Unstaked" — past-tense for result alerts. */
  pastVerb: string;
  /** "Staking" / "Unstaking" — gerund for the harvest warning. */
  gerund: string;
  /** MUI palette color used for the button, dialog action, and amount column. */
  color: "info" | "warning";
  icon: SvgIconComponent;
  /** Header for the per-region amount column. */
  amountHeader: string;
  /** Shown in the dialog when the plan is empty. */
  emptyMessage: string;
  /** Tooltip when the action is available. */
  enabledTooltip: string;
  /** Tooltip when there's nothing to do. */
  disabledTooltip: string;
  /** Stake spends DEC (show balance + insufficient guard); unstake returns it. */
  showBalance: boolean;
}

export const DEC_POWER_VARIANTS: Record<DecPowerDirection, DecPowerVariant> = {
  up: {
    verb: "Stake",
    pastVerb: "Staked",
    gerund: "Staking",
    color: "info",
    icon: Bolt,
    amountHeader: "Stake",
    emptyMessage:
      "No DEC stake shortfall in any enabled region. Nothing to stake.",
    enabledTooltip: "Stake DEC into regions short of needed stake",
    disabledTooltip: "No DEC stake shortfall in enabled regions",
    showBalance: true,
  },
  down: {
    verb: "Unstake",
    pastVerb: "Unstaked",
    gerund: "Unstaking",
    color: "warning",
    icon: FlashOff,
    amountHeader: "Unstake",
    emptyMessage: "No DEC excess in any enabled region. Nothing to unstake.",
    enabledTooltip:
      "Power down (unstake) DEC from regions staked beyond needed",
    disabledTooltip: "No DEC stake excess in enabled regions",
    showBalance: false,
  },
};
