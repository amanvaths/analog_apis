const mongoose = require('mongoose');

const airdropSchema = new mongoose.Schema({
    email : { type : String, required : true, dropDups: true },
    socialActivity : { type : String  }, 
    status : { type : Number , default: 0 }, 
    airdrop : { type : Number , default: 0 }   
}, { timestamps: true}); 


module.exports = mongoose.model("Airdrop", airdropSchema);