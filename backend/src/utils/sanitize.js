/**
 * Input sanitization utilities
 */

/**
 * Escape special regex characters in a string to prevent ReDoS attacks.
 * Use this before passing user input to MongoDB $regex queries.
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for regex use
 */
function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegex };
