export function debounce(func: CallableFunction, ms: number) {
  let timeoutId: NodeJS.Timeout | undefined;
  function debounced(...args: any[]) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      func(...args);
    }, ms);
  }
  return debounced;
}
