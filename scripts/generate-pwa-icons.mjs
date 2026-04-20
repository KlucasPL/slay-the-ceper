import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * @typedef {{ r: number, g: number, b: number, a: number }} Rgba
 */

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectRoot, 'public');

const palette = {
  skyTop: hex('#7ec6f5'), // Light blue
  skyBottom: hex('#3a7bd5'), // Deeper blue
  ember: hex('#d96b2b'),
  emberSoft: hex('#f2a74b'),
  gold: hex('#d7a74a'),
  goldLight: hex('#f6ddb0'),
  cream: hex('#f7f8fb'),
  rock: hex('#b9c0ca'),
  rockLight: hex('#dde2ea'),
  rockShadow: hex('#6f7887'),
  moss: hex('#3fa34d'), // More vivid green
  mossLight: hex('#7ed957'), // Lighter, more saturated green
  bark: hex('#7a4b2f'),
  barkLight: hex('#9a633d'),
  steel: hex('#d7dce4'),
  steelShadow: hex('#8e95a3'),
  shadow: hex('#22120d'),
  pine: hex('#27402d'),
  pineDark: hex('#18271c'),
};

const outputs = [
  { file: 'favicon.png', size: 64, maskable: false },
  { file: 'icon-72x72.png', size: 72, maskable: false },
  { file: 'icon-96x96.png', size: 96, maskable: false },
  { file: 'icon-128x128.png', size: 128, maskable: false },
  { file: 'icon-144x144.png', size: 144, maskable: false },
  { file: 'icon-152x152.png', size: 152, maskable: false },
  { file: 'icon-192x192.png', size: 192, maskable: false },
  { file: 'icon-384x384.png', size: 384, maskable: false },
  { file: 'icon-512x512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512x512.png', size: 512, maskable: true },
];

/**
 * @param {string} value
 * @returns {Rgba}
 */
function hex(value) {
  const normalized = value.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
    a: 255,
  };
}

/**
 * @param {number} width
 * @param {number} height
 */
