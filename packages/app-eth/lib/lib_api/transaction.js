"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
const web3_eth_contract_1 = require("web3-eth-contract");
const lib_common_util_js_1 = require("lib-common-util-js");
const lib_keystore_1 = require("../lib_keystore");
const jsonrpc_1 = require("./jsonrpc");
const constants_1 = require("./constants");
exports.default = config => {
    const { sendSignedTransaction, getTransactionCount, getTransactionReceipt } = jsonrpc_1.default(config);
    function sendNativeTx(account, to, value, gasPrice, gasLimit, data, shouldBroadCast) {
        return new Promise((resolve, reject) => {
            value = bignumber_js_1.default.isBigNumber(value) ? value : bignumber_js_1.default(value);
            getTransactionCount(account.address, 'latest')
                .then(count => {
                const { type, derivationIndex } = account;
                let extra_param = { type };
                if (type === '[ledger]') {
                    extra_param = Object.assign(Object.assign({}, extra_param), { derivationIndex, sender: account.address });
                }
                let tx = {
                    amount: value.shiftedBy(18).toNumber(),
                    nonce: count,
                    gasLimit,
                    gasPrice,
                    to,
                    private_key: account.private_key,
                    extra_param,
                };
                if (data !== undefined) {
                    tx = Object.assign(Object.assign({}, tx), { data });
                }
                lib_keystore_1.default.signTransaction(tx)
                    .then(res => {
                    const { encoded } = res;
                    console.log('encoded keystore tx => ', encoded);
                    if (shouldBroadCast) {
                        sendSignedTransaction(encoded)
                            .then(hash => {
                            const pendingTx = {
                                hash,
                                from: account.address,
                                to,
                                value,
                                status: 'PENDING',
                                gasPrice
                            };
                            resolve({ pendingTx });
                        })
                            .catch(e => {
                            console.log('send signed tx:', e);
                            reject(e);
                        });
                    }
                    else {
                        const txObj = {
                            from: account.address,
                            to,
                            value,
                            gasPrice
                        };
                        resolve({ encoded, txObj });
                    }
                })
                    .catch(e => {
                    console.log('sign error:', e);
                    reject(e);
                });
            })
                .catch(err => {
                console.log('get tx count error:', err);
                reject(err);
            });
        });
    }
    function sendTokenTx(account, symbol, to, value, gasPrice, gasLimit, shouldBroadCast) {
        const { tokens } = account;
        const { contractAddr, tokenDecimal } = tokens[symbol];
        const tokenContract = new web3_eth_contract_1.default(constants_1.ERC20ABI, contractAddr);
        const methodsData = tokenContract.methods
            .transfer(to, value
            .shiftedBy(tokenDecimal - 0)
            .toFixed(0)
            .toString())
            .encodeABI();
        return new Promise((resolve, reject) => {
            sendNativeTx(account, contractAddr, bignumber_js_1.default(0), gasPrice, gasLimit, methodsData, shouldBroadCast)
                .then(res => {
                if (shouldBroadCast) {
                    const { pendingTx } = res;
                    pendingTx.tknTo = to;
                    pendingTx.tknValue = value;
                    resolve({ pendingTx });
                }
                else {
                    resolve(res);
                }
            })
                .catch(err => {
                reject(err);
            });
        });
    }
    function sendTransaction(account, symbol, to, value, data, extraParams, shouldBroadCast = true) {
        const { gasPrice, gasLimit } = extraParams;
        if (account.symbol === symbol) {
            return sendNativeTx(account, to, value, gasPrice, gasLimit, data, shouldBroadCast);
        }
        return sendTokenTx(account, symbol, to, value, gasPrice, gasLimit, shouldBroadCast);
    }
    function getTransactionsByAddress(address, page, size, timestamp) {
        const { explorer_api } = config;
        if (explorer_api.provider === "etherscan") {
            const url = `${explorer_api.url}?module=account&action=txlist&address=${address}&page=${page}&offset=${size}&sort=asc&apikey=${config.etherscanApikey}`;
            console.log(`[eth http req] get transactions by address: ${url}`);
            return new Promise((resolve, reject) => {
                lib_common_util_js_1.HttpClient.get(url, false).then(res => {
                    console.log('[http resp]', res.data);
                    const { result } = res.data;
                    const txs = {};
                    result.forEach(t => {
                        const tx = {};
                        tx.hash = t.hash;
                        tx.timestamp = parseInt(t.timeStamp) * 1000;
                        tx.from = t.from;
                        tx.to = t.to;
                        tx.value = bignumber_js_1.default(t.value, 10).shiftedBy(-18).toNumber();
                        tx.status = t.isError === '0' ? 'CONFIRMED' : 'FAILED';
                        tx.blockNumber = parseInt(t.blockNumber);
                        tx.fee = t.gasPrice * t.gasUsed * Math.pow(10, -18);
                        txs[tx.hash] = tx;
                    });
                    resolve(txs);
                }, err => {
                    console.log('[http resp] err: ', err);
                    reject(err);
                });
            });
        }
        const url = `${explorer_api.url}/getAddressTransactions/${address}?apiKey=${config.ethplorerApiKey}&limit=${size}&timestamp=${timestamp / 1000 - 1}&showZeroValues=true`;
        console.log(`[eth http req] get transactions by address: ${url}`);
        return new Promise((resolve, reject) => {
            lib_common_util_js_1.HttpClient.get(url, false).then(res => {
                console.log('[http resp]', res.data);
                if (res.data.error) {
                    reject(res.data.error);
                }
                else {
                    const txs = {};
                    res.data.forEach(t => {
                        const tx = {};
                        tx.hash = t.hash;
                        tx.timestamp = t.timestamp * 1000;
                        tx.from = t.from;
                        tx.to = t.to;
                        tx.value = bignumber_js_1.default(t.value);
                        tx.status = t.success ? "CONFIRMED" : 'FAILED';
                        txs[tx.hash] = tx;
                    });
                    resolve(txs);
                }
            }, err => {
                console.log('[http resp] err: ', err);
                reject(err);
            });
        });
    }
    function getTransactionUrlInExplorer(txHash) {
        const { explorer } = config;
        if (explorer.provider === "etherscan") {
            return `${explorer.url}/${txHash}`;
        }
        return `${explorer.url}/${txHash}`;
    }
    function getTransactionStatus(txHash) {
        return new Promise((resolve, reject) => {
            getTransactionReceipt(txHash)
                .then(receipt => {
                if (receipt !== null) {
                    resolve({
                        status: parseInt(receipt.status, 16) === 1,
                        blockNumber: parseInt(receipt.blockNumber, 16),
                        gasUsed: parseInt(receipt.gasUsed, 16),
                    });
                }
                else {
                    resolve(null);
                }
            })
                .catch(err => {
                reject(err);
            });
        });
    }
    return {
        sendTransaction,
        getTransactionsByAddress,
        getTransactionUrlInExplorer,
        getTransactionStatus
    };
};
//# sourceMappingURL=transaction.js.map