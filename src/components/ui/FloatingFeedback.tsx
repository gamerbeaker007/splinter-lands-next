"use client";

import { Portal, Snackbar, Stack } from "@mui/material";
import {
  Children,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";

interface Props {
  /** Float above the page instead of rendering inline. */
  floating: boolean;
  /** Changes when a new message is created, so updates replace the active toast. */
  feedbackKey: unknown;
  /** The feedback (Alerts); null / false children count as nothing to show. */
  children: ReactNode;
}

interface ActiveFeedback {
  owner: string;
  children: ReactNode;
}

let activeFeedback: ActiveFeedback | null = null;
const subscribers = new Set<() => void>();

function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  return activeFeedback;
}

function updateFeedback(next: ActiveFeedback | null) {
  activeFeedback = next;
  subscribers.forEach((notify) => notify());
}

function clearFeedback(owner: string) {
  if (activeFeedback?.owner === owner) updateFeedback(null);
}

/**
 * Action feedback for controls that may live in a menu: the menu closes before
 * the action runs, so inline Alerts there are never seen. Only the newest
 * floating message is shown; it replaces any older, undismissed message.
 */
export default function FloatingFeedback({
  floating,
  feedbackKey,
  children,
}: Props) {
  const owner = useId();
  const latestChildren = useRef(children);
  const hasChildren = Children.toArray(children).length > 0;
  const active = useSyncExternalStore(subscribe, getSnapshot, () => null);

  useEffect(() => {
    latestChildren.current = children;
  });

  useEffect(() => {
    if (!floating || !hasChildren) {
      clearFeedback(owner);
      return;
    }

    updateFeedback({ owner, children: latestChildren.current });
    return () => clearFeedback(owner);
  }, [floating, feedbackKey, hasChildren, owner]);

  if (!floating) return <>{children}</>;
  if (active?.owner !== owner) return null;

  return (
    <Portal>
      <Snackbar
        open
        onClose={() => clearFeedback(owner)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Stack gap={1} sx={{ maxWidth: 560 }}>
          {active.children}
        </Stack>
      </Snackbar>
    </Portal>
  );
}
