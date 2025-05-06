import { useEffect, useState } from "react";

export async function postApi<T>(
  url: string,
  data: T,
): Promise<Record<any, any> | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  } catch (e: any) {
    alert(e.toString());
    return null;
  }
}

export function useApi<R>(url: string): {
  loading: boolean;
  error: null | string;
  data: R | null;
} {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [data, setData] = useState<R | null>(null);

  useEffect(() => {
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        setLoading(false);
        response
          .json()
          .then((json) => {
            setData(json);
          })
          .catch((e: any) => {
            setError(e.toString());
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch((e: any) => {
        setError(e.toString());
        setLoading(false);
      });
  }, [url]);

  return {
    loading,
    error,
    data,
  };
}
