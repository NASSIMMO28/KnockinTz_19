const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  fullName: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

phone: {
  type: String,
  unique: true,
  sparse: true   // 🔥 muhimu sana
},
password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["guest","host","admin"],
    default: "guest"
  },

  hostFreeUntil: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("User", userSchema);