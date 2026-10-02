import multer from "multer";

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPG, JPEG, PNG, and WEBP images are accepted."));
    }
    return callback(null, true);
  },
});

export function uploadProductImages(req, res, next) {
  uploader.array("images", 4)(req, res, (error) => {
    if (!error) return next();
    const tooMany = error instanceof multer.MulterError && ["LIMIT_FILE_COUNT", "LIMIT_UNEXPECTED_FILE"].includes(error.code);
    const tooLarge = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
    return res.status(400).json({
      success: false,
      message: tooMany ? "Maximum 4 product images are allowed." : tooLarge ? "Each image must be 5MB or smaller." : error.message,
    });
  });
}