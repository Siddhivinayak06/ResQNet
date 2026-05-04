import { uploadToCloudinary } from '../utils/cloudinary.js';
import Incident from '../models/Incident.js';

/**
 * @desc    Upload an image to Cloudinary and return the URL
 * @route   POST /api/incidents/upload
 * @access  Private (requires auth)
 */
export const uploadIncidentImage = async (req, res, next) => {
  try {
    const result = await uploadToCloudinary(req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Image upload failed. Please try again.',
    });
  }
};

/**
 * @desc    Upload image and attach it to an existing incident
 * @route   POST /api/incidents/:id/upload
 * @access  Private (requires auth)
 */
export const uploadAndAttachImage = async (req, res, next) => {
  try {
    // Check incident exists
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found',
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    // Update incident with image URL
    incident.imageUrl = result.secure_url;
    await incident.save();

    res.status(200).json({
      success: true,
      message: 'Image uploaded and attached to incident',
      data: {
        imageUrl: result.secure_url,
        incident,
      },
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Image upload failed. Please try again.',
    });
  }
};
