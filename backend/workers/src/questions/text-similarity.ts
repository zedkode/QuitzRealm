export function textTokens(value: string): Set<string> {
  return new Set(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

export function canonicalText(value: string): string {
  return [...textTokens(value)].sort().join(" ");
}

export function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = textTokens(left);
  const rightTokens = textTokens(right);
  const intersection = [...leftTokens].filter((token) =>
    rightTokens.has(token),
  ).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 1 : intersection / union;
}
