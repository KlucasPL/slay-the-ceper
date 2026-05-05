export default {
  rules: {
    // Keep baseline CSS hygiene checks lightweight; cascade-specific duplicate
    // protection is handled by scripts/check-css-duplicate-blocks.js.
    'block-no-empty': true,
    'color-no-invalid-hex': true,
    'comment-no-empty': true,
  },
};
