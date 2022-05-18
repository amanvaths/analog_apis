const mongoose = require("mongoose");
const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: "news" }
);

module.exports = mongoose.model("news", newsSchema);