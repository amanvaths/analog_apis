const mongoose = require("mongoose");
const userNotificationSchema = new mongoose.Schema(
  {
    email : { type : String, required : true},
    message: { type: String },
    type:  { type: String },
    status: {type: Boolean, default: 0},
  },
  { timestamps: true }
);

module.exports = mongoose.model("userNotification", userNotificationSchema);