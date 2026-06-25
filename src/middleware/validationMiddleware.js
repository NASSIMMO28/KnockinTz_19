// Validation middleware for auth routes
const validateRegister = (req, res, next) => {
  const errors = [];

  // EMAIL VALIDATION
  if (req.body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      errors.push({ message: 'Invalid email format' });
    }
  }

  // PASSWORD VALIDATION (min 6 chars)
  if (req.body.password && req.body.password.length < 6) {
    errors.push({ message: 'Password must be at least 6 characters' });
  }

  // ROLE VALIDATION (guest or host)
  if (req.body.role && !['guest', 'host'].includes(req.body.role)) {
    errors.push({ message: 'Role must be guest or host' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validation middleware for login
const validateLogin = (req, res, next) => {
  const errors = [];

  // EMAIL VALIDATION
  if (!req.body.email) {
    errors.push({ message: 'Email is required' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      errors.push({ message: 'Invalid email format' });
    }
  }

  // PASSWORD VALIDATION
  if (!req.body.password) {
    errors.push({ message: 'Password is required' });
  } else if (req.body.password.length < 6) {
    errors.push({ message: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

module.exports = { validateRegister, validateLogin };