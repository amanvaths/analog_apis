const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    email                    : { type: String, unique: true, required: true, lowercase: true },   
    unusual_activity         : { type: Number, default: 0 },
    new_browser              : { type: Number, default: 0 },
    sales_latest_news        : { type: Number, default: 0 },                 
    new_features_updates     : { type: Number, default: 0 },                    
    tips                     : { type: Number, default: 0 },  
    google_authenticator_ascii  : { type: String },
    google_authenticator        : { type: Number, default: 0 },
    login_activity           : { type : Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
