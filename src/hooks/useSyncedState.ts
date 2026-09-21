"use client";

import { Dispatch, SetStateAction, useState } from "react";

/**
 * Local state that follows a value owned by someone else (a prop, or context).
 *
 * Use it for the "editable copy of a prop" case: the component keeps its own
 * working value, but whenever `source` changes identity the copy is reset from
 * it. Adjusting the copy while rendering — rather than in an effect — is
 * React's documented answer here: the reset lands in the same render pass
 * instead of causing a second one (see `react-hooks/set-state-in-effect`).
 *
 * `source` is compared with `Object.is`, so a prop that is rebuilt on every
 * parent render will reset the copy on every render. Pass a primitive, or a
 * stable object, and derive with `derive` if the state is not the source
 * itself.
 */
export function useSyncedState<T>(source: T): [T, Dispatch<SetStateAction<T>>] {
  return useDerivedState(source, identity);
}

/**
 * {@link useSyncedState} for state that is computed from the source rather
 * than being it — e.g. a list of worker uids pulled out of a deed.
 *
 * `derive` is only called when `source` changes identity (and on mount).
 */
export function useDerivedState<S, T>(
  source: S,
  derive: (source: S) => T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => derive(source));
  const [seen, setSeen] = useState(source);

  if (!Object.is(seen, source)) {
    setSeen(source);
    setValue(derive(source));
  }

  return [value, setValue];
}

function identity<T>(value: T): T {
  return value;
}
