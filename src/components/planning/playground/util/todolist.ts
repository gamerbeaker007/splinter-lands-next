import { SlotInput } from "@/types/planner";
import { DeedChange, WorkerMovement } from "@/types/playground";

export function generateTodoListText(
  groupedChanges: Map<string, DeedChange[]>,
  workerMovements: WorkerMovement[],
  checkedItems: Set<number>,
  formatValue: (value: number | string | SlotInput | null) => string
): string {
  let content = "SPLINTERLANDS DEED CHANGES TODO LIST\n";
  content += "=====================================\n";
  content += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Add changes by plot
  content += "CHANGES BY PLOT\n";
  content += "===============\n\n";

  let plotNumber = 1;
  Array.from(groupedChanges.entries()).forEach(([plotId, plotChanges]) => {
    content += `Plot ${plotNumber}: ${plotId}\n`;
    content += "-".repeat(plotId.length + 8) + "\n";

    plotChanges.forEach((change, idx) => {
      const globalIndex = (plotNumber - 1) * 100 + idx;
      const checkbox = checkedItems.has(globalIndex) ? "[✓]" : "[ ]";
      const oldVal = formatValue(change.oldValue);
      const newVal = formatValue(change.newValue);

      // Check if this change involves a worker with cooldown
      const getCardUidFromValue = (
        value: number | string | SlotInput | null
      ): string | null => {
        if (!value) return null;
        if (typeof value === "string") return value;
        if (typeof value === "number") return String(value);
        const slotInput = value as SlotInput;
        return slotInput.uid || null;
      };

      const newCardUid = getCardUidFromValue(change.newValue);

      // Only show cooldown warning when worker is being added (To field)
      const hasCooldown = newCardUid
        ? workerMovements.some((m) => m.cardUid === newCardUid)
        : false;

      const cooldownWarning = hasCooldown ? " ⚠️ [3-DAY COOLDOWN]" : "";

      content += `${checkbox} ${idx + 1}. Update ${change.field}: ${oldVal} → ${newVal}${cooldownWarning}\n`;
    });

    content += "\n";
    plotNumber++;
  });

  content += "\n";
  content += `Total Changes: ${Array.from(groupedChanges.values()).reduce((sum, changes) => sum + changes.length, 0)}\n`;
  content += `Completed: ${checkedItems.size}\n`;

  return content;
}
