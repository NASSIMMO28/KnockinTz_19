const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});
// ================================
// REQUEST PASSWORD RESET
// ================================
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists (security)
      return res.status(200).json({
        message: "If email exists, reset link has been sent"
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save to user
    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send email
    const resetLink = `https://knockin-frontend-71vx.vercel.app/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "KNOCKIN - Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4af37;">Password Reset Request</h2>
          <p>Hi ${user.fullName},</p>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #d4af37; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            This link will expire in 30 minutes.<br>
            If you didn't request this, ignore this email.
          </p>
          <p style="color: #999; font-size: 11px;">KNOCKIN Team</p>
        </div>
      `,
    };

    const msg = {
  to: email,
  from: 'noreply@knockin.tz', // Use any email - SendGrid handles it
  subject: 'KNOCKIN - Password Reset Request',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d4af37;">Password Reset Request</h2>
      <p>Hi ${user.fullName},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #d4af37; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        This link will expire in 30 minutes.<br>
        If you didn't request this, ignore this email.
      </p>
      <p style="color: #999; font-size: 11px;">KNOCKIN Team</p>
    </div>
  `,
};s

await sgMail.send(msg);

    res.json({
      message: "If email exists, reset link has been sent"
    });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================================
// RESET PASSWORD WITH TOKEN
// ================================
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required"
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetToken: resetTokenHash,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token"
      });
    }

    // Hash new password
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successfully!" });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: error.message });
  }
};