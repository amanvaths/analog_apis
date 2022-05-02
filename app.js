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
const tronWeb = new TronWeb({ fullHost: "https://api.shasta.trongrid.io", });
const fetch = require('cross-fetch');

// getting balance of eth wallet
const wallet = '0xba9e0b72f2dcb624600354f69eb5ea03568f93d8';
const bal1 = await web3Eth.eth.getBalance(wallet);
console.log(bal1 + "ETH balance");

// trx wallet balance 
const trx_wallet = "TM8Ttk9hkdyziA2TDZRV7YVqt4F4TcXRSk";
let trx_balance = await tronWeb.trx.getBalance(trx_wallet);
console.log(trx_balance + "TRX balance");

/**
 * bnb
 */
 const BSCTESTNET_WSS = "https://data-seed-prebsc-1-s1.binance.org:8545/";
 //const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
 //const web3ProviderBnb = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
 const web3ProviderBnb = new Web3.providers.HttpProvider(BSCTESTNET_WSS);
 const web3Bnb = new Web3(web3ProviderBnb);

//  const bal = await web3Bnb.eth.getBalance("0xbd892F3c65A61102e21edAFa875fb3569f4ecAF5");
//  console.log(bal);

/**
 * polygon
 */
//  const BSCTESTNET_WSS = "https://rpc-mumbai.maticvigil.com";
//  //const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
//  //const web3ProviderBnb = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
//  const web3ProviderBnb = new Web3.providers.HttpProvider(BSCTESTNET_WSS);
//  const web3Bnb = new Web3(web3ProviderBnb);

//  const bal = await web3Bnb.eth.getBalance("0x94881e74d7266f26e19dc247a062daed6f4bfec3");
//  console.log(bal + " Matic balance");

    // const {abi} = await tronWeb.trx.getContract("TEfY7aFrZY2Wosx5tt9FmD7bwhLZZFdEPn");
    // const contractToken = tronWeb.contract(abi.entrys, "TEfY7aFrZY2Wosx5tt9FmD7bwhLZZFdEPn");
    // const Tokenbalance1 = await contractToken.methods.balanceOf("TM8Ttk9hkdyziA2TDZRV7YVqt4F4TcXRSk").call();
    // const Tokenbalance = Number(Tokenbalance1);

  var decimal1 = 1e8;
  tronWeb.setAddress("TM8Ttk9hkdyziA2TDZRV7YVqt4F4TcXRSk");
  const instance = await tronWeb.contract().at("TLtzV8o37BV7TecEdFbkFsXqro8WL8a4tK");
  const hex_balance = await instance.balanceOf("TM8Ttk9hkdyziA2TDZRV7YVqt4F4TcXRSk").call();
  const usdt_balance = Number(hex_balance._hex);
  console.log(usdt_balance + " USDT balance");


  const dex = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }],
        name: "transfer",
        outputs: [{ name: "success", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
    },
];



  var contract = new web3Bnb.eth.Contract(dex, "0x1004f1CD9e4530736AadC051a62b0992c198758d");
  const decimal = 18;//await contract.methods.decimals().call();

  const bal = await contract.methods.balanceOf("0x94881e74d7266f26e19dc247a062daed6f4bfec3").call(); //'0x58f876857a02d6762e0101bb5c46a8c1ed44dc16'
  console.log("Bal: ", bal)
  let balance = bal ? bal / Number(`1e${decimal}`) : 0;
  console.log(balance + " BUSD bal");





return res.send("success");
});

app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});