export function getPageRange(
  current: number,
  total: number,
  maxVisible = 7,
): (number | '...')[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor((maxVisible - 2) / 2);
  let start = current - half;
  let end = current + half;

  if (start <= 2) {
    start = 2;
    end = maxVisible - 1;
  } else if (end >= total - 1) {
    end = total - 1;
    start = total - (maxVisible - 2);
  }

  const pages: (number | '...')[] = [1];

  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');

  pages.push(total);
  return pages;
}
