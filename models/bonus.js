const mongoose = require('mongoose');

const bonusSchema = new mongoose.Schema({
    email : { type : String , unique : true, required : true, dropDups: true },
    date : {type: Date, default: Date.now},    
    status : { type : Number , default: 0 }, 
    bonus_type : { type : String ,  required : true },
    token_quantity : { type : Number , default : 0 },
    bonus_percent : { type : Number , default : 0 }
}, { timestamps: true});


module.exports = mongoose.model("Bonus", bonusSchema);