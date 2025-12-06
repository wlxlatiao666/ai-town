// Semantic labels for gentle-obj.png tile indices (32x32 tiles, 45 tiles per row).
// Only covers the indices explicitly provided; extend as needed.

const TILESET_WIDTH = 45;

const semanticLabels = {};

const setLabel = (index, label) => {
  semanticLabels[index] = label;
};

const addRectangle = (topLeft, bottomRight, label, omit = new Set()) => {
  const startRow = Math.floor(topLeft / TILESET_WIDTH);
  const startCol = topLeft % TILESET_WIDTH;
  const endRow = Math.floor(bottomRight / TILESET_WIDTH);
  const endCol = bottomRight % TILESET_WIDTH;

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const idx = row * TILESET_WIDTH + col;
      if (!omit.has(idx)) setLabel(idx, label);
    }
  }
};

// Single-tile labels
setLabel(962, 'grass');
setLabel(271, 'grass');

// Tent: 3x3 block from 751 (top-left) to 843 (bottom-right)
addRectangle(751, 843, 'tent');

// Land: block from 1 (top-left) to 138 (bottom-right)
addRectangle(1, 138, 'land');

// Wood: block from 143 (top-left) to 190 (bottom-right)
addRectangle(143, 190, 'wood');

// River water: 2x2 block from 406 (top-left) to 452 (bottom-right)
addRectangle(406, 452, 'river_water');

// River bank: 4x4 block from 360 (top-left) to 498 (bottom-right) minus center 2x2
addRectangle(
  360,
  498,
  'river_bank',
  new Set([406, 407, 451, 452]), // omit center 2x2
);

export { semanticLabels };

export const getSemanticLabel = (index) => semanticLabels[index];
