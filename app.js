const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const env = require('dotenv');
const cors = require('cors');
const port = 3001
env.config();
const User = require('./models/user');


const mongoose = require('mongoose');
const db = `mongodb+srv://dbUser:dbUser@cluster0.lrk8k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
mongoose.connect(db, { useNewUrlParser: true, }).then(() => console.log('MongoDB connected...')).catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors({
  origin: '*' 
}));

const userRouter = require('./router/userRouter')
app.use('/api',userRouter);

app.get('/get', async function(req, res) { 
  const web3 = require('web3');

/**
 * polygon
 */
 //var Web3 = require('web3');
 //const web3 = new Web3('https://rpc-mumbai.matic.today');
 var Eth = require('web3-eth');
 var eth = new Eth('https://rpc-mumbai.matic.today');
 
 let minABI = [
   // balanceOf
   {
     "constant":true,
     "inputs":[{"name":"_owner","type":"address"}],
     "name":"balanceOf",
     "outputs":[{"name":"balance","type":"uint256"}],
     "type":"function"
   },
   // decimals
   {
     "constant":true,
     "inputs":[],
     "name":"decimals",
     "outputs":[{"name":"","type":"uint8"}],
     "type":"function"
   }
 ];
 
 
 let contract = new web3.eth.Contract(minABI,"0x94881e74d7266f26e19dc247a062daed6f4bfec3");
 async function getBalance() {
   balance = await contract.methods.balanceOf(walletAddress).call();
   return balance;
 }
 
 getBalance().then(function (result) {
   console.log(result);
 });





return res.send("success");
});

app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});