/**
 * Destination grid layout: returns [colSpan, rowSpan] for each of `n` cards in a
 * `cols`-column grid so every row is filled (first card large, a lone last card
 * becomes a full-width banner).
 */
export function mosaicSpans(n, cols) {
  const spans = Array.from({ length: n }, () => [1, 1]);
  if (cols < 2 || n === 0) return spans;
  if (n === 1) {
    spans[0] = [cols, 1];
    return spans;
  }
  spans[0] = [2, 2];
  const side = cols - 2; // columns beside the large card
  const k = n - 1;
  if (side === 2 && k <= 3) {
    if (k === 1) spans[1] = [2, 2];
    else if (k === 2) { spans[1] = [2, 1]; spans[2] = [2, 1]; }
    else spans[1] = [2, 1];
    return spans;
  }
  if (side === 1 && k === 1) {
    spans[1] = [1, 2];
    return spans;
  }
  const first = 1 + Math.min(k, side * 2);
  const rem = (n - first) % cols;
  if (rem === 1) spans[n - 1] = [cols, 1];
  else if (rem > 1) for (let j = 0; j < cols - rem; j++) spans[n - 1 - j] = [2, 1];
  return spans;
}
