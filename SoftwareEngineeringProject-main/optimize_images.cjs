const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'assets');
const carouselDir = path.join(srcDir, 'carousel');

async function optimizeImages() {
  // Optimize carousel images
  if (fs.existsSync(carouselDir)) {
    const files = fs.readdirSync(carouselDir);
    for (const file of files) {
      if (file.endsWith('.png') || file.endsWith('.jpg')) {
        const inputPath = path.join(carouselDir, file);
        const outputPath = path.join(carouselDir, file.replace(/\.(png|jpg)$/, '.webp'));
        
        await sharp(inputPath)
          .resize(800) // Resize to max 800px width for carousel
          .webp({ quality: 80 })
          .toFile(outputPath);
        
        console.log(`Optimized ${file} -> ${path.basename(outputPath)}`);
        
        // Remove original to save space
        fs.unlinkSync(inputPath);
      }
    }
  }

  // Optimize before_after.png
  const beforeAfterPath = path.join(srcDir, 'before_after.png');
  if (fs.existsSync(beforeAfterPath)) {
    const outputPath = path.join(srcDir, 'before_after.webp');
    await sharp(beforeAfterPath)
      .resize(1000)
      .webp({ quality: 80 })
      .toFile(outputPath);
    console.log(`Optimized before_after.png -> before_after.webp`);
    fs.unlinkSync(beforeAfterPath);
  }
}

optimizeImages().catch(console.error);
