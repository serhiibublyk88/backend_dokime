// src/middleware/imageUploadMiddleware.js
const { IncomingForm } = require("formidable");
const path = require("path");
const fs = require("fs");
const { fileTypeFromFile } = require("file-type");
const { uploadImage } = require("../utils/imageService");

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function imageUploadMiddleware(req, res, next) {
  if (!req.headers["content-type"]?.includes("multipart/form-data"))
    return next();

  const form = new IncomingForm({
    uploadDir: UPLOADS_DIR,
    keepExtensions: true,
    maxFileSize: 4 * 1024 * 1024, // 4 MB
    filter: ({ mimetype }) => {
      const allowedTypes = ["image/jpeg", "image/png"];
      return allowedTypes.includes(mimetype);
    },
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return next(err);
    }

    try {
      const file = files?.image;
      if (!file) return next();

      const fileType = await fileTypeFromFile(file.filepath);

      if (!fileType || !["image/jpeg", "image/png"].includes(fileType.mime)) {
        fs.unlinkSync(file.filepath);
        return next(new Error("Invalid image type."));
      }

      const uploadedImagePath = await uploadImage(file.filepath);

      req.body.imageUrl = uploadedImagePath;
      next();
    } catch (error) {
      console.error("Error processing uploaded image:", error);
      return next(error);
    }
  });
}

module.exports = imageUploadMiddleware;