function createImage(width, height) {
  return {
    width,
    height,
    data: new Uint8Array(width * height * 4),
  };
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {boolean} maskable
 */
function drawIcon(image, maskable) {
  const { width, height } = image;
  const size = Math.min(width, height);
  const centerX = width / 2;
  const centerY = height / 2;

  // Blue sky gradient background
  drawVerticalGradient(image, palette.skyTop, palette.skyBottom);
  drawVignette(image, 0.22);

  const medallionRadius = size * (maskable ? 0.285 : 0.41);

  // Sun in the sky
  drawSun(image, centerX + size * 0.1, centerY - size * 0.14, size * 0.085);
  // Mountains and pines
  drawMountains(image, centerX, centerY, medallionRadius);
  drawPines(image, centerX, centerY, medallionRadius);
  // No ciupaga, no spark, no ring, no medallion
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {Rgba} top
 * @param {Rgba} bottom
 */
function drawVerticalGradient(image, top, bottom) {
  for (let y = 0; y < image.height; y += 1) {
    const t = y / Math.max(1, image.height - 1);
    const color = mix(top, bottom, t);
    for (let x = 0; x < image.width; x += 1) {
      setPixel(image, x, y, color);
    }
  }
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} strength
 */
function drawVignette(image, strength) {
  const centerX = image.width / 2;
  const centerY = image.height / 2;
  const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy) / maxDistance;
      const alpha = clamp(Math.round(Math.max(0, distance - 0.25) * 255 * strength), 0, 180);
      if (alpha > 0) {
        blendPixel(image, x, y, withAlpha(palette.shadow, alpha));
      }
    }
  }
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {Rgba} outer
 * @param {Rgba} innerShadow
 */

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 */
function drawSun(image, centerX, centerY, radius) {
  drawFilledCircle(image, centerX, centerY, radius, withAlpha(palette.ember, 210));
  drawGlow(image, centerX, centerY, radius * 1.7, withAlpha(palette.emberSoft, 76));
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 */
function drawMountains(image, centerX, centerY, radius) {
  const scale = radius * 2;
  const leftMassif = [
    [centerX - scale * 0.92, centerY + scale * 0.36],
    [centerX - scale * 0.78, centerY + scale * 0.22],
    [centerX - scale * 0.63, centerY + scale * 0.08],
    [centerX - scale * 0.49, centerY - scale * 0.09],
    [centerX - scale * 0.37, centerY + scale * 0.03],
    [centerX - scale * 0.26, centerY - scale * 0.06],
    [centerX - scale * 0.14, centerY + scale * 0.08],
    [centerX + scale * 0.03, centerY + scale * 0.36],
  ];
  const goldenRidge = [
    [centerX - scale * 0.28, centerY + scale * 0.36],
    [centerX - scale * 0.16, centerY + scale * 0.2],
    [centerX - scale * 0.05, centerY + scale * 0.06],
    [centerX + scale * 0.06, centerY + scale * 0.14],
    [centerX + scale * 0.18, centerY + scale * 0.02],
    [centerX + scale * 0.29, centerY + scale * 0.1],
    [centerX + scale * 0.42, centerY - scale * 0.01],
    [centerX + scale * 0.6, centerY + scale * 0.36],
  ];
  const rightPeak = [
    [centerX + scale * 0.34, centerY + scale * 0.36],
    [centerX + scale * 0.46, centerY + scale * 0.12],
    [centerX + scale * 0.56, centerY - scale * 0.02],
    [centerX + scale * 0.67, centerY - scale * 0.26],
    [centerX + scale * 0.76, centerY - scale * 0.06],
    [centerX + scale * 0.84, centerY + scale * 0.16],
    [centerX + scale * 0.92, centerY + scale * 0.36],
  ];

  fillPolygon(image, leftMassif, palette.rock);
  fillPolygon(image, goldenRidge, palette.rockLight);
  fillPolygon(image, rightPeak, palette.cream);

  fillPolygon(
    image,
    [
      [centerX - scale * 0.61, centerY + scale * 0.36],
      [centerX - scale * 0.5, centerY + scale * 0.11],
      [centerX - scale * 0.42, centerY - scale * 0.02],
      [centerX - scale * 0.32, centerY + scale * 0.08],
      [centerX - scale * 0.19, centerY + scale * 0.36],
    ],
    withAlpha(palette.rockShadow, 110)
  );

  fillPolygon(
    image,
    [
      [centerX + scale * 0.43, centerY + scale * 0.36],
      [centerX + scale * 0.55, centerY + scale * 0.03],
      [centerX + scale * 0.67, centerY - scale * 0.2],
      [centerX + scale * 0.78, centerY + scale * 0.36],
    ],
    withAlpha(palette.rockShadow, 95)
  );

  fillPolygon(
    image,
    [
      [centerX - scale * 0.5, centerY + scale * 0.08],
      [centerX - scale * 0.47, centerY - scale * 0.05],
      [centerX - scale * 0.4, centerY + scale * 0.01],
      [centerX - scale * 0.34, centerY + scale * 0.09],
    ],
    palette.cream
  );

  fillPolygon(
    image,
    [
      [centerX + scale * 0.6, centerY - scale * 0.14],
      [centerX + scale * 0.67, centerY - scale * 0.27],
      [centerX + scale * 0.75, centerY - scale * 0.08],
      [centerX + scale * 0.68, centerY - scale * 0.01],
    ],
    palette.cream
  );

  fillPolygon(
    image,
    [
      [centerX - scale * 0.95, centerY + scale * 0.36],
      [centerX - scale * 0.7, centerY + scale * 0.21],
      [centerX - scale * 0.48, centerY + scale * 0.29],
      [centerX - scale * 0.2, centerY + scale * 0.17],
      [centerX + scale * 0.04, centerY + scale * 0.26],
      [centerX + scale * 0.24, centerY + scale * 0.17],
      [centerX + scale * 0.46, centerY + scale * 0.29],
      [centerX + scale * 0.71, centerY + scale * 0.21],
      [centerX + scale * 0.95, centerY + scale * 0.36],
    ],
    withAlpha(palette.moss, 245)
  );

  fillPolygon(
    image,
    [
      [centerX - scale * 0.82, centerY + scale * 0.36],
      [centerX - scale * 0.56, centerY + scale * 0.25],
      [centerX - scale * 0.31, centerY + scale * 0.33],
      [centerX - scale * 0.06, centerY + scale * 0.22],
      [centerX + scale * 0.17, centerY + scale * 0.31],
      [centerX + scale * 0.46, centerY + scale * 0.23],
      [centerX + scale * 0.71, centerY + scale * 0.36],
    ],
    withAlpha(palette.mossLight, 235)
  );
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 */
function drawPines(image, centerX, centerY, radius) {
  const scale = radius * 2;
  drawPine(image, centerX - scale * 0.55, centerY + scale * 0.18, scale * 0.14);
  drawPine(image, centerX - scale * 0.38, centerY + scale * 0.24, scale * 0.1);
  drawPine(image, centerX + scale * 0.72, centerY + scale * 0.21, scale * 0.12);
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} x
 * @param {number} y
 * @param {number} size
 */
function drawPine(image, x, y, size) {
  fillPolygon(
    image,
    [
      [x, y - size],
      [x - size * 0.7, y + size * 0.05],
      [x + size * 0.7, y + size * 0.05],
    ],
    palette.pine
  );
  fillPolygon(
    image,
    [
      [x, y - size * 0.55],
      [x - size * 0.85, y + size * 0.36],
      [x + size * 0.85, y + size * 0.36],
    ],
    palette.pineDark
  );
  fillPolygon(
    image,
    [
      [x - size * 0.09, y + size * 0.36],
      [x + size * 0.09, y + size * 0.36],
      [x + size * 0.06, y + size * 0.7],
      [x - size * 0.06, y + size * 0.7],
    ],
    palette.bark
  );
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 */
// (ciupaga removed)

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} x
 * @param {number} y
 * @param {number} size
 */

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {Rgba} color
 */
function drawGlow(image, centerX, centerY, radius, color) {
  const startX = Math.floor(centerX - radius - 1);
  const endX = Math.ceil(centerX + radius + 1);
  const startY = Math.floor(centerY - radius - 1);
  const endY = Math.ceil(centerY + radius + 1);

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const dx = x + 0.5 - centerX;
      const dy = y + 0.5 - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        const alpha = Math.round(color.a * Math.pow(1 - distance / radius, 1.8));
        if (alpha > 0) {
          blendPixel(image, x, y, withAlpha(color, alpha));
        }
      }
    }
  }
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {Rgba} color
 */
