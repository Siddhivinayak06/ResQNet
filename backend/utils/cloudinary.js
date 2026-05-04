import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The image file buffer from Multer
 * @param {string} folder - Cloudinary folder to store the image in
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (fileBuffer, folder = 'resqnet/incidents') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [
          { width: 1200, crop: 'limit' },  // Cap width at 1200px
          { quality: 'auto' },              // Auto-optimize quality
          { fetch_format: 'auto' },         // Serve best format (webp, etc.)
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
