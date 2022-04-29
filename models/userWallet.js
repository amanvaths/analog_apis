const mongoose = require("mongoose");

const userWalletSchema = new mongoose.Schema(
  {
    email           : {  type: String, required: true, lowercase: true,  },
    walletAddr      : { type: String },
    privateKey      : { type: String },
    walletType      : { type: String },
    symbol          : { type: String },
    balance         : { type: Number, default: 0 },
    old_balanace    : { type: Number, default: 0 } 
  },
  { timestamps: true }
);

module.exports = mongoose.model("userWallet", userWalletSchema);
