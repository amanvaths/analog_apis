const mongoose = require("mongoose");

const withdrawlSchema = new mongoose.Schema(
  {
    email           : {  type: String, required: true  },
    user_id         : { type: String },
    fromWallet      : { type : String },
    toWalletAddr    : { type: String },
    amount          : { type : String },
    remarks         : { type : String },
    status          : { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("withdrawl", withdrawlSchema);
