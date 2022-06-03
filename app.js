const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config()
const cors = require('cors');
const axios = require('axios');
const fileupload = require("express-fileupload");
const port = 3001
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const http = require('http');
let server = http.createServer(app)
let io = socketIO(server)

const db = process.env.db
mongoose.connect(db, { useNewUrlParser: true, }).then(() => console.log('MongoDB connected...')).catch(err => console.log(err));
app.use(cors({
  origin: '*' 
}));


const User = require('./models/user');

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileupload({}));

app.use("/images", express.static(__dirname + "/uploads/images"));

const userRouter = require('./router/userRouter')
const notification = require('./router/notification')
const chart = require('./router/chart')
app.use('/api',userRouter);
app.use('/api',notification);
app.use('/api', chart)


// make connection with user from server side
io.on('connection', (socket)=>{
  console.log('New user connected');
   //emit message from server to user
   socket.emit('newMessage', {
     from:'jen@mds',
     text:'hepppp',
     createdAt:123
   });
 
  // listen for message from user
  socket.on('createMessage', (newMessage)=>{
    console.log('newMessage', newMessage);
  });
 
  // when server disconnects from user
  socket.on('disconnect', ()=>{
    console.log('disconnected from user');
  });
});


app.get('/get', async (req, res) => {  
  // const url = "https://api.blockcypher.com/v1/btc/main/addrs/1DEP8i3QJCsomS4BSMY2RpU1upv62aGvhD/balance";
  // const ress = await axios.get(url, {
  //   headers: {
  //     "Content-Type": "Application/json",    
  //     "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY, 
  //     "Access-Control-Allow-Origin": "*",
  //   },
  // });
  // console.log(ress.data.balance);

  // const web3 = require("@solana/web3.js");
 
  //   const publicKey = new web3.PublicKey("83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri"); // 2gnbtxYypr8XaAUFBmwyUhdsMM5TXBWQHi1XAmpLif8Q
  //   const solana = new web3.Connection("https://api.testnet.solana.com");
  //   console.log(await solana.getBalance(publicKey));
 


});


app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});



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