const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { isEmail } = require("validator");

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Please enter an email"],
      lowercase: true,
      dropDups: true,
      validate: [isEmail, "Please enter a valid email"],
    },   
    password: {
      type: String,     
      minlength: [6, "Minimum password length is 6 character"],
    },   
    status: { type: Number, default: 0 }   
  },
  { timestamps: true }
);

// fire a function before doc saved to db
adminSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("admin", adminSchema);
