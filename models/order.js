const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    order_id: {type : String , required : true },
    email : { type : String , required : true},
    date : {type: Date, default: Date.now},    
    amount : { type : Number , default: 0 }, 
    preferred_currency_amount : { type : Number , default : 0},
    raw_price : { type : Number , default: 0 }, 
    currency_type : { type : String , default : 0},
    compair_currency : { type : String , default : 0},
    presalelevel : { type : String , default : 0},
    cVolume : { type : Number , default : 0},
   
}, { timestamps: true});


module.exports = mongoose.model("order", orderSchema);