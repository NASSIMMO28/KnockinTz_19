const validationMiddleware = (req, res, next) => {
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

  // DATE VALIDATION (for bookings) - FIXED FOR ISO8601
  if (req.body.checkIn) {
    const checkIn = new Date(req.body.checkIn);
    if (isNaN(checkIn.getTime())) {
      errors.push({ message: 'Invalid check-in date' });
    } else if (checkIn < new Date()) {
      // Allow today or future dates
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (checkIn < today) {
        errors.push({ message: 'Check-in date must be today or in the future' });
      }
    }
  }

  if (req.body.checkOut) {
    const checkOut = new Date(req.body.checkOut);
    if (isNaN(checkOut.getTime())) {
      errors.push({ message: 'Invalid check-out date' });
    } else if (checkOut <= new Date(req.body.checkIn || new Date())) {
      errors.push({ message: 'Check-out date must be after check-in date' });
    }
  }

  // numberOfGuests VALIDATION
  if (req.body.numberOfGuests) {
    const guests = parseInt(req.body.numberOfGuests);
    if (isNaN(guests) || guests < 1) {
      errors.push({ message: 'Invalid number of guests' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

module.exports = validationMiddleware;