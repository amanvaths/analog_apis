const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {    
    description        : { type: String },
    image          : { type: String },
    status         : { type: Number, default: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("offers", offerSchema);
