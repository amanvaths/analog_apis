const mongoose = require('mongoose');

const presaleSchema = new mongoose.Schema({
    levelname : { type : String , required : true,unique : true,dropDups: true},
    coinquantity : { type : Number , default: 0,required : true},    
    coinremaining : { type : Number , default: 0,required : true},    
    price : { type : Number , default: 0,required : true}, 
    status : { type : Number , default: 0}, 
    persentsold : { type : Number , default: 0},
    duration : { type : Number , default: 0,required : true},
}, { timestamps: true});


module.exports = mongoose.model("Presale", presaleSchema);