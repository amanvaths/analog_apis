const mongoose = require("mongoose");

const wallet_coldSchema = new mongoose.Schema(
  {
    id: { type: Number },
    symbol: { type: String, required: true},
    wallet_address: { type: String, required: true },
    capture_fund: { type: Boolean, default: false },
    total_funds: { type: Number, default: 0 },
    last_captured: { type: Date, default: new Date() },
  },
  { timestamps: true, collection: "wallet_cold" }
);

module.exports = mongoose.model("wallet_cold", wallet_coldSchema);
