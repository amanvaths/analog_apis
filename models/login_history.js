const mongoose = require("mongoose");

const login_historySchema = new mongoose.Schema(
  {
    email                   : { type: String, required: true, lowercase: true,  },
    request_address         : { type: String },
    request_device          : { type: String },
    browser_name            : { type: String },
    browser_version         : { type: String }  
  },
  { timestamps: true }
);

module.exports = mongoose.model("login_history", login_historySchema);
