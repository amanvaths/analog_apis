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
 * eth
 */
// const eth_mainnet = 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
const eth_testnet = 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
const Web3 = require("web3");
const web3Provider = new Web3.providers.HttpProvider(eth_testnet);
const web3Eth = new Web3(web3Provider);

/**
 * trx
 * here we will use cross fetch
 */
const TronWeb = require("tronweb");
const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io", });
const fetch = require('cross-fetch');

// getting balance of eth wallet
const wallet = '0xba9e0b72f2dcb624600354f69eb5ea03568f93d8';
const bal = await web3Eth.eth.getBalance(wallet);
console.log(bal + "ETH balance");

// trx wallet balance 
const trx_wallet = "TV7cRCWzhUiDKmL5RFZN2UQJugzHpzLnry";
let trx_balance = await tronWeb.trx.getBalance(trx_wallet);
console.log(trx_balance + "TRX balance");

// usdt wallet balance 
// const decimal = 1e6;
// tronWeb.setAddress(wallet.wallet_address);
// const instance = await tronWeb.contract().at(wallet.contract_address);
// const hex_balance = await instance.balanceOf(wallet.wallet_address).call();
// const usdt_balance = Number(hex_balance._hex);
// console.log(usdt_balance + "usdt balance");

return res.send("success");
});

app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});