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

/**
 * eth
 */
const eth_mainnet = 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
const eth_testnet = 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
const Web3 = require("web3");
const web3Provider = new Web3.providers.HttpProvider(eth_mainnet);
const web3Eth = new Web3(web3Provider);

/**
 * trx
 * here we will use cross fetch
 */
const TronWeb = require("tronweb");
const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io", });
const fetch = require('cross-fetch');

/**
 * bnb
 */
const BSCTESTNET_WSS = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
const web3ProviderBnb = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
const web3Bnb = new Web3(web3ProviderBnb);

async function updateUserDeposit(req, res) {
    try {
        const { user_id } = req.body;
        if (user_id && validateUserId(user_id)) {
            let go = await canUpdate(user_id);
            if (go) {
                /**
             * fetch all wallets
             */
                // console.log("user_id: ", user_id);

                var walletETH = await Wallets.find({ user_id: user_id, wallet_type: 'ETH' });
                // var walletUSDT1 = await Wallets.findOne({ user_id: user_id, wallet_type: 'USDT' });
                var walletUSDT = await Wallets.find({ user_id: user_id, wallet_type: 'USDT' });
                var walletTRX = await Wallets.find({ user_id: user_id, wallet_type: 'TRX' });
                var walletBTT = await Wallets.find({ user_id: user_id, wallet_type: 'BTT' });
                var walletBNB = await Wallets.find({ user_id: user_id, wallet_type: 'BNB' });
                var walletBTEX = await Wallets.find({ user_id: user_id, wallet_type: 'VRX' });
                var walletBUSD = await Wallets.find({ user_id: user_id, wallet_type: 'BUSD' });
                var walletBET = await Wallets.find({ user_id: user_id, wallet_type: 'BULL' });
                // console.log(walletETH, walletUSDT, walletTRX, walletBNB, walletBTEX)

                var walletETH = walletETH.find((data) => data.user == user_id);
                var walletUSDT = walletUSDT.find((data) => data.user == user_id);
                var walletTRX = walletTRX.find((data) => data.user == user_id);
                var walletBNB = walletBNB.find((data) => data.user == user_id);
                var walletBTEX = walletBTEX.find((data) => data.user == user_id);
                var walletBTT = walletBTT.find((data) => data.user == user_id);
                var walletBUSD = walletBUSD.find((data) => data.user == user_id);
                var walletBET = walletBET.find((data) => data.user == user_id);
                // console.log(walletUSDT, walletUSDT1)
                /**
                 * check for balance
                 */
                if (walletETH && walletETH.wallet_type == 'ETH') {
                    console.log("ETH")
                    let wallet = walletETH;
                    const decimal = 1e18;
                    const bal = await web3Eth.eth.getBalance(wallet.wallet_address);
                    let balance = bal ? bal / decimal : 0;
                    if (balance > 0) {
                        /**
                         * check for v balance
                         */
                        const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                        const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                        /**check for admin transfer */
                        const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                        const balance_without_admin_transfer = balance - admin_transfer;
                        const updated_balance = balance_without_admin_transfer - v_balance;
                        const new_v_balance = v_balance + updated_balance;
                        const new_w_balance = w_balance + updated_balance;
                        /**
                         * update user's wallet
                         */
                        await Wallets.updateOne({ _id: walletETH._id }, {
                            $set: {
                                balance: new_w_balance,
                                v_balanace: new_v_balance
                            }
                        });
                        if (updated_balance > 0) {
                            createDepositHistory(user_id, 'ETH', wallet.wallet_address, updated_balance);
                        }
                        try {
                            // instance
                            const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                            const esgas = await web3Eth.eth.estimateGas({
                                to: admin_wallets.wallet_address
                            });
                            const gasp = await web3Eth.eth.getGasPrice()
                            const createTransaction = await web3Eth.eth.accounts.signTransaction(
                                {
                                    from: wallet.wallet_address,
                                    to: wallet.wallet_address,
                                    value: ((bal) - (esgas * gasp)),
                                    gas: esgas,
                                },
                                wallet.private_key
                            );
                            // Deploy transaction
                            const createReceipt = await web3Eth.eth.sendSignedTransaction(
                                createTransaction.rawTransaction
                            );
                            if (createReceipt) {
                                /**
                                    update v_balance as 0
                                    and last capture time and amount
                                */
                                await Wallets.updateOne({ _id: wallet._id }, {
                                    $set: {
                                        v_balanace: 0,
                                        ac_balance: balance,
                                        admin_transfer: 0,
                                        ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                        ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                    }
                                });
                            }
                        } catch (error) {
                            console.log("Error in deposit capture fund! ", error.message);
                        }
                    }
                }
                if (walletUSDT && walletUSDT.wallet_type == 'USDT') {
                    console.log("USDT")
                    let wallet = walletUSDT;
                   
                    const decimal = 1e6;
                    tronWeb.setAddress(wallet.wallet_address);
                    const instance = await tronWeb.contract().at(wallet.contract_address);
                    const hex_balance = await instance.balanceOf(wallet.wallet_address).call();
                    const usdt_balance = Number(hex_balance._hex);
                    if (usdt_balance > 0) {

                        // console.log("USDT wallet: ", usdt_balance);
                        // perform transaction of trx

                        let balance = usdt_balance ? usdt_balance / decimal : 0;

                        // check for v balance

                        const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                        const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                        //check for admin transfer
                        const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                        const balance_without_admin_transfer = balance - admin_transfer;
                        const updated_balance = balance_without_admin_transfer - v_balance;
                        if (updated_balance >= 0) {
                            const new_v_balance = v_balance + updated_balance;
                            const new_w_balance = w_balance + updated_balance;
                            //update wallet
                            // console.log(new_v_balance, new_w_balance)
                            await Wallets.updateOne({ _id: wallet._id }, {
                                $set: {
                                    balance: new_w_balance,
                                    v_balanace: new_v_balance
                                }
                            });
                            if (updated_balance > 0) {
                                createDepositHistory(user_id, 'USDT', wallet.wallet_address, updated_balance);
                            }
                            const hot_wallet = await HotWallet.findOne({
                                wallet_type: 'TRX'
                            })
                            let trx_balance = await tronWeb.trx.getBalance(wallet.wallet_address);
                            let actual_trx_balance = trx_balance ? trx_balance / 1e6 : 0;
                            let tron_txf = 20;
                            if (actual_trx_balance <= tron_txf && updated_balance > 0) {
                                const tradeobj = await tronWeb.transactionBuilder.sendTrx(wallet.wallet_address, (tron_txf * 1e6), hot_wallet.wallet_address);
                                const signedtxn = await tronWeb.trx.sign(tradeobj, hot_wallet.private_key);
                                const trxreceipt = await tronWeb.trx.sendRawTransaction(signedtxn);
                                console.log("Abcd (USDT): ", trxreceipt)
                                if (trxreceipt.result) {
                                    // update admin transfer in wallet

                                    var wTRX = await Wallets.find({ user_id: user_id, wallet_type: 'TRX' });
                                    console.log("wTRX: ", wTRX);
                                    wTRX = walletTRX.find((data) => data.user == user_id);
                                    console.log("wTRX: ", wTRX);
                                    let new_admin_tx = parseFloat(wTRX.admin_transfer) + tron_txf;
                                    console.log("wTRX: ", new_admin_tx);
                                    await Wallets.updateOne({ _id: wTRX._id }, {
                                        $set: {
                                            admin_transfer: new_admin_tx
                                        }
                                    });
                                    console.log("wTRX: f");
                                    await FundTransferHistory.create({
                                        to_user: wallet.user,
                                        from_user: "Admin",
                                        from_address: hot_wallet.wallet_address,
                                        wallet_type: 'TRX',
                                        purpose: "On USDT deposit",
                                        type: 'admin_transfer',
                                        amount: tron_txf,
                                        date: Date.now()
                                    })
                                    try {
                                        // instance
                                        const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                        const usdtreceipt = await instance.transfer(
                                            admin_wallets.wallet_address,
                                            usdt_balance
                                        ).send({
                                            feeLimit: 20000000
                                        }, wallet.private_key);
                                        if (usdtreceipt) {
                                            /**
                                                update v_balance as 0
                                                and last capture time and amount
                                            */
                                            await Wallets.updateOne({ _id: wallet._id }, {
                                                $set: {
                                                    v_balanace: 0,
                                                    ac_balance: balance,
                                                    ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                                    ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                                }
                                            });
                                        }
                                    } catch (error) {
                                        console.log("Error in deposit capture fund! ", error.message);
                                    }
                                }
                            } else {
                                try {
                                    // instance
                                    const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                    const usdtreceipt = await instance.transfer(
                                        admin_wallets.wallet_address,
                                        usdt_balance
                                    ).send({
                                        feeLimit: 20000000
                                    }, wallet.private_key);
                                    if (usdtreceipt) {
                                        /**
                                            update v_balance as 0
                                            and last capture time and amount
                                        */
                                        await Wallets.updateOne({ _id: wallet._id }, {
                                            $set: {
                                                v_balanace: 0,
                                                ac_balance: balance,
                                                ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                                ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                            }
                                        });
                                    }
                                } catch (error) {
                                    console.log("Error in deposit capture fund! ", error.message);
                                }
                            }
                        } else {
                            // const new_v_balance = v_balance + updated_balance;
                            //update wallet
                            // console.log(new_v_balance, new_w_balance)
                            await Wallets.updateOne({ _id: wallet._id }, {
                                $set: {
                                    admin_transfer: updated_balance
                                }
                            });
                        }
                        // transaction code will not be there

                    }
                }
                if (walletTRX && walletTRX.wallet_type == 'TRX') {
                    console.log("TRX")
                    let wallet = walletTRX;
                    const decimal = 1e6;
                    const gasfeetrx = (.3 * 1e6);
                    const ds = await fetch(`https://api.trongrid.io/v1/accounts/${wallet.wallet_address}`);//TBGXMT56vCd7H1jqYUW5RtJYbmqfJ3zM8p`);//${wallet.wallet_address}`);//);
                    const dt = await ds.json();
                    let trc10 = [];
                    let trc20 = [];
                    console.log(dt['data'][0], "trx");
                    if (dt && dt['data'] && dt['data'].length > 0 && dt['data'][0]) {
                        trc10 = dt['data'][0].assetV2 ? dt['data'][0].assetV2 : [];
                        trc20 = dt['data'][0].trc20.length > 0 ? dt['data'][0].trc20 : [];
                        let trx_balance = dt['data'][0].balance;
                        console.log("Trx: balance: ", trx_balance)
                        if (trx_balance > 0) {
                            /**
                             * perform transaction of trx
                             */
                            let balance = trx_balance ? trx_balance / decimal : 0;
                            /**
                             * check for v balance
                             */
                            const v_balance = !isNaN(wallet.v_balanace) ? parseFloat(wallet.v_balanace) : 0;
                            const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                            console.log("v balance: ", v_balance);
                            /**check for admin transfer */
                            const admin_transfer = wallet.admin_transfer && wallet.admin_transfer >= 0 ? parseFloat(wallet.admin_transfer) : 0;
                            const balance_without_admin_transfer = balance - admin_transfer;
                            // console.log("balance www: ", v_balance, balance, balance_without_admin_transfer, balance_without_admin_transfer - v_balance)
                            const updated_balance = balance_without_admin_transfer - v_balance;
                            console.log("updated_balance : ", updated_balance);
                            if (updated_balance >= 0) {
                                const new_v_balance = v_balance + updated_balance;
                                // console.log(new_v_balance, wallet.v_balanace)
                                const new_w_balance = w_balance + updated_balance;
                                /**
                                 * update user's wallet
                                 */

                                // console.log("balance: ", balance, new_v_balance, new_w_balance, wallet);
                                const ttt = await Wallets.updateOne({ _id: walletTRX._id }, {
                                    $set: {
                                        balance: new_w_balance,
                                        v_balanace: new_v_balance
                                    }
                                });
                                if (updated_balance > 0) {
                                    createDepositHistory(user_id, 'TRX', wallet.wallet_address, updated_balance)
                                }
                                try {
                                    // instance
                                    if (trx_balance - gasfeetrx > 0) {
                                        const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                        const tradeobj = await tronWeb.transactionBuilder.sendTrx(admin_wallets.wallet_address, trx_balance - gasfeetrx, wallet.wallet_address);
                                        const signedtxn = await tronWeb.trx.sign(tradeobj, wallet.private_key);
                                        const trxreceipt = await tronWeb.trx.sendRawTransaction(signedtxn);
                                        console.log("trxreceipt: : : ", trxreceipt)
                                        if (trxreceipt.result) {
                                            /**
                                                update v_balance as 0
                                                and last capture time and amount
                                            */
                                            const ds1 = await fetch(`https://api.trongrid.io/v1/accounts/${wallet.wallet_address}`);//TBGXMT56vCd7H1jqYUW5RtJYbmqfJ3zM8p`);//${wallet.wallet_address}`);//);
                                            const dt1 = await ds1.json();
                                            console.log(">>>>", dt1);
                                            if (dt1 && dt1['data'] && dt1['data'].length > 0 && dt1['data'][0]) {
                                                let trx_balance = dt1['data'][0].balance;
                                                await Wallets.updateOne({ _id: wallet._id }, {
                                                    $set: {
                                                        v_balanace: 0,
                                                        ac_balance: ((trx_balance - gasfeetrx)/1e6),
                                                        admin_transfer: (trx_balance/1e6),
                                                        ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                                        ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + ((trx_balance - gasfeetrx) / 1e6) : "" + ((trx_balance - gasfeetrx)/1e6)
                                                    }
                                                });
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.log("Error in deposit capture fund! ", error);
                                }
                            } else {

                            }

                        }
                    }
                }

                if (walletBET && walletBET.wallet_type == 'BULL') {
                    console.log("BULLBHai")
                    let wallet = walletBET;
                    try {
                        const decimal = 1e8;
                        tronWeb.setAddress(wallet.wallet_address);
                        const instance = await tronWeb.contract().at(wallet.contract_address);
                        const hex_balance = await instance.balanceOf(wallet.wallet_address).call();
                        const usdt_balance = Number(hex_balance._hex);

                        if (usdt_balance > 0) {
                            let balance = usdt_balance ? usdt_balance / decimal : 0;

                            // check for v balance

                            const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                            const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                            //check for admin transfer
                            const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                            const balance_without_admin_transfer = balance - admin_transfer;
                            const updated_balance = balance_without_admin_transfer - v_balance;
                            if (updated_balance >= 0) {
                                const new_v_balance = v_balance + updated_balance;
                                const new_w_balance = w_balance + updated_balance;
                                //update wallet
                                // console.log(new_v_balance, new_w_balance)
                                await Wallets.updateOne({ _id: wallet._id }, {
                                    $set: {
                                        balance: new_w_balance,
                                        v_balanace: new_v_balance
                                    }
                                });
                                if (updated_balance > 0) {
                                    createDepositHistory(user_id, 'BULL', wallet.wallet_address, updated_balance);
                                }
                                const hot_wallet = await HotWallet.findOne({
                                    wallet_type: 'TRX'
                                })
                                let trx_balance = await tronWeb.trx.getBalance(wallet.wallet_address);
                                let actual_trx_balance = trx_balance ? trx_balance / 1e6 : 0;
                                let tron_txf = 3;
                                if (actual_trx_balance <= tron_txf && updated_balance > 0) {
                                    const tradeobj = await tronWeb.transactionBuilder.sendTrx(wallet.wallet_address, (tron_txf * 1e6), hot_wallet.wallet_address);
                                    const signedtxn = await tronWeb.trx.sign(tradeobj, hot_wallet.private_key);
                                    const trxreceipt = await tronWeb.trx.sendRawTransaction(signedtxn);
                                    if (trxreceipt.result) {
                                        // update admin transfer in wallet
                                        var wTRX = await Wallets.find({ user_id: user_id, wallet_type: 'TRX' });
                                        wTRX = walletTRX.find((data) => data.user == user_id);
                                        let new_admin_tx = parseFloat(wTRX.admin_transfer) + tron_txf;
                                        await Wallets.updateOne({ _id: wTRX._id }, {
                                            $set: {
                                                admin_transfer: new_admin_tx
                                            }
                                        });
                                        await FundTransferHistory.create({
                                            to_user: wallet.user,
                                            from_user: "Admin",
                                            from_address: hot_wallet.wallet_address,
                                            wallet_type: 'TRX',
                                            purpose: "On BULL deposit",
                                            type: 'admin_transfer',
                                            amount: tron_txf,
                                            date: Date.now()
                                        })
                                        try {
                                            // instance
                                            const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                            const usdtreceipt = await instance.transfer(
                                                admin_wallets.wallet_address,
                                                usdt_balance
                                            ).send({
                                                feeLimit: 10000000
                                            }, wallet.private_key);
                                            if (usdtreceipt) {
                                                /**
                                                    update v_balance as 0
                                                    and last capture time and amount
                                                */
                                            }
                                            await Wallets.updateOne({ _id: wallet._id }, {
                                                $set: {
                                                    v_balanace: 0,
                                                    ac_balance: balance,
                                                    ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                                    ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                                }
                                            });
                                        } catch (error) {
                                            console.log("Error in deposit capture fund! ", error.message);
                                        }
                                    }
                                } else {
                                    try {
                                        // instance
                                        const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                        const usdtreceipt = await instance.transfer(
                                            admin_wallets.wallet_address,
                                            usdt_balance
                                        ).send({
                                            feeLimit: 10000000
                                        }, wallet.private_key);
                                        if (usdtreceipt) {
                                            /**
                                                update v_balance as 0
                                                and last capture time and amount
                                            */
                                        }
                                        await Wallets.updateOne({ _id: wallet._id }, {
                                            $set: {
                                                v_balanace: 0,
                                                ac_balance: balance,
                                                ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                                ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                            }
                                        });
                                    } catch (error) {
                                        console.log("Error in deposit capture fund! ", error.message);
                                    }
                                }
                            } else {
                                // const new_v_balance = v_balance + updated_balance;
                                //update wallet
                                // console.log(new_v_balance, new_w_balance)
                                await Wallets.updateOne({ _id: wallet._id }, {
                                    $set: {
                                        admin_transfer: updated_balance
                                    }
                                });
                            }
                            // transaction code will not be there

                        }
                    } catch (error) { console.log("BULL Error: ", error) };
                }
                if (walletBTT && walletBTT.wallet_type == 'BTT') {
                    console.log("BTT")
                    let wallet = walletBTT;
                    const decimal = 1e6;
                    const ds = await fetch(`https://api.trongrid.io/v1/accounts/${wallet.wallet_address}`);//TV6MuMXfmLbBqPZvBHdwFsDnQeVfnmiuSi`);//
                    const dt = await ds.json();
                    console.log(dt, "btt", wallet.wallet_address);
                    if (dt && dt['data'] && dt['data'].length > 0 && dt['data'][0]) {
                        let trc10 = dt['data'][0].assetV2 ? dt['data'][0].assetV2 : [];
                        console.log("trc10: ", trc10)
                        if (trc10.length > 0) {
                            const btt_data = trc10.find((data) => data.key == wallet.contract_address);
                            // trc10.forEach(async (contract) => {
                            //     // {
                            //     //     "value": 100000,
                            //     //         "key": "1003578"
                            //     // },
                            console.log("BTT: ", btt_data);
                            if (btt_data && btt_data.key) {
                                // const w = await Wallets.findOne({ _id: walletBTT._id });
                                // if (w) {

                                // perform transaction and updation

                                let trx_token_balance = btt_data.value;
                                if (trx_token_balance > 0) {

                                    console.log("BTT wallet: ", trx_token_balance);
                                    // perform transaction of trx

                                    let balance = trx_token_balance ? trx_token_balance / decimal : 0;

                                    // check for v balance

                                    const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                                    const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                                    //check for admin transfer
                                    const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                                    const balance_without_admin_transfer = balance - admin_transfer;
                                    const updated_balance = balance_without_admin_transfer - v_balance;
                                    const new_v_balance = v_balance + updated_balance;
                                    const new_w_balance = w_balance + updated_balance;
                                    //update wallet
                                    console.log(new_v_balance, new_w_balance)
                                    await Wallets.updateOne({ _id: walletBTT._id }, {
                                        $set: {
                                            balance: new_w_balance,
                                            v_balanace: new_v_balance
                                        }
                                    });
                                    if (updated_balance > 0) {
                                        createDepositHistory(user_id, 'BTT', wallet.wallet_address, updated_balance);
                                    }
                                    console.log("History created")
                                    // transaction code will not be there
                                    const hot_wallet = await HotWallet.findOne({
                                        wallet_type: 'TRX'
                                    })
                                    let trx_balance = await tronWeb.trx.getBalance(wallet.wallet_address);
                                    let actual_trx_balance = trx_balance ? trx_balance / 1e6 : 0;
                                    let tron_txf = 1;
                                    console.log("trx_balance (admin transfer): ", trx_balance);
                                    if (actual_trx_balance <= tron_txf && updated_balance > 0) {
                                        const tradeobj = await tronWeb.transactionBuilder.sendTrx(wallet.wallet_address, (tron_txf * 1e6), hot_wallet.wallet_address);
                                        const signedtxn = await tronWeb.trx.sign(tradeobj, hot_wallet.private_key);
                                        const trxreceipt = await tronWeb.trx.sendRawTransaction(signedtxn);
                                        console.log("trxreceipt (admin transfer): ", trxreceipt);
                                        if (trxreceipt.result) {
                                            // update admin transfer in wallet
                                            var wTRX = await Wallets.find({ user_id: user_id, wallet_type: 'TRX' });
                                            wTRX = walletTRX.find((data) => data.user == user_id);
                                            let new_admin_tx = parseFloat(wTRX.admin_transfer) + tron_txf;
                                            await Wallets.updateOne({ _id: wTRX._id }, {
                                                $set: {
                                                    admin_transfer: new_admin_tx
                                                }
                                            });
                                            await FundTransferHistory.create({
                                                to_user: wallet.user,
                                                from_user: "Admin",
                                                from_address: hot_wallet.wallet_address,
                                                wallet_type: 'TRX',
                                                purpose: "On BTT deposit",
                                                type: 'admin_transfer',
                                                amount: tron_txf,
                                                date: Date.now()
                                            })
                                            try {
                                                // instance
                                                const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                                const btttradeobj = await tronWeb.transactionBuilder.sendToken(admin_wallets.wallet_address, trx_token_balance, wallet.contract_address, wallet.wallet_address);
                                                const bttsignedtxn = await tronWeb.trx.sign(btttradeobj, wallet.private_key);
                                                const bttreceipt = await tronWeb.trx.sendRawTransaction(bttsignedtxn);
                                                if (bttreceipt.result) {
                                                    /**
                                                        update v_balance as 0
                                                        and last capture time and amount
                                                    */
                                                    await Wallets.updateOne({ _id: wallet._id }, {
                                                        $set: {
                                                            v_balanace: 0,
                                                            ac_balance: balance,
                                                            ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                                            ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                                        }
                                                    });
                                                }
                                            } catch (error) {
                                                console.log("Error in deposit capture fund! ", error.message);
                                            }
                                        }
                                    } else {
                                        try {
                                            // instance
                                            const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                            const usdtreceipt = await instance.transfer(
                                                admin_wallets.wallet_address,
                                                trx_token_balance
                                            ).send({
                                                feeLimit: 10000000
                                            }, wallet.private_key);
                                            if (usdtreceipt) {
                                                /**
                                                    update v_balance as 0
                                                    and last capture time and amount
                                                */
                                                await Wallets.updateOne({ _id: wallet._id }, {
                                                    $set: {
                                                        v_balanace: 0,
                                                        ac_balance: balance,
                                                        ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                                        ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                                    }
                                                });
                                            }
                                        } catch (error) {
                                            console.log("Error in deposit capture fund! ", error.message);
                                        }
                                    }
                                }
                                // }
                            }
                            // });
                        }
                    }
                }
                if (walletBNB && walletBNB.wallet_type == 'BNB') {
                    console.log("BNB")
                    let wallet = walletBNB;
                    const decimal = 1e18;
                    const bal = await web3Bnb.eth.getBalance(wallet.wallet_address);
                    let balance = bal ? bal / decimal : 0;
                    if (balance > 0) {
                        /**
                         * check for v balance
                         */
                        const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                        const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                        /**check for admin transfer */
                        const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                        const balance_without_admin_transfer = balance - admin_transfer;
                        const updated_balance = balance_without_admin_transfer - v_balance;
                        const new_v_balance = v_balance + updated_balance;
                        const new_w_balance = w_balance + updated_balance;
                        /**
                         * update user's wallet
                         */
                        await Wallets.updateOne({ _id: walletBNB._id }, {
                            $set: {
                                balance: new_w_balance,
                                v_balanace: new_v_balance
                            }
                        });
                        if (updated_balance > 0) {
                            createDepositHistory(user_id, 'BNB', wallet.wallet_address, updated_balance);
                        }
                        try {
                            // instance
                            const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                            const esgas = await web3Bnb.eth.estimateGas({
                                to: admin_wallets.wallet_address
                            });
                            const gasp = await web3Bnb.eth.getGasPrice()
                            const createTransaction = await web3Bnb.eth.accounts.signTransaction(
                                {
                                    from: wallet.wallet_address,
                                    to: wallet.wallet_address,
                                    value: ((bal) - (esgas * gasp)),
                                    gas: esgas,
                                },
                                wallet.private_key
                            );
                            // Deploy transaction
                            const createReceipt = await web3Bnb.eth.sendSignedTransaction(
                                createTransaction.rawTransaction
                            );
                            if (createReceipt) {
                                /**
                                    update v_balance as 0
                                    and last capture time and amount
                                */
                                await Wallets.updateOne({ _id: wallet._id }, {
                                    $set: {
                                        v_balanace: 0,
                                        ac_balance: balance,
                                        admin_transfer: 0,
                                        ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                        ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                    }
                                });
                            }
                        } catch (error) {
                            console.log("Error in deposit capture fund! ", error.message);
                        }
                    }
                }
                if (walletBTEX && walletBTEX.wallet_type == 'VRX') {
                    console.log("VRX")
                    let wallet = walletBTEX;
                    const contract = new web3Bnb.eth.Contract(dex, wallet.contract_address);
                    const decimal = 8;//await contract.methods.decimals().call();

                    const bal = await contract.methods.balanceOf(wallet.wallet_address).call();
                    let balance = bal ? bal / Number(`1e${decimal}`) : 0;
                    if (balance > 0) {
                        /**
                         * check for v balance
                         */
                        const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                        const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                        /**check for admin transfer */
                        const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                        const balance_without_admin_transfer = balance - admin_transfer;
                        const updated_balance = balance_without_admin_transfer - v_balance;
                        const new_v_balance = v_balance + updated_balance;
                        const new_w_balance = w_balance + updated_balance;
                        /**
                         * update user's wallet
                         */
                        await Wallets.updateOne({ _id: walletBTEX._id }, {
                            $set: {
                                balance: new_w_balance,
                                v_balanace: new_v_balance
                            }
                        });
                        if (updated_balance > 0) {
                            createDepositHistory(user_id, 'VRX', wallet.wallet_address, updated_balance);
                        }
                        const hot_wallet = await HotWallet.findOne({
                            wallet_type: 'BNB'
                        })
                        let bnb_balance = await web3Bnb.eth.getBalance(wallet.wallet_address);;
                        let actual_bnb_balance = bnb_balance ? bnb_balance / 1e18 : 0;
                        let bnb_txf = 0.002;
                        if (actual_bnb_balance <= bnb_txf && updated_balance > 0) {
                            const esgas = await web3Bnb.eth.estimateGas({
                                to: hot_wallet.wallet_address
                            });
                            const gasp = await web3Bnb.eth.getGasPrice()
                            const createTransaction = await web3Bnb.eth.accounts.signTransaction(
                                {
                                    from: hot_wallet.wallet_address,
                                    to: wallet.wallet_address,
                                    value: ((bnb_txf * 1e18) - (esgas * gasp)),
                                    gas: esgas,
                                },
                                hot_wallet.private_key
                            );
                            // Deploy transaction
                            const createReceipt = await web3Bnb.eth.sendSignedTransaction(
                                createTransaction.rawTransaction
                            );
                            if (createReceipt) {
                                // update admin transfer in wallet
                                var wTRX = await Wallets.find({ user_id: user_id, wallet_type: 'BNB' });
                                wTRX = walletTRX.find((data) => data.user == user_id);
                                let new_admin_tx = parseFloat(wTRX.admin_transfer) + tron_txf;
                                await Wallets.updateOne({ _id: wTRX._id }, {
                                    $set: {
                                        admin_transfer: new_admin_tx
                                    }
                                });
                                await FundTransferHistory.create({
                                    to_user: wallet.user,
                                    from_user: "Admin",
                                    from_address: hot_wallet.wallet_address,
                                    wallet_type: 'BNB',
                                    purpose: "On VRX deposit",
                                    type: 'admin_transfer',
                                    amount: bnb_txf,
                                    date: Date.now()
                                })
                                try {
                                    // instance
                                    const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                    const gas = await contract.methods.transfer(admin_wallets.wallet_address, bal).estimateGas({ value: 0, from: wallet.wallet_address });
                                    const receipt = await contract.methods.transfer(admin_wallets.wallet_address, bal).send({ value: 0, from: wallet.wallet_address, gas: gas });
                                    if (receipt) {
                                        /**
                                            update v_balance as 0
                                            and last capture time and amount
                                        */
                                        await Wallets.updateOne({ _id: wallet._id }, {
                                            $set: {
                                                v_balanace: 0,
                                                ac_balance: balance,
                                                ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                                ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                            }
                                        });
                                    }
                                } catch (error) {
                                    console.log("Error in deposit capture fund! ", error.message);
                                }
                            }
                        } else {
                            try {
                                // instance
                                const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                const gas = await contract.methods.transfer(admin_wallets.wallet_address, bal).estimateGas({ value: 0, from: wallet.wallet_address });
                                const receipt = await contract.methods.transfer(admin_wallets.wallet_address, bal).send({ value: 0, from: wallet.wallet_address, gas: gas });
                                if (receipt) {
                                    /**
                                        update v_balance as 0
                                        and last capture time and amount
                                    */
                                    await Wallets.updateOne({ _id: wallet._id }, {
                                        $set: {
                                            v_balanace: 0,
                                            ac_balance: balance,
                                            ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                            ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                        }
                                    });
                                }
                            } catch (error) {
                                console.log("Error in deposit capture fund! ", error.message);
                            }
                        }
                    }
                }
                if (walletBUSD && walletBUSD.wallet_type == 'BUSD') {
                    console.log("BUSD")
                    let wallet = walletBUSD;
                    const contract = new web3Bnb.eth.Contract(dex, wallet.contract_address);
                    const decimal = 18;//await contract.methods.decimals().call();

                    const bal = await contract.methods.balanceOf(wallet.wallet_address).call(); //'0x58f876857a02d6762e0101bb5c46a8c1ed44dc16'
                    console.log("Bal: ", bal)
                    let balance = bal ? bal / Number(`1e${decimal}`) : 0;
                    if (balance > 0) {
                        /**
                         * check for v balance
                         */
                        console.log("Balance: ", balance)
                        const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                        const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                        /**check for admin transfer */
                        const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                        const balance_without_admin_transfer = balance - admin_transfer;
                        const updated_balance = balance_without_admin_transfer - v_balance;
                        if (updated_balance >= 0) {
                            const new_v_balance = v_balance + updated_balance;
                            const new_w_balance = w_balance + updated_balance;
                            /**
                             * update user's wallet
                             */
                            await Wallets.updateOne({ _id: walletBUSD._id }, {
                                $set: {
                                    balance: new_w_balance,
                                    v_balanace: new_v_balance
                                }
                            });
                            if (updated_balance > 0) {
                                createDepositHistory(user_id, 'BUSD', wallet.wallet_address, updated_balance);
                            }
                            const hot_wallet = await HotWallet.findOne({
                                wallet_type: 'BNB'
                            })
                            let bnb_balance = await web3Bnb.eth.getBalance(wallet.wallet_address);;
                            let actual_bnb_balance = bnb_balance ? bnb_balance / 1e18 : 0;
                            let bnb_txf = 0.002;
                            if (actual_bnb_balance <= bnb_txf && updated_balance > 0) {
                                const esgas = await web3Bnb.eth.estimateGas({
                                    to: hot_wallet.wallet_address
                                });
                                const gasp = await web3Bnb.eth.getGasPrice()
                                const createTransaction = await web3Bnb.eth.accounts.signTransaction(
                                    {
                                        from: hot_wallet.wallet_address,
                                        to: wallet.wallet_address,
                                        value: ((bnb_txf * 1e18) - (esgas * gasp)),
                                        gas: esgas,
                                    },
                                    hot_wallet.private_key
                                );
                                // Deploy transaction
                                const createReceipt = await web3Bnb.eth.sendSignedTransaction(
                                    createTransaction.rawTransaction
                                );
                                if (createReceipt) {
                                    // update admin transfer in wallet
                                    var wTRX = await Wallets.find({ user_id: user_id, wallet_type: 'BNB' });
                                    wTRX = walletTRX.find((data) => data.user == user_id);
                                    let new_admin_tx = parseFloat(wTRX.admin_transfer) + tron_txf;
                                    await Wallets.updateOne({ _id: wTRX._id }, {
                                        $set: {
                                            admin_transfer: new_admin_tx
                                        }
                                    });
                                    await FundTransferHistory.create({
                                        to_user: wallet.user,
                                        from_user: "Admin",
                                        from_address: hot_wallet.wallet_address,
                                        wallet_type: 'BNB',
                                        purpose: "On BUSD deposit",
                                        type: 'admin_transfer',
                                        amount: bnb_txf,
                                        date: Date.now()
                                    })
                                    try {
                                        // instance
                                        const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                        const gas = await contract.methods.transfer(admin_wallets.wallet_address, bal).estimateGas({ value: 0, from: wallet.wallet_address });
                                        const receipt = await contract.methods.transfer(admin_wallets.wallet_address, bal).send({ value: 0, from: wallet.wallet_address, gas: gas });
                                        if (receipt) {
                                            /**
                                                update v_balance as 0
                                                and last capture time and amount
                                            */
                                            await Wallets.updateOne({ _id: wallet._id }, {
                                                $set: {
                                                    v_balanace: 0,
                                                    ac_balance: balance,
                                                    ac_last_date: wallet.ac_last_date ? wallet.ac_last_date + "," + Date.now() : "" + Date.now(),
                                                    ac_transfer_last_bal: wallet.ac_transfer_last_update ? wallet.ac_transfer_last_update + "," + balance : "" + balance
                                                }
                                            });
                                        }
                                    } catch (error) {
                                        console.log("Error in deposit capture fund! ", error.message);
                                    }
                                }
                            } else {
                                try {
                                    // instance
                                    const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                                    const gas = await contract.methods.transfer(admin_wallets.wallet_address, bal).estimateGas({ value: 0, from: wallet.wallet_address });
                                    const receipt = await contract.methods.transfer(admin_wallets.wallet_address, bal).send({ value: 0, from: wallet.wallet_address, gas: gas });
                                    if (receipt) {
                                        /**
                                            update v_balance as 0
                                            and last capture time and amount
                                        */
                                    }
                                } catch (error) {
                                    console.log("Error in deposit capture fund! ", error.message);
                                }
                            }
                        } else {
                            await Wallets.updateOne({ _id: walletBUSD._id }, {
                                $set: {
                                    admin_transfer: updated_balance
                                }
                            });
                        }
                    }
                }
                return res.json({
                    status: 200,
                    error: false,
                    message: "Wallets are updated"
                })
            } else {
                return res.json({
                    status: 200,
                    error: false,
                    message: "Wallets are updating..."
                })
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid Request"
            })
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again: ",
            error: error.message
        })
    }
}

function createDepositHistory(user_id, type, address, amount) {
    const DepositHistory = require('../models/deposite_history');
    try {
        console.log(user_id, type, address, amount, (user_id && type && address && amount))
        // if (user_id && type && address && amount) {
        DepositHistory.create({
            user_id: user_id,
            symbol: type,
            status: true,
            amount: amount,
            to_address: address,
            type: "deposit"
        }).then((data) => {
            // console.log("history created", user_id);
        }).catch((error) => {
            // console.log("error: ", error.message);
        })

        // } else {
        //     return false;
        // }
        return true;
    } catch (error) {
        return false;
    }
}

async function canUpdate(user_id) {
    const DepositHistory = require('../models/deposite_history');
    try {
        let last_deposit = await DepositHistory.findOne({ user_id: user_id }).sort({ createdAt: -1 });
        if (last_deposit) {
            let last_created = last_deposit.createdAt ? last_deposit.createdAt : undefined;
            if (last_created) {
                let d = new Date(last_created).getTime();
                if (d) {
                    if (new Date().getTime() - d > 3000) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return true;
                }
            } else {
                return true;
            }
        } else {
            return true;
        }
    } catch (error) {
        console.log("error in canupdate: ", error.message)
        return false;
    }
}

module.exports = {
    updateUserDeposit
}
