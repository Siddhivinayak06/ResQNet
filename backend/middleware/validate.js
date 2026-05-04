/**
 * Validation middleware for incident creation
 */
export const validateIncident = (req, res, next) => {
  const errors = [];
  const { incidentType, description, latitude, longitude } = req.body;

  // Validate incidentType
  if (!incidentType) {
    errors.push('incidentType is required');
  } else {
    const validTypes = ['accident', 'fire', 'medical', 'disaster'];
    if (!validTypes.includes(incidentType.toLowerCase())) {
      errors.push(`incidentType must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate description
  if (!description) {
    errors.push('description is required');
  } else if (typeof description !== 'string') {
    errors.push('description must be a string');
  } else if (description.trim().length < 10) {
    errors.push('description must be at least 10 characters long');
  }

  // Validate latitude
  if (latitude === undefined || latitude === null) {
    errors.push('latitude is required');
  } else if (typeof latitude !== 'number' || isNaN(latitude)) {
    errors.push('latitude must be a valid number');
  } else if (latitude < -90 || latitude > 90) {
    errors.push('latitude must be between -90 and 90');
  }

  // Validate longitude
  if (longitude === undefined || longitude === null) {
    errors.push('longitude is required');
  } else if (typeof longitude !== 'number' || isNaN(longitude)) {
    errors.push('longitude must be a valid number');
  } else if (longitude < -180 || longitude > 180) {
    errors.push('longitude must be between -180 and 180');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
};

/**
 * Validation middleware for status update
 */
export const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      errors: ['status is required'],
    });
  }

  const validStatuses = ['pending', 'active', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      errors: [`status must be one of: ${validStatuses.join(', ')}`],
    });
  }

  next();
};