function drawFilledCircle(image, centerX, centerY, radius, color) {
  const startX = Math.floor(centerX - radius - 1);
  const endX = Math.ceil(centerX + radius + 1);
  const startY = Math.floor(centerY - radius - 1);
  const endY = Math.ceil(centerY + radius + 1);

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const dx = x + 0.5 - centerX;
      const dy = y + 0.5 - centerY;
      if (dx * dx + dy * dy <= radius * radius) {
        blendPixel(image, x, y, color);
      }
    }
  }
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {Array<[number, number]>} points
 * @param {Rgba} color
 */
function fillPolygon(image, points, color) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y += 1) {
    for (let x = Math.floor(minX); x <= Math.ceil(maxX); x += 1) {
      if (pointInPolygon(x + 0.5, y + 0.5, points)) {
        blendPixel(image, x, y, color);
      }
    }
  }
}

/**
 * @param {number} px
 * @param {number} py
 * @param {Array<[number, number]>} points
 */
function pointInPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-6) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} width
 * @param {Rgba} color
 */

/**
 * @param {number} px
 * @param {number} py
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} x
 * @param {number} y
 * @param {Rgba} color
 */
function setPixel(image, x, y, color) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const index = (y * image.width + x) * 4;
  image.data[index] = color.r;
  image.data[index + 1] = color.g;
  image.data[index + 2] = color.b;
  image.data[index + 3] = color.a;
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 * @param {number} x
 * @param {number} y
 * @param {Rgba} color
 */
function blendPixel(image, x, y, color) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const index = (y * image.width + x) * 4;
  const srcAlpha = color.a / 255;
  const dstAlpha = image.data[index + 3] / 255;
  const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);

  if (outAlpha <= 0) {
    return;
  }

  image.data[index] = Math.round(
    (color.r * srcAlpha + image.data[index] * dstAlpha * (1 - srcAlpha)) / outAlpha
  );
  image.data[index + 1] = Math.round(
    (color.g * srcAlpha + image.data[index + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha
  );
  image.data[index + 2] = Math.round(
    (color.b * srcAlpha + image.data[index + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha
  );
  image.data[index + 3] = Math.round(outAlpha * 255);
}

/**
 * @param {Rgba} color
 * @param {number} alpha
 * @returns {Rgba}
 */
function withAlpha(color, alpha) {
  return { ...color, a: clamp(alpha, 0, 255) };
}

/**
 * @param {Rgba} a
 * @param {Rgba} b
 * @param {number} t
 * @returns {Rgba}
 */
function mix(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
    a: Math.round(a.a + (b.a - a.a) * t),
  };
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {{ width: number, height: number, data: Uint8Array }} image
 */
function encodePng(image) {
  const raw = Buffer.alloc((image.width * 4 + 1) * image.height);

  for (let y = 0; y < image.height; y += 1) {
    const rowStart = y * (image.width * 4 + 1);
    raw[rowStart] = 0;
    const sourceStart = y * image.width * 4;
    image.data.slice(sourceStart, sourceStart + image.width * 4).forEach((value, offset) => {
      raw[rowStart + 1 + offset] = value;
    });
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * @param {string} type
 * @param {Buffer} data
 */
function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

/**
 * @param {Buffer} buffer
 */
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc = crcTable[(crc ^ value) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

for (const output of outputs) {
  const image = createImage(output.size, output.size);
  drawIcon(image, output.maskable);
  fs.writeFileSync(path.join(outputDir, output.file), encodePng(image));
}

console.log(`Generated ${outputs.length} icons in ${outputDir}`);
