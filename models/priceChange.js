const mongoose = require('mongoose');

const priceChangeSchema = new mongoose.Schema({
    levelname : { type : String , required : true},
    coinquantity : { type : Number , default: 0,required : true},    
    coinsold : { type : Number , default: 0,required : true},    
    changeprice : { type : Number , default: 0,required : true}, 
    changepriceusdt : { type : Number , default: 0,required : true}, 
    oldprice : { type : Number , default: 0,required : true}, 
    oldpriceusdt : { type : Number , default: 0,required : true}, 
    time : { type : Number , default: 0,required : true}, 
    changepercent : { type : Number , default: 0,required : true}
}, { timestamps: true});


module.exports = mongoose.model("PriceChange", priceChangeSchema);