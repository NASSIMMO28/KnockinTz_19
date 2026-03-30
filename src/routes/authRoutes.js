const express = require("express");
const router = express.Router();

const {
  registerGuest,
  registerHost,
  loginUser
} = require("../controllers/authController");

// REGISTER GUEST
router.post("/register-guest", registerGuest);

// REGISTER HOST
router.post("/register-host", registerHost);

// LOGIN
router.post("/login", loginUser);

module.exports = router;