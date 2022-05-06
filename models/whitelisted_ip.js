const mongoose = require("mongoose");

const whitelisted_ipSchema = new mongoose.Schema(
  {
    email: {
      type: String,   
      required: true,
      lowercase: true,
      dropDups: true,     
    },   
    user_id : { type: String },
    ip : { type: String },   
  },
  { timestamps: true }
);

module.exports = mongoose.model("whitelisted_ip", whitelisted_ipSchema);
