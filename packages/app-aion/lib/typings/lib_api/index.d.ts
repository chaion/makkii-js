import { validateBalanceSufficiency, sameAddress } from './tools';
declare const _default: (config: any) => {
    validateBalanceSufficiency: typeof validateBalanceSufficiency;
    getBlockByNumber: (blockNumber: any, fullTxs?: boolean) => Promise<any>;
    getBalance: (address: any) => Promise<import("bignumber.js").default>;
    blockNumber: () => Promise<any>;
    sameAddress: typeof sameAddress;
    buildTransaction: (from: any, to: any, value: any, options: any) => Promise<{
        to: any;
        from: any;
        nonce: any;
        value: import("bignumber.js").default;
        gasPrice: any;
        gasLimit: any;
        timestamp: number;
        data: any;
        type: number;
        tknTo: any;
        tknValue: import("bignumber.js").default;
    }>;
    sendTransaction: (unsignedTx: any, signer: any, signerParams: any) => Promise<{
        hash: any;
        status: string;
        to: any;
        from: any;
        value: any;
        tknTo: any;
        tknValue: any;
        timestamp: any;
        gasLimit: any;
        gasPrice: any;
    }>;
    getTransactionsByAddress: (address: any, page?: number, size?: number) => Promise<unknown>;
    getTransactionUrlInExplorer: (txHash: any) => string;
    getTransactionStatus: (txHash: any) => Promise<unknown>;
    getAccountTokens: (address: any) => Promise<unknown>;
    getAccountTokenBalance: (contractAddress: any, address: any) => Promise<unknown>;
    getAccountTokenTransferHistory: (address: any, symbolAddress: any, page?: number, size?: number) => Promise<unknown>;
    getTokenDetail: (contractAddress: any) => Promise<unknown>;
    getTopTokens: (topN?: number) => Promise<unknown>;
    searchTokens: (keyword: any) => Promise<unknown>;
};
export default _default;
