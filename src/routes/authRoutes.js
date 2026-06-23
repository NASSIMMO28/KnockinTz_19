const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter } = require('../middleware/rateLimitMiddleware');
const { validateLogin, validateRegister } = require('../middleware/validationMiddleware');

const {
  registerGuest,
  registerHost,
  loginUser,
  getProfile,
  updateProfile
} = require("../controllers/authController");

router.post("/register-guest", registerLimiter, validateRegister, registerGuest);
router.post("/register-host", registerLimiter, validateRegister, registerHost);
router.post('/login', loginLimiter, validateLogin, loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;