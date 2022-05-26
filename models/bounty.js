const mongoose = require('mongoose');

const bountySchema = new mongoose.Schema({
    email : { type : String, required : true, dropDups: true },
    price : { type : Number , default: 0 }, 
    pool : { type : Number , default: 0 }, 
    purchased : { type : Number , default: 0 }, 
    expense : { type : Number , default : 0 },
    inherited : { type : Number , default : 0 }
}, { timestamps: true}); 


module.exports = mongoose.model("Bounty", bountySchema);