require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const helmet = require('helmet');

const app = express();

// ⭐ CORS MUST BE FIRST
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:53100",
      "https://knockin-frontend-71vx.vercel.app",
      "https://knockin-admin-hw7x.vercel.app"
    ];
    
    // ✅ Allow ALL localhost ports (dynamic ports)
    if (!origin) return callback(null, true);
    if (origin.startsWith("http://localhost:")) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Helmet AFTER CORS
app.use(helmet());

// ======================
// MIDDLEWARE
// ======================
app.use(express.json());

// ======================
// STATIC FOLDER (IMAGES)
// ======================
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ======================
// ROUTES
// ======================
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const hostRoutes = require("./routes/hostRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const walletRoutes = require("./routes/walletRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/host", hostRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/notifications", notificationRoutes);

// ======================
// TEST ROUTE
// ======================
app.get("/", (req, res) => {
  res.send("KNOCK-IN API running...");
});

// ======================
// ❌ NOT FOUND HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// ======================
// 🔥 GLOBAL ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.message === "Only image files are allowed") {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({
    message: err.message || "Server error"
  });
});

// ======================
// DB CONNECT + CLEANUP
// ======================
const { cleanupExpiredBookings } = require("./controllers/bookingController");
const PlatformConfig = require("./models/PlatformConfig");

const seedConfig = async () => {
  const defaults = [
    { key: "host_commission", value: 0.05, description: "Host commission rate (5%)" },
    { key: "guest_service_fee", value: 0.05, description: "Guest service fee (5%)" },
    { key: "min_withdrawal", value: 50000, description: "Minimum withdrawal amount (TZS)" },
  ];

  for (const config of defaults) {
    await PlatformConfig.findOneAndUpdate(
      { key: config.key },
      { $setOnInsert: config },
      { upsert: true, new: true }
    );
  }
  console.log("✅ Platform config seeded");
};

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    seedConfig();
    setInterval(() => {
      cleanupExpiredBookings();
    }, 5 * 60 * 1000);
  })
  .catch(err => console.log(err));

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});