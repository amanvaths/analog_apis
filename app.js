const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const env = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const fileupload = require("express-fileupload");

const port = 3001
env.config();
const { sendMail } = require("./utils/function");  

const mongoose = require('mongoose');
const db = `mongodb+srv://dbUser:dbUser@cluster0.lrk8k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
mongoose.connect(db, { useNewUrlParser: true, }).then(() => console.log('MongoDB connected...')).catch(err => console.log(err));

// app.use(bodyParser.urlencoded({ extended: true }))
// app.use(bodyParser.json())
// app.use(express.json())
app.use(cors({
  origin: '*' 
}));


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileupload({}));

app.use("/images", express.static(__dirname + "/uploads/images"));



const userRouter = require('./router/userRouter')
const notification = require('./router/notification')
app.use('/api',userRouter);
app.use('/api',notification);

app.get('/get', async (req, res) => {  
  try{
  const coin_symbols = "BUSD";
  const conver_currency = "USDT";
  const final_third_party_api_url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${coin_symbols}&convert=${conver_currency}`;
  const ress = await axios.get(final_third_party_api_url, {
    headers: {
      "Content-Type": "Application/json",
      // "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_API_KEY
      "X-CMC_PRO_API_KEY": "024d5931-52b8-4c1f-8d99-3928fd987163",
      "Access-Control-Allow-Origin": "*",
    },
  });
  console.log(ress.data.data.BUSD.quote.USDT.price);
  return res.status(200).json(ress.data.data);
}catch(error){
  console.log("Error in getting cmc price" + error);
}
});





app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});



async function requireSignin(req, res, next) { 
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      const user = jwt.verify(token, process.env.JWT_SECRET);
      req.user = user;
       next();  
    } else {
      return res.status(400).json({ message: "Authorization required" });
    }
    //jwt.decode()
  };
   




/**
 
const jwt = require('jsonwebtoken')

exports.requireSignin = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } else {
    return res.status(400).json({ message: "Authorization required" });
  }
  //jwt.decode()
};
 
 */