import { useCallback, useEffect, useRef, useState } from "react";

type UseGetViewDataProps<T> = {
  id: number | string | null;
  isOpen: boolean;
  getById:
    | ((id: number) => Promise<T | null | undefined>)
    | ((id: string) => Promise<T | null | undefined>);
};

export function useGetViewData<T>({
  id,
  isOpen,
  getById,
}: UseGetViewDataProps<T>) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const alreadyFetched = useRef(false);

  const fetchData = useCallback(async () => {
    if (id === null) return;
    setLoading(true);
    try {
      //@ts-expect-error //!! Typescript Can not detect the type of the id
      const result = await getById(id);
      setData(result ?? null);
    } finally {
      setLoading(false);
    }
  }, [id, getById]);

  useEffect(() => {
    function clearData() {
      setData(null);
    }

    if (isOpen && !alreadyFetched.current) {
      void fetchData();
      alreadyFetched.current = true;
    }

    if (!isOpen) {
      clearData();
      alreadyFetched.current = false;
    }
  }, [isOpen, fetchData]);

  const refetch = useCallback(async () => {
    if (id === null) return;
    await fetchData();
  }, [id, fetchData]);

  return { loading, data, refetch };
}
