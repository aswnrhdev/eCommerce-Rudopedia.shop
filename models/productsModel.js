const mongoose = require("mongoose");

const productsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [Number],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  categoryRef: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: false,
  },
  quantity: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: [
    {
      data: {
        type: Buffer,
        required: true,
      },
      contentType: {
        type: String,
        required: true,
      },
    },
  ],

  isListed: {
    type: Boolean,
    default: true,
  },
  price: {
    type: Number,
    required: true,
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
  },
  offerPrice: {
    type: Number,
    default: null,
  },
  catOfferPrice: {
    type: Number,
    default: null,
  },
});

productsSchema.methods.applyCategoryOffer = async function (
  category,
  offerDiscount
) {
  if (this.category === category && this.price) {
    this.catOfferPrice = this.price - this.price * (offerDiscount / 100);
  }
};

module.exports = mongoose.model("products", productsSchema);
