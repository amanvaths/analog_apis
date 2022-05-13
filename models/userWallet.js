const mongoose = require("mongoose");

const userWalletSchema = new mongoose.Schema(
  {
    email           : {  type: String, required: true, lowercase: true,  },
    walletAddr      : { type: String },
    privateKey      : { type: String },
    walletType      : { type: String },
    symbol          : { type: String },
    balance         : { type: Number, default: 0 },
    v_balance      : { type: Number, default: 0 },
    w_balance      : { type: Number, default: 0 },
    admin_transfer  : { type: Number, default: 0 },
    isBuy           : { type: Number, default: 1 }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("userWallet", userWalletSchema);
