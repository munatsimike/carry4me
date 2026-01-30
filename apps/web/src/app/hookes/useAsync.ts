import { useEffect, useState } from "react";

type AsyncState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
};

export function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setState((s) => ({ ...s, isLoading: true }));
        const data = await fn();
        if (!isMounted) return;
        setState({ data, error: null, isLoading: false });
      } catch (error) {
        if (!isMounted) return;
        setState({ data: null, error: error as Error, isLoading: false });
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, deps);

  return state;
}
