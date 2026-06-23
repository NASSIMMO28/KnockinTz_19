const { body, validationResult, param } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Authentication validations
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

const validateRegister = [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['guest', 'host']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  handleValidationErrors,
];

// Booking validations
const validateCreateBooking = [
  body('propertyId').isMongoId().withMessage('Invalid property ID'),
  body('checkInDate').isISO8601().withMessage('Invalid check-in date'),
  body('checkOutDate').isISO8601().withMessage('Invalid check-out date'),
  body('numberOfGuests').isInt({ min: 1, max: 20 }).withMessage('Invalid number of guests'),
  body('specialRequests').optional().trim().isLength({ max: 500 }).withMessage('Special requests too long'),
  handleValidationErrors,
];

// Property validations
const validateCreateProperty = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be 20-5000 characters'),
  body('location').trim().isLength({ min: 3 }).withMessage('Invalid location'),
  body('pricePerNight').isFloat({ min: 0 }).withMessage('Invalid price'),
  body('maxGuests').isInt({ min: 1, max: 100 }).withMessage('Invalid max guests'),
  body('bedrooms').isInt({ min: 1, max: 50 }).withMessage('Invalid bedrooms'),
  body('bathrooms').isFloat({ min: 0.5 }).withMessage('Invalid bathrooms'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  handleValidationErrors,
];

// Withdrawal validations
const validateWithdrawal = [
  body('amount').isFloat({ min: 1000 }).withMessage('Minimum withdrawal is TZS 1000'),
  body('bankDetails').trim().isLength({ min: 5 }).withMessage('Invalid bank details'),
  body('accountNumber').trim().isAlphanumeric().isLength({ min: 10, max: 20 }).withMessage('Invalid account number'),
  handleValidationErrors,
];

// ID validations
const validateMongoId = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  handleValidationErrors,
];

// Query validations
const validatePagination = [
  body('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateCreateBooking,
  validateCreateProperty,
  validateWithdrawal,
  validateMongoId,
  validatePagination,
};