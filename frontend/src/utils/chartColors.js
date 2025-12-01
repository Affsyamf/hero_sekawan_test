// 🎨 Premium curated dashboard palette (Tableau/Looker style)
export const chartColors = [
  "#4BC8B4", // aqua mint - softer companion to teal
  "#F28A45", // orange - matches your first picture perfectly
  "#F06A6A", // coral red - warm but not pink, never girly
  "#3E6FD9", // deep steel blue - strong masculine blue
  "#4B9EFF", // sky blue - works with deep blue without conflict
  "#F5CD3A", // warm yellow - balanced, not banana-bright
  "#A27AF8", // lavender-vivid - cool purple, not girly
  "#5FCF72", // mint green - strong, clean, not neon
  "#63EDBB", // mint turquoise - bright but not neon
  "#2FB5C4", // teal cyan - beautiful, modern, masculine
  "#B980EA", // purple - distinct from lavender
  "#FFC66A", // cream-yellow - warm complementary tone
];

export const othersColor = "#9CA3AF";

// Global map: category → assigned color
const categoryColorMap = new Map();

/**
 * Assigns a consistent, clean color for a given label/category.
 * - NO hashing randomness
 * - NO collisions
 * - Deterministic across charts
 * - Alphabetical assignment
 */
export function getColorForLabel(label) {
  if (!label) return chartColors[0];

  const key = label.toString().trim().toLowerCase();

  // If we've already assigned a color → return it
  if (categoryColorMap.has(key)) {
    return categoryColorMap.get(key);
  }

  // Assign next color in the curated palette
  const index = categoryColorMap.size % chartColors.length;
  const assignedColor = chartColors[index];

  categoryColorMap.set(key, assignedColor);
  return assignedColor;
}

/**
 * Pre-register color assignments for a whole batch of categories.
 * Useful for setting color order BEFORE rendering the chart.
 */
export function registerCategories(labels) {
  const sorted = [...new Set(labels.map((l) => l.toLowerCase()))].sort();
  sorted.forEach((label) => getColorForLabel(label));
}

/**
 * Clears color assignment (useful only for debugging)
 */
export function resetColorAssignments() {
  categoryColorMap.clear();
}
