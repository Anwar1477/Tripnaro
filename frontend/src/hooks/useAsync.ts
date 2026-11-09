"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api";

interface Settled<T> {
  key: string | null;
  data: T | null;
  error: string | null;
}

/**
 * Runs an async loader whenever `deps` change and exposes data / loading / error plus `reload`.
 * `loading` is derived (the latest request key has not settled yet), so no state is set
 * synchronously inside effects. Previous data is kept while a new request is in flight.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = [], options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  const [nonce, setNonce] = useState(0);
  const requestKey = `${JSON.stringify(deps)}#${nonce}`;
  const [settled, setSettled] = useState<Settled<T>>({ key: null, data: null, error: null });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loaderRef.current().then(
      (data) => !cancelled && setSettled({ key: requestKey, data, error: null }),
      (err) => !cancelled && setSettled((s) => ({ key: requestKey, data: s.data, error: errorMessage(err) })),
    );
    return () => {
      cancelled = true;
    };
  }, [requestKey, enabled]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((data: T | null) => setSettled((s) => ({ ...s, data })), []);
  const current = settled.key === requestKey;

  return { data: settled.data, error: current ? settled.error : null, loading: enabled && !current, reload, setData };
}
