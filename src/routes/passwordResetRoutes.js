const express = require("express");
const router = express.Router();
const { requestPasswordReset, resetPassword } = require("../controllers/passwordResetController");

// Request password reset (send email)
router.post("/request", requestPasswordReset);

// Reset password with token
router.post("/reset", resetPassword);

module.exports = router;