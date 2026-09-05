export const analyzeMarket = (prices = []) => {
  if (prices.length < 5) return { signal: 'NEUTRAL' };

  const recent = prices.slice(-5);
  const isRising = recent.every((val, i, arr) => i === 0 || val > arr[i - 1]);
  const isFalling = recent.every((val, i, arr) => i === 0 || val < arr[i - 1]);

  if (isRising) return { signal: 'CALL' };
  if (isFalling) return { signal: 'PUT' };

  return { signal: 'NEUTRAL' };
};