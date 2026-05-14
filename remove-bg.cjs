const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Use the original backup or re-process
const inputPath = path.join(__dirname, 'public', '1e342124-72d6-4c00-9d2f-bf482e427082.png');
const outputPath = path.join(__dirname, 'public', '1e342124-72d6-4c00-9d2f-bf482e427082.png');

async function removeWhiteBg() {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();

  // Get raw pixel data with alpha
  const rawBuffer = await image.ensureAlpha().raw().toBuffer();
  const pixels = Buffer.from(rawBuffer);
  
  const threshold = 200; // More aggressive threshold
  
  // First pass: mark definite background pixels (edges and corners)
  // Flood-fill approach from edges
  const isBackground = new Uint8Array(width * height);
  const queue = [];
  
  // Add all edge pixels that are light-colored to the queue
  for (let x = 0; x < width; x++) {
    // Top row
    checkAndAdd(x, 0);
    // Bottom row  
    checkAndAdd(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    // Left column
    checkAndAdd(0, y);
    // Right column
    checkAndAdd(width - 1, y);
  }
  
  function getIdx(x, y) {
    return (y * width + x) * 4;
  }
  
  function isLightPixel(x, y) {
    const idx = getIdx(x, y);
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    return r > threshold && g > threshold && b > threshold;
  }
  
  function checkAndAdd(x, y) {
    const pos = y * width + x;
    if (isBackground[pos]) return;
    if (isLightPixel(x, y)) {
      isBackground[pos] = 1;
      queue.push([x, y]);
    }
  }
  
  // BFS flood fill from edges
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    const neighbors = [
      [cx - 1, cy], [cx + 1, cy],
      [cx, cy - 1], [cx, cy + 1]
    ];
    
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const pos = ny * width + nx;
      if (isBackground[pos]) continue;
      if (isLightPixel(nx, ny)) {
        isBackground[pos] = 1;
        queue.push([nx, ny]);
      }
    }
  }
  
  // Apply transparency to background pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      if (isBackground[pos]) {
        const idx = getIdx(x, y);
        pixels[idx + 3] = 0; // Make transparent
      }
    }
  }
  
  // Soften edges - semi-transparent for pixels adjacent to background
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (isBackground[pos]) continue;
      
      // Count background neighbors
      let bgCount = 0;
      const neighbors = [
        (y-1)*width+x, (y+1)*width+x,
        y*width+(x-1), y*width+(x+1)
      ];
      for (const npos of neighbors) {
        if (isBackground[npos]) bgCount++;
      }
      
      // If pixel borders background, make semi-transparent for smooth edge
      if (bgCount >= 2) {
        const idx = getIdx(x, y);
        pixels[idx + 3] = Math.floor(pixels[idx + 3] * 0.5);
      }
    }
  }

  const tmpPath = outputPath + '.tmp';
  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(tmpPath);

  fs.copyFileSync(tmpPath, outputPath);
  fs.unlinkSync(tmpPath);

  console.log('White background removed with flood-fill! Image dimensions:', width, 'x', height);
}

removeWhiteBg().catch(console.error);
