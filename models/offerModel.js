const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const offerSchema = new mongoose.Schema({
  offerName: {
    type: String,
    required: true,
  },
  offerDiscount: {
    type: Number,
  },
  expiryDate: {
    type: Date,
  },
});

const Offer = mongoose.model("Offer", offerSchema);
module.exports = Offer;
