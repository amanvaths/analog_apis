const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    banner:  { type: String } ,
    status: {type: Boolean, default: 1},
  },
  { timestamps: true, collection: "notifications" }
);

module.exports = mongoose.model("notifications", notificationSchema);