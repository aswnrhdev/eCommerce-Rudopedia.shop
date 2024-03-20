const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  secondName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  is_admin: {
    type: Number,
    required: true,
  },
  is_verified: {
    type: Number,
    default: 0,
  },
  is_blocked: {
    type: Number,
    default: 0,
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
    },

    history: [
      {
        type: {
          type: String,
        },
        amount: {
          type: Number,
        },
        date: {
          type: Date,
          default: Date.now,
          required: true,
        },
        reason: {
          type: String,
        },
      },
    ],
  },
  referralCode: {
    type: String,
    unique: true,
  },
});

module.exports = mongoose.model("users", UserSchema);
