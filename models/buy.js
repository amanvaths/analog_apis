const mongoose = require('mongoose');

const buySchema = new mongoose.Schema({
    email : { type : String , required : true},
    date : {type: Date, default: Date.now},    
    status : { type : Number , default: 0 }, 
    bonus : { type : Number , default : 0},
    token_price : { type : Number , default: 0,  required : true },
    token_quantity : { type : Number , default : 0 },
    token_buying : { type : Number , default : 0},
    bonus_percent : { type : Number , default : 0 },
    from_user : {type: String},
    from_level : {type: String},
    bonus_type : {type: String, required : true}
}, { timestamps: true});


module.exports = mongoose.model("Buy", buySchema);