const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "address",
    required: true,
  },
  coupon: {
    type: mongoose.Schema.Types.Mixed,
    ref: "Coupon",
    required: false,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      ProductOrderStatus: {
        type: String,
        required: true,
      },
      returnOrderStatus: {
        status: {
          type: String,
        },
        reason: {
          type: String,
        },
        date: {
          type: Date,
        },
      },
    },
  ],
  cancelDescription: {
    type: String,
  },
  OrderStatus: {
    type: String,
    required: true,
  },
  StatusLevel: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  trackId: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = {
  Order,
};
