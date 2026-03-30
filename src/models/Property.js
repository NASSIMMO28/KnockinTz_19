const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema({

  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  city: {
    type: String,
    required: true,
    lowercase: true, // 🔥 muhimu kwa search
    trim: true
  },

  address: {
    type: String,
    trim: true
  },

  pricePerNight: {
    type: Number,
    required: true
  },

  // 🔥 IMPORTANT: badilisha guests → maxGuests
  maxGuests: {
    type: Number,
    default: 1
  },

  bedrooms: {
    type: Number,
    default: 1
  },

  bathrooms: {
    type: Number,
    default: 1
  },

  images: {
    type: [String],
    default: []
  },

  latitude: {
    type: Number
  },

  longitude: {
    type: Number
  },

// 🔥 future feature (ratings)
rating: {
  type: Number,
  default: 0
},

averageRating: {
  type: Number,
  default: 0
}
 
},
{ timestamps: true });

module.exports = mongoose.model("Property", PropertySchema);