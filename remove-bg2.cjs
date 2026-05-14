const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, 'public', '9903d452-61b1-41a8-9cd6-9c9e55f7abc3.png');
const outputPath = path.join(__dirname, 'public', '9903d452-61b1-41a8-9cd6-9c9e55f7abc3.png');

async function removeWhiteBg() {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();

  const rawBuffer = await image.ensureAlpha().raw().toBuffer();
  const pixels = Buffer.from(rawBuffer);
  
  const threshold = 210;
  const isBackground = new Uint8Array(width * height);
  const queue = [];
  
  function getIdx(x, y) { return (y * width + x) * 4; }
  
  function isLightPixel(x, y) {
    const idx = getIdx(x, y);
    return pixels[idx] > threshold && pixels[idx+1] > threshold && pixels[idx+2] > threshold;
  }
  
  function checkAndAdd(x, y) {
    const pos = y * width + x;
    if (isBackground[pos]) return;
    if (isLightPixel(x, y)) {
      isBackground[pos] = 1;
      queue.push([x, y]);
    }
  }
  
  for (let x = 0; x < width; x++) { checkAndAdd(x, 0); checkAndAdd(x, height - 1); }
  for (let y = 0; y < height; y++) { checkAndAdd(0, y); checkAndAdd(width - 1, y); }
  
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    for (const [nx, ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]]) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const pos = ny * width + nx;
      if (!isBackground[pos] && isLightPixel(nx, ny)) {
        isBackground[pos] = 1;
        queue.push([nx, ny]);
      }
    }
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isBackground[y * width + x]) {
        pixels[getIdx(x, y) + 3] = 0;
      }
    }
  }

  const tmpPath = outputPath + '.tmp';
  await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toFile(tmpPath);
  fs.copyFileSync(tmpPath, outputPath);
  fs.unlinkSync(tmpPath);
  console.log('Done! Second image background removed.');
}

removeWhiteBg().catch(console.error);
