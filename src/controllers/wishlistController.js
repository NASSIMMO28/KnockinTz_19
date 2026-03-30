const Wishlist = require("../models/Wishlist");


// ============================
// ADD TO WISHLIST
// ============================
exports.addToWishlist = async (req, res) => {
  try {

    const { propertyId } = req.body;

    const item = await Wishlist.create({
      user: req.user.id,
      property: propertyId
    });

    res.json({
      message: "Added to wishlist",
      item
    });

  } catch (error) {

    // duplicate case
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Already in wishlist"
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
};


// ============================
// GET MY WISHLIST
// ============================
exports.getWishlist = async (req, res) => {
  try {

    const items = await Wishlist.find({
      user: req.user.id
    }).populate("property");

    res.json({
      count: items.length,
      items
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ============================
// REMOVE FROM WISHLIST
// ============================
exports.removeFromWishlist = async (req, res) => {
  try {

    await Wishlist.findOneAndDelete({
      user: req.user.id,
      property: req.params.propertyId
    });

    res.json({
      message: "Removed from wishlist"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};