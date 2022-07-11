const mongoose = require("mongoose");

const newsprSchema = new mongoose.Schema(
  {    
    title        : { type: String },
    shortMessage  : { type: String },
    message       : { type: String, },  
    status      : { type: Number, default: 0 },  
    image         : { type: String }
  },
  { timestamps: true }
);


module.exports = mongoose.model("newspr", newsprSchema);
