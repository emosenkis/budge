const PIECES = new Set([" ", "#", "-", "+", "o", "x", "f", "P", "*", "@"]);

export const blankLevel = () =>
  Array.from({ length: 15 }, () => Array(20).fill(" "));

export function serializeLevel(title, rows) {
  title = title.trim();
  if (!title || /["\r\n]/.test(title)) throw new Error("Enter a title without quotes");
  if (rows.length !== 15 || rows.some(row => row.length !== 20)) {
    throw new Error("A level must be 20 × 15");
  }
  if (rows.some(row => row.some(piece => !PIECES.has(piece)))) {
    throw new Error("The level contains an unknown piece");
  }
  const pieces = rows.flat();
  if (pieces.filter(piece => piece === "P").length !== 1 ||
      pieces.filter(piece => piece === "*").length !== 1 ||
      pieces.filter(piece => piece === "@").length !== 1) {
    throw new Error("Place exactly one Budge, one Spiky, and one Fluffy");
  }
  return [`"${title}"`, ...rows.map(row => row.join("").trimEnd())].join("\n");
}
