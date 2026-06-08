const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const adminController = require("../controllers/adminController");

const adminOnly = [protect, authorizeRoles("admin")];

router.get("/stats", ...adminOnly, adminController.getStats);
router.get("/users", ...adminOnly, adminController.getUsers);
router.delete("/users/:id", ...adminOnly, adminController.deleteUser);
router.put("/users/:id/make-admin", ...adminOnly, adminController.makeAdmin);
router.get("/properties", ...adminOnly, adminController.getProperties);
router.delete("/properties/:id", ...adminOnly, adminController.deleteProperty);
router.get("/bookings", ...adminOnly, adminController.getBookings);
router.put("/bookings/:id", ...adminOnly, adminController.updateBooking);

// GET all withdrawals
router.get("/withdrawals", adminOnly, async (req, res) => {
  try {
    const User = require("../models/User");
    const Booking = require("../models/Booking");

    // get all hosts with payout details
    const hosts = await User.find({ role: "host" })
      .select("fullName email payoutMethod payoutPhone payoutBankName payoutBankAccount payoutBankBranch");

    // get completed bookings with payout pending
    const bookings = await Booking.find({
      payoutStatus: { $in: ["pending", "scheduled"] },
      status: { $in: ["checked_in", "completed"] }
    }).populate("host", "fullName email payoutMethod payoutPhone payoutBankName payoutBankAccount");

    // group by host
    const withdrawalMap = {};
    bookings.forEach(b => {
      const hostId = b.host?._id?.toString();
      if (!hostId) return;
      if (!withdrawalMap[hostId]) {
        withdrawalMap[hostId] = {
          _id: hostId,
          host: b.host,
          amount: 0,
          payoutMethod: b.host?.payoutMethod,
          payoutPhone: b.host?.payoutPhone,
          payoutBankName: b.host?.payoutBankName,
          payoutBankAccount: b.host?.payoutBankAccount,
          status: "pending",
          bookings: [],
          createdAt: new Date()
        };
      }
      withdrawalMap[hostId].amount += b.payoutAmount || 0;
      withdrawalMap[hostId].bookings.push(b._id);
    });

    const withdrawals = Object.values(withdrawalMap);
    res.json({ withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE withdrawal status
router.put("/withdrawals/:hostId", adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const Booking = require("../models/Booking");

    if (status === "processed") {
      await Booking.updateMany(
        { host: req.params.hostId, payoutStatus: { $in: ["pending", "scheduled"] } },
        { payoutStatus: "paid" }
      );
    }

    res.json({ message: `Withdrawal ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;