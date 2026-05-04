/**
 * Validation middleware for user registration
 */
export const validateRegister = (req, res, next) => {
  const errors = [];
  const { name, email, password, role, phoneNumber } = req.body;

  // Validate name
  if (!name) {
    errors.push('Name is required');
  } else if (typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Validate email
  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      errors.push('Please provide a valid email address');
    }
  }

  // Validate password
  if (!password) {
    errors.push('Password is required');
  } else if (typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Validate role (optional field — defaults to 'user')
  if (role) {
    const validRoles = ['user', 'volunteer', 'admin'];
    if (!validRoles.includes(role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }
  }

  // Validate phoneNumber (optional)
  if (phoneNumber && typeof phoneNumber !== 'string') {
    errors.push('Phone number must be a string');
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
 * Validation middleware for user login
 */
export const validateLogin = (req, res, next) => {
  const errors = [];
  const { email, password } = req.body;

  if (!email) {
    errors.push('Email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
};
