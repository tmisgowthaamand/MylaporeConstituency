const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'mla.png');

async function checkBg() {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();
  const rawBuffer = await image.ensureAlpha().raw().toBuffer();
  
  const tl = 0;
  console.log(`Top left: R=${rawBuffer[tl]} G=${rawBuffer[tl+1]} B=${rawBuffer[tl+2]} A=${rawBuffer[tl+3]}`);
}

checkBg().catch(console.error);
