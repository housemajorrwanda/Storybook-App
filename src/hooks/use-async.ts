import { useCallback, useEffect, useRef, useState } from 'react';

type State<T> = {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

/**
 * Runs an async fetch and tracks loading / error / refresh state.
 *
 * `refresh()` is kept distinct from the initial `loading` so pull-to-refresh can
 * spin the control without tearing the list down to a skeleton.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    refreshing: false,
    error: null,
  });

  // Guards against setting state after unmount, and against a slow first request
  // resolving on top of a newer one.
  const mounted = useRef(true);
  const requestId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (isRefresh: boolean) => {
      const id = ++requestId.current;
      setState((s) => ({ ...s, loading: !isRefresh, refreshing: isRefresh, error: null }));

      try {
        const data = await fetcher();
        if (!mounted.current || id !== requestId.current) return;
        setState({ data, loading: false, refreshing: false, error: null });
      } catch (e: any) {
        if (!mounted.current || id !== requestId.current) return;
        setState({
          data: null,
          loading: false,
          refreshing: false,
          error: e?.message ?? 'Something went wrong.',
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(() => run(true), [run]);
  const retry = useCallback(() => run(false), [run]);

  return { ...state, refresh, retry };
}
