const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {    
    name        : { type: String },
    degination  : { type: String },
    image       : { type: String, },  
    status      : { type: Number, default: 0 },  
  },
  { timestamps: true }
);


module.exports = mongoose.model("teamMember", teamMemberSchema);
