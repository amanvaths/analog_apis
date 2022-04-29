const mongoose = require("mongoose");
const { isEmail } = require("validator");

const transaction_history_Schema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, validate: [isEmail, "Please enter a valid email"] },
    symbol: { type: String },
    amount: { type: Number, default: 0 },
    status: { type: Number, default: 0 },
    to_address: { type: String },
    type: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("transaction_history", transaction_history_Schema);
