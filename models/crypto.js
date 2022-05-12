const mongoose = require("mongoose");

const cryptoSchema = new mongoose.Schema(
  {
    symbol: { type: String, required:true, unique: true, trim: true },
    name: { type: String, required:true, unique: true, trim: true },
    is_buy: { type: Boolean, default: false },
    is_sell: { type: Boolean, default: false },
    is_withdrawal: { type: Boolean, default: false },
    is_deposite: { type: Boolean, default: false },
    
  },
  { timestamps: true, collection: "crypto" }
);

module.exports = mongoose.model("crypto", cryptoSchema);
