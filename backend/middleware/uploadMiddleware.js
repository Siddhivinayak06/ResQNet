import multer from 'multer';
import path from 'path';

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

// Max file size: 5MB
const MAX_SIZE = 5 * 1024 * 1024;

// Use memory storage so we can stream the buffer directly to Cloudinary
const storage = multer.memoryStorage();

// File filter — reject anything that isn't JPG/JPEG/PNG
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const ext = path.extname(file.originalname);
    cb(new Error(`Invalid file type '${ext}'. Only JPG, JPEG, and PNG files are allowed.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE,
  },
});

/**
 * Middleware that handles a single image upload on the 'image' field.
 * Wraps Multer errors into structured JSON responses.
 */
export const uploadImage = (req, res, next) => {
  const singleUpload = upload.single('image');

  singleUpload(req, res, (err) => {
    if (err) {
      // Multer-specific errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File too large. Maximum allowed size is 5MB.',
          });
        }
        return res.status(400).json({
          success: false,
          error: `Upload error: ${err.message}`,
        });
      }

      // Custom file filter error
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    // No file provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided. Please upload a JPG, JPEG, or PNG file.',
      });
    }

    next();
  });
};
