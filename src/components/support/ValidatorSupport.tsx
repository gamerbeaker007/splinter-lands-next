"use client";

import {
  MAX_VALIDATOR_VOTES,
  SUPPORT_VALIDATOR,
  SUPPORT_VALIDATOR_BRAND,
} from "@/constants/support";
import { getValidatorVotes } from "@/lib/backend/actions/support/support-actions";
import type { ValidatorVote } from "@/lib/backend/api/spl/spl-validator-api";
import {
  broadcastOperations,
  KeychainKeyTypes,
} from "@/lib/frontend/splBroadcast";
import {
  buildApproveValidatorOp,
  buildUnapproveValidatorOp,
} from "@/lib/shared/operations/supportOpBuilders";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

interface Props {
  username: string | null;
  authLoading: boolean;
  onMessage: (
    msg: string,
    severity?: "success" | "error" | "info" | "warning"
  ) => void;
}

type VotesState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; error: string }
  | { kind: "loaded"; votes: ValidatorVote[] };

export default function ValidatorSupport({
  username,
  authLoading,
  onMessage,
}: Props) {
  const [votesState, setVotesState] = useState<VotesState>({ kind: "idle" });
  const [pendingVote, setPendingVote] = useState<string | null>(null);

  const loadVotes = useCallback(async () => {
    if (!username) {
      setVotesState({ kind: "idle" });
      return;
    }

    setVotesState({ kind: "loading" });
    const result = await getValidatorVotes();
    if (result.error) {
      setVotesState({ kind: "error", error: result.error });
      return;
    }
    setVotesState({ kind: "loaded", votes: result.votes });
  }, [username]);

  useEffect(() => {
    if (!authLoading && username) {
      void loadVotes();
      return;
    }
    if (!authLoading && !username) {
      setVotesState({ kind: "idle" });
    }
  }, [authLoading, username, loadVotes]);

  const waitForVotes = useCallback(
    async (isVerified: (votes: ValidatorVote[]) => boolean) => {
      const maxAttempts = 15;
      const delayMs = 3000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const refreshed = await getValidatorVotes();
        if (!refreshed.error) {
          setVotesState({ kind: "loaded", votes: refreshed.votes });
          if (isVerified(refreshed.votes)) {
            return true;
          }
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      return false;
    },
    []
  );

  const handleVote = async () => {
    if (!username) return;

    setPendingVote(SUPPORT_VALIDATOR);
    try {
      const result = await broadcastOperations(
        username,
        [buildApproveValidatorOp(username, SUPPORT_VALIDATOR)],
        KeychainKeyTypes.active
      );

      if (!result.success) {
        onMessage(result.error ?? "Vote failed", "error");
        return;
      }

      const verified = await waitForVotes((votes) =>
        votes.some(
          (vote) =>
            vote.validator.toLowerCase() === SUPPORT_VALIDATOR.toLowerCase()
        )
      );

      if (verified) {
        onMessage(
          `Vote for ${SUPPORT_VALIDATOR_BRAND} was recorded.`,
          "success"
        );
      } else {
        onMessage(
          "Vote was broadcast, but validator data is still syncing.",
          "info"
        );
        await loadVotes();
      }
    } catch (err) {
      onMessage(err instanceof Error ? err.message : "Vote failed", "error");
    } finally {
      setPendingVote(null);
    }
  };

  const handleUnvote = async (validator: string) => {
    if (!username) return;

    setPendingVote(validator);
    try {
      const result = await broadcastOperations(
        username,
        [buildUnapproveValidatorOp(username, validator)],
        KeychainKeyTypes.active
      );

      if (!result.success) {
        onMessage(result.error ?? "Unvote failed", "error");
        return;
      }

      const verified = await waitForVotes(
        (votes) =>
          !votes.some(
            (vote) => vote.validator.toLowerCase() === validator.toLowerCase()
          )
      );

      if (verified) {
        onMessage(`Removed vote for ${validator}`, "success");
      } else {
        onMessage(
          "Unvote was broadcast, but validator data is still syncing.",
          "info"
        );
        await loadVotes();
      }
    } catch (err) {
      onMessage(err instanceof Error ? err.message : "Unvote failed", "error");
    } finally {
      setPendingVote(null);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <HowToVoteIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Support {SUPPORT_VALIDATOR_BRAND}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Support <strong>{SUPPORT_VALIDATOR_BRAND}</strong> by voting for{" "}
          {SUPPORT_VALIDATOR}&apos;s validator.
        </Typography>

        {authLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!username && !authLoading && (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Tooltip title="Log in first to vote.">
              <span>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<HowToVoteIcon />}
                  disabled
                >
                  Vote for {SUPPORT_VALIDATOR_BRAND}
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}

        {username && !authLoading && (
          <>
            {votesState.kind === "loading" && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {votesState.kind === "error" && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Could not load validator votes: {votesState.error}
              </Alert>
            )}

            {votesState.kind === "loaded" && (
              <VotesContent
                votes={votesState.votes}
                pendingVote={pendingVote}
                onVote={handleVote}
                onUnvote={handleUnvote}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface VotesContentProps {
  votes: ValidatorVote[];
  pendingVote: string | null;
  onVote: () => void;
  onUnvote: (validator: string) => void;
}

function VotesContent({
  votes,
  pendingVote,
  onVote,
  onUnvote,
}: VotesContentProps) {
  const alreadyVoted = votes.some(
    (vote) => vote.validator.toLowerCase() === SUPPORT_VALIDATOR.toLowerCase()
  );

  if (alreadyVoted) {
    return (
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <CheckCircleIcon color="success" sx={{ mt: 0.3 }} />
        <Typography>
          You already support <strong>{SUPPORT_VALIDATOR_BRAND}</strong> through
          validator voting.
        </Typography>
      </Box>
    );
  }

  const reachedLimit = votes.length >= MAX_VALIDATOR_VOTES;

  if (!reachedLimit) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          size="large"
          startIcon={
            pendingVote === SUPPORT_VALIDATOR ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <HowToVoteIcon />
            )
          }
          disabled={pendingVote !== null}
          onClick={onVote}
        >
          Vote for {SUPPORT_VALIDATOR_BRAND}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>
        You have reached the {MAX_VALIDATOR_VOTES}-validator limit. Unvote one
        validator first, then vote for{" "}
        <strong>{SUPPORT_VALIDATOR_BRAND}</strong>.
      </Alert>
      <Divider sx={{ mb: 1 }} />
      <List dense disablePadding>
        {votes.map((vote) => (
          <ListItem
            key={vote.validator}
            sx={{
              py: 0,
              px: 0,
              mb: 0,
              borderBottom: "1px dashed",
            }}
            secondaryAction={
              <Button
                size="small"
                variant="outlined"
                color="warning"
                disabled={pendingVote !== null}
                onClick={() => onUnvote(vote.validator)}
                startIcon={
                  pendingVote === vote.validator ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : undefined
                }
              >
                Unvote
              </Button>
            }
          >
            <ListItemText
              primary={vote.validator}
              secondary={`Weight: ${Number(vote.vote_weight).toLocaleString()}`}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<HowToVoteIcon />}
          disabled
        >
          Vote for {SUPPORT_VALIDATOR_BRAND}
        </Button>
      </Box>
    </Box>
  );
}
