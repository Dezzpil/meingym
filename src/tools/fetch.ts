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
