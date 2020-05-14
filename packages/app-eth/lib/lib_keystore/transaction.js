"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const makkii_utils_1 = require("@makkii/makkii-utils");
const bignumber_js_1 = require("bignumber.js");
const EthereumTx = require("ethereumjs-tx");
const KEY_MAP = ["value", "nonce", "gasLimit", "gasPrice", "to"];
exports.process_unsignedTx = transaction => {
    const { network, value: amount, nonce, gasLimit, gasPrice, to, data } = transaction;
    KEY_MAP.forEach(k => {
        if (!transaction.hasOwnProperty(k)) {
            throw new Error(`${k} not found`);
        }
    });
    let txParams = {
        nonce: makkii_utils_1.hexutil.toHex(nonce),
        gasPrice: makkii_utils_1.hexutil.toHex(new bignumber_js_1.default(gasPrice)),
        gasLimit: makkii_utils_1.hexutil.toHex(new bignumber_js_1.default(gasLimit)),
        to: makkii_utils_1.hexutil.toHex(to),
        value: makkii_utils_1.hexutil.toHex(new bignumber_js_1.default(amount).shiftedBy(18)),
        chainId: getChainId(network),
        v: getChainId(network),
        r: "0x00",
        s: "0x00"
    };
    if (data) {
        txParams = Object.assign(Object.assign({}, txParams), { data });
    }
    const tx = new EthereumTx(txParams);
    return tx;
};
const getChainId = network => {
    if (network.toLowerCase() === "morden") {
        return 2;
    }
    if (network.toLowerCase() === "ropsten") {
        return 3;
    }
    if (network.toLowerCase() === "rinkeby") {
        return 4;
    }
    if (network.toLowerCase() === "goerli") {
        return 5;
    }
    if (network.toLowerCase() === "kovan") {
        return 42;
    }
    return 1;
};
//# sourceMappingURL=transaction.js.map