"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearFormDraft,
  readFormDraft,
  resolveFormDraftKey,
  sanitizeDraftValues,
  writeFormDraft,
} from "@/lib/forms/persisted-form.mjs";

type StorageKind = "local" | "session";

type UsePersistedFormOptions<T extends Record<string, unknown>> = {
  formId: string;
  recordId?: string;
  userId?: string | null;
  values: T;
  setValues: (next: T | ((current: T) => T)) => void;
  secretKeys?: (keyof T)[];
  debounceMs?: number;
  storage?: StorageKind;
  enabled?: boolean;
};

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export function usePersistedForm<T extends Record<string, unknown>>({
  formId,
  recordId = "new",
  userId = null,
  values,
  setValues,
  secretKeys = [],
  debounceMs = 400,
  storage = "local",
  enabled = true,
}: UsePersistedFormOptions<T>) {
  const [restored, setRestored] = useState(false);
  const hydratedKeyRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secretList = useMemo(() => secretKeys.map((key) => String(key)), [secretKeys]);

  const storageKey = useMemo(() => {
    if (typeof window === "undefined") return "";
    const store = getStorage(storage);
    if (!store) return "";
    return resolveFormDraftKey(store, formId, userId, recordId);
  }, [formId, recordId, storage, userId]);

  useEffect(() => {
    if (!enabled || !storageKey) return;
    if (hydratedKeyRef.current === storageKey) return;
    hydratedKeyRef.current = storageKey;
    setRestored(false);
    const store = getStorage(storage);
    const draft = readFormDraft(store, storageKey);
    if (!draft) return;
    setValues((current) => ({ ...current, ...draft }));
    setRestored(true);
  }, [enabled, setValues, storage, storageKey]);

  useEffect(() => {
    if (!enabled || !storageKey || hydratedKeyRef.current !== storageKey) return;
    const store = getStorage(storage);
    if (!store) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      writeFormDraft(store, storageKey, values, secretList);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [debounceMs, enabled, secretList, storage, storageKey, values]);

  const discardDraft = useCallback(() => {
    const store = getStorage(storage);
    if (store && storageKey) clearFormDraft(store, storageKey);
    setRestored(false);
  }, [storage, storageKey]);

  const clearDraft = useCallback(() => {
    const store = getStorage(storage);
    if (store && storageKey) clearFormDraft(store, storageKey);
    setRestored(false);
  }, [storage, storageKey]);

  const safeSnapshot = useCallback(
    () => sanitizeDraftValues(values, secretList) as Partial<T>,
    [secretList, values],
  );

  return { restored, discardDraft, clearDraft, storageKey, safeSnapshot };
}
