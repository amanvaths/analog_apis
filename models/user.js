const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { isEmail } = require("validator");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Please enter an email"],
      lowercase: true,
      dropDups: true,
      validate: [isEmail, "Please enter a valid email"],
    },
    user_id : { type: String, unique : true },
    username : { type: String, unique : true },
    contact_no : { 
            type: Number,
            unique : true,
            minlength: [10, "Contact no. Minimum length is 10 digit"],
          },
    refferal: { type: String },
    password: {
      type: String,     
      minlength: [6, "Minimum password length is 6 character"],
    },
    gmailPass: {
      type: String,     
      minlength: [6, "Minimum password length is 6 character"],
    },
    //my_referral_code: { type: String, unique: true, required: true },
    registration_date: { type: Date, default: Date.now },
    status: { type: Number, default: 0 },
    signup_bonus: { type: Number, default: 0 },
    referral_bonus: { type: Number, default: 0 },
    buying_bonus: { type: Number, default: 0 },
    token_balance: { type: Number, default: 0 },
    total_spend_usdt: { type: Number, default: 0 },
    total_spend_inr: { type: Number, default: 0 },
    otp: { type: Number, default: 0 },
    isVarify: { type: Number, default: 0 },    
    currency : { type: String, default: "INR" },    
    affilites_wallet : { type: Number, default: 0 },
    bounty_wallet : { type: Number, default: 0 },
    airdrop_wallet : { type: Number, default: 0 },
    inherited_wallet : { type: Number, default: 0 },
    handout_wallet : { type: Number, default: 0 },
    inceptive_wallet : { type: Number, default: 0 },
    usdt_wallet      : { type: Number, default: 0 }
  },
  { timestamps: true }
);

// fire a function before doc saved to db
userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("user", userSchema);
