export async function postApi(
  url: string,
  data: Record<any, any>,
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
