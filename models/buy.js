const mongoose = require('mongoose');

const buySchema = new mongoose.Schema({
    email : { type : String , required : true},
    date : {type: Date, default: Date.now},    
    status : { type : Number , default: 0 }, 
    bonus : { type : Number , default : 0},
    ho_bonus : { type : Number , default : 0},
    currency_type : { type : String , default : 0},
    compair_currency : { type : String , default : 0},
    token_price : { type : Number , default: 0,  required : true },
    pref_token_price : { type : Number , default: 0,  required : true },
    token_quantity : { type : Number , default : 0 },
    token_buying : { type : Number , default : 0},
    amount : { type : Number , default : 0},
    preferred_currency_amount : { type : Number , default : 0},
    bonus_percent : { type : Number , default : 0 },
    from_user : {type: String},
    from_userid : {type: String},
    from_level : {type: Number, default: 0 },
    currency:{type: String},
    bonus_type : {type: String, required : true},
    order_id : {type: String, required : true},
    presalelevel : {type: String, required : true}
}, { timestamps: true});


module.exports = mongoose.model("Buy", buySchema);