export const getStyleTierFromScore = (score = 0) => {
  const normalizedScore = Math.max(0, Number(score) || 0);
  const tier = Math.floor(normalizedScore / 500);
  return Math.min(4, tier);
};

