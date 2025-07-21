/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - The text to convert to slug
 * @returns {string} - The slugified text
 */
export function createSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Ensure a slug is unique by appending a number if necessary
 * @param {string} baseSlug - The base slug
 * @param {string[]} existingSlugs - Array of existing slugs to check against
 * @returns {string} - A unique slug
 */
export function ensureUniqueSlug(baseSlug, existingSlugs) {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}