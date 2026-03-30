const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true
  }

}, { timestamps: true });

// prevent duplicates
wishlistSchema.index({ user: 1, property: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);