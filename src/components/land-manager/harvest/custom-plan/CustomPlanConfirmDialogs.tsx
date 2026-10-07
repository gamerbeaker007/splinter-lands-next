import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

export function DeletePlanDialog({
  open,
  planName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  planName: string | undefined;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Delete plan?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Delete &ldquo;{planName}&rdquo;? This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export type UnsavedChoice = "cancel" | "save_only" | "execute" | "save_execute";

export function UnsavedChangesDialog({
  open,
  canSave,
  canExecute,
  onChoice,
}: {
  open: boolean;
  canSave: boolean;
  canExecute: boolean;
  onChoice: (choice: UnsavedChoice) => void;
}) {
  return (
    <Dialog open={open} onClose={() => onChoice("cancel")}>
      <DialogTitle>Unsaved changes</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This plan has unsaved changes. What would you like to do?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ gap: 0.5, flexWrap: "wrap" }}>
        <Button onClick={() => onChoice("cancel")}>Cancel</Button>
        {canSave && (
          <Button variant="outlined" onClick={() => onChoice("save_only")}>
            Save Only
          </Button>
        )}
        <Button
          variant="outlined"
          color="secondary"
          disabled={!canExecute}
          onClick={() => onChoice("execute")}
        >
          Execute without saving
        </Button>
        {canSave && (
          <Button
            variant="contained"
            color="secondary"
            disabled={!canExecute}
            onClick={() => onChoice("save_execute")}
          >
            Save &amp; Execute
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
