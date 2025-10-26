/**
 * Utility functions to parse metadata from Google Cloud Vision API labels
 */

export interface ParsedMetadata {
  size: string;
  color: string;
  material: string;
  category: string;
}

// Common sizes to look for in labels
const SIZE_KEYWORDS = [
  { pattern: /\b(xs|extra small)\b/i, value: "XS" },
  { pattern: /\b(s|small)\b/i, value: "S" },
  { pattern: /\b(m|medium)\b/i, value: "M" },
  { pattern: /\b(l|large)\b/i, value: "L" },
  { pattern: /\b(xl|extra large)\b/i, value: "XL" },
  { pattern: /\b(xxl|2xl)\b/i, value: "XXL" },
  { pattern: /\b(xxxl|3xl)\b/i, value: "XXXL" },
  { pattern: /\bone size\b/i, value: "One Size" },
  { pattern: /\bos\b/i, value: "One Size" },
];

// Common colors to detect
const COLOR_KEYWORDS = [
  "black", "white", "gray", "grey", "red", "blue", "green", "yellow",
  "orange", "purple", "pink", "brown", "beige", "tan", "navy", "maroon",
  "teal", "turquoise", "olive", "cream", "ivory", "gold", "silver",
  "burgundy", "khaki", "lavender", "mint", "coral", "peach", "indigo",
  "magenta", "cyan", "crimson", "scarlet", "charcoal"
];

// Common materials
const MATERIAL_KEYWORDS = [
  "cotton", "wool", "polyester", "silk", "leather", "denim", "linen",
  "cashmere", "suede", "velvet", "fleece", "nylon", "spandex", "rayon",
  "acrylic", "canvas", "corduroy", "satin", "jersey", "tweed", "chiffon",
  "textile", "fabric", "cloth", "knit", "woven", "synthetic", "blend"
];

// Clothing categories
const CATEGORY_KEYWORDS = [
  "shirt", "t-shirt", "tee", "blouse", "top", "sweater", "hoodie",
  "jacket", "coat", "pants", "jeans", "shorts", "skirt", "dress",
  "suit", "blazer", "cardigan", "vest", "tank", "polo", "sweatshirt"
];

/**
 * Extract size from labels array
 */
export function extractSize(labels?: string[]): string {
  if (!labels || labels.length === 0) return "Unknown";

  for (const label of labels) {
    for (const sizeKeyword of SIZE_KEYWORDS) {
      if (sizeKeyword.pattern.test(label)) {
        return sizeKeyword.value;
      }
    }
  }

  return "Unknown";
}

/**
 * Extract color from labels array
 */
export function extractColor(labels?: string[]): string {
  if (!labels || labels.length === 0) return "Unknown";

  for (const label of labels) {
    const lowerLabel = label.toLowerCase();
    for (const color of COLOR_KEYWORDS) {
      if (lowerLabel.includes(color)) {
        // Return the color keyword itself, properly capitalized
        return color.charAt(0).toUpperCase() + color.slice(1);
      }
    }
  }

  return "Unknown";
}

/**
 * Extract material from labels array
 */
export function extractMaterial(labels?: string[]): string {
  if (!labels || labels.length === 0) return "Unknown";

  for (const label of labels) {
    const lowerLabel = label.toLowerCase();
    for (const material of MATERIAL_KEYWORDS) {
      if (lowerLabel.includes(material)) {
        // Return the material keyword itself, properly capitalized
        return material.charAt(0).toUpperCase() + material.slice(1);
      }
    }
  }

  return "Unknown";
}

/**
 * Extract clothing category from labels array
 */
export function extractCategory(labels?: string[]): string {
  if (!labels || labels.length === 0) return "Unknown";

  for (const label of labels) {
    const lowerLabel = label.toLowerCase();
    for (const category of CATEGORY_KEYWORDS) {
      if (lowerLabel.includes(category)) {
        // Capitalize first letter
        return label.charAt(0).toUpperCase() + label.slice(1);
      }
    }
  }

  // If no specific category found, return first label as fallback
  return labels[0] || "Unknown";
}

/**
 * Parse all metadata from labels
 */
export function parseMetadata(labels?: string[]): ParsedMetadata {
  return {
    size: extractSize(labels),
    color: extractColor(labels),
    material: extractMaterial(labels),
    category: extractCategory(labels),
  };
}
