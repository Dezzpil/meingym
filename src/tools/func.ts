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

/**
 * Truncates a string if it exceeds the maximum length and adds ellipsis.
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the text before truncation
 * @returns Truncated text with ellipsis or original text if shorter than maxLength
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}
