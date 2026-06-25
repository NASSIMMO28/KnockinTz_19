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

// Validation for creating bookings
const validateCreateBooking = (req, res, next) => {
  const errors = [];

  if (!req.body.propertyId) {
    errors.push({ message: 'Property ID is required' });
  }

  if (!req.body.checkIn) {
    errors.push({ message: 'Check-in date is required' });
  }

  if (!req.body.checkOut) {
    errors.push({ message: 'Check-out date is required' });
  }

  if (!req.body.numberOfGuests) {
    errors.push({ message: 'Number of guests is required' });
  } else {
    const guests = parseInt(req.body.numberOfGuests);
    if (isNaN(guests) || guests < 1) {
      errors.push({ message: 'Number of guests must be at least 1' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validation for MongoDB ObjectId
const validateMongoId = (req, res, next) => {
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
  
  const idToCheck = req.params.id || req.body.id;
  
  if (idToCheck && !mongoIdRegex.test(idToCheck)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  next();
};

module.exports = { 
  validateRegister, 
  validateLogin, 
  validateCreateBooking, 
  validateMongoId 
};