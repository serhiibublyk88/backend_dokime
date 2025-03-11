// utils/imageService.js

const sharp = require("sharp");
const path = require("path"); 
const fs = require("fs");

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const PROCESSED_DIR = path.join(UPLOADS_DIR, "processed"); 

if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

async function uploadImage(imagePath) {
  try {
    const fileName = path.basename(imagePath);
    const outputPath = path.join(PROCESSED_DIR, fileName);

    await sharp(imagePath)
      .resize(400, 300, { fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toFile(outputPath);

    return outputPath; 
  } catch (error) {
    throw new Error("Failed to process image: " + error.message);
  }
}

module.exports = { uploadImage };
