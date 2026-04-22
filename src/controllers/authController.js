const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ==============================
// REGISTER GUEST
// ==============================
exports.registerGuest = async (req, res) => {
  try {

    const { fullName, email, password } = req.body;

    // check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      role: "guest"
    });

    await user.save();

    res.json({
      message: "Guest registered successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



// ==============================
// LOGIN USER
// ==============================
exports.loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    // create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // response bila password
    res.json({
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
exports.registerHost = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const freeUntil = new Date();
    freeUntil.setDate(freeUntil.getDate() + 30);

    const user = new User({
      fullName,
      email,
      phone,
      password: hashedPassword, // ✅ now hashed
      role: "host",
      hostFreeUntil: freeUntil
    });

    await user.save();

    res.json({
      message: "Host registered successfully",
      freeCommissionUntil: freeUntil
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ==============================
// GET PROFILE
// ==============================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// UPDATE PROFILE
// ==============================
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // update name
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;

    // update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // return updated user without password
    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};