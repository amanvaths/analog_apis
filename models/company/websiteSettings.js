const mongoose = require("mongoose");

const websiteSchema = new mongoose.Schema(
  {    
    name            : { type: String },
    logo            : { type: String },
    dark_logo       : { type: String, },  
    icon            : { type: String },  
  },
  { timestamps: true }
);


module.exports = mongoose.model("websiteSettings", websiteSchema);
