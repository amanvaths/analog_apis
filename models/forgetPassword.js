const mongoose = require("mongoose");
const { isEmail } = require("validator");

const forgetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please enter an email"],
      lowercase: true,
      dropDups: true,
      validate: [isEmail, "Please enter a valid email"],
    },
    forgetString: {
      type: String,
      required: [true, "Please enter an password"],
      minlength: [6, "Minimum password length is 6 character"],
    },
    registration_date: { type: Date, default: Date.now },
    status: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("forgetPassword", forgetSchema);
