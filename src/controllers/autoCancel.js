exports.cleanupExpiredBookings = async () => {
  const now = new Date();

  await Booking.updateMany(
    {
      status: "pending",
      expiresAt: { $lt: now }
    },
    {
      status: "cancelled"
    }
  );
};