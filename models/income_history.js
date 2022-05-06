const mongoose = require("mongoose");

const income_historySchema = new mongoose.Schema(
  {
    email: {
      type: String,   
      required: true,
      lowercase: true,
      dropDups: true,     
    },   
    user_id : { type: String },
    amount : { type: Date, default: 0 },
    to_user: { type: String },
    from_user: { type: String },
    type    : { type: String },   
  },
  { timestamps: true }
);

module.exports = mongoose.model("income_history", income_historySchema);
