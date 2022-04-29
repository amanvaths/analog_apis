const mongoose = require("mongoose");

const userWalletSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    walletAddr: { type: String },
    privateKey: { type: String },
    walleType: { type: String },
    symbol: { type: String },
    balance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("userWallet", userWalletSchema);
