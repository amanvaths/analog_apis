const express = require("express");
const axios = require("axios");
const router = express.Router();

const query_coin_symbol_array = [
  "btc",
  "eth",
  "trx",
  "usdt",
  "busd",
  "shib",
  "bnb",
  "matic",
  "sol",
];

const etherBased = ['ETH',"INRX", "SHIB", "MATIC"];
const tronBased = ['BULL', 'TRX'];
const tContractBased = ['USDT',];
const bnbBased = ['BNB',];
const bnbContractBased = ['BUSD'];


const dex = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
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
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

/**
 * eth
 */
const eth_mainnet =
  "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
const eth_testnet =
  "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
const Web3 = require("web3");
const web3Provider = new Web3.providers.HttpProvider(eth_mainnet);
const web3Eth = new Web3(web3Provider);

/**
 * trx
 * here we will use cross fetch
 */
const TronWeb = require("tronweb");
//const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io" });
const tronWeb = new TronWeb({ fullHost: "https://api.shasta.trongrid.io", });
const fetch = require("cross-fetch");

/**
 * bnb
 */
const BSCTESTNET_WSS = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
//const web3ProviderBnb = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
const web3ProviderBnb = new Web3.providers.HttpProvider(BSCTESTNET_WSS);
const web3Bnb = new Web3(web3ProviderBnb);

router.post('/updateUserDeposit',async (req, res)=>{
    try {
        console.log("UpdateUserDeposit")
        const email = req.body.email;
        const userWalletModel = require("../models/userWallet");
        const usersWalletList = await userWalletModel.find({email:email});
        if(usersWalletList) {
            usersWalletList.map(async (userWallet)=>{
                //console.log("userWallet :: ",userWallet);
                const walletSymbol = userWallet.symbol;
                const walletAddrs = userWallet.walletAddr;
                const walletPrKey = userWallet.privateKey;
                if(etherBased.includes(walletSymbol)) { 
                    const bal = await web3Eth.eth.getBalance(walletAddrs);
                    console.log("ether based", walletSymbol, "Balance :: ", bal);
                } else if(tronBased.includes(walletSymbol)) {
                    const bal = await tronWeb.trx.getBalance(walletAddrs);
                    console.log("tron based", walletSymbol, "Balance :: ", bal);
                } else if (bnbBased.includes(walletSymbol)) {
                    const bal = await web3Bnb.eth.getBalance(walletAddrs);
                    console.log("bnb based", walletSymbol, "Balance :: ", bal);
                } else if (tContractBased.includes(walletSymbol)) {
                    tronWeb.setAddress(walletAddrs);
                    const instance = await tronWeb.contract().at("TLtzV8o37BV7TecEdFbkFsXqro8WL8a4tK");
                    const hex_balance = await instance.balanceOf(walletAddrs).call();
                    const bal = Number(hex_balance._hex);
                    console.log("tContract based", walletSymbol, "Balance :: ", bal);
                } else if(bnbContractBased.includes(walletSymbol)) {
                    const contract = new web3Bnb.eth.Contract(dex, '0x1004f1CD9e4530736AadC051a62b0992c198758d');
                    //const decimal = 18;//await contract.methods.decimals().call();
                    const bal = await contract.methods.balanceOf(walletAddrs).call();
                    console.log("bnbContract based", walletSymbol, "Balance :: ", bal);
                }
            })
            return res.status(200).json({message: "user's wallet found."});
        } else {
            return res.status(400).json({message: "user's wallet not found."});
        }
    } catch(error) {
        console.log(error.message);
        return res.status(400).json({message: error.message});
    }
})

module.exports = router;
