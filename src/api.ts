import {Address, Cell, TonClient} from "ton";
import TonWeb from "tonweb";
import {base64StrToCell, cellToString, stripBoc} from "./utils";
import {DexActions} from "./DexActions";

const BN = require("bn.js");

const supportedTokens: any[] = require('./tokens.json');

const client = new TonClient({
    endpoint: 'https://scalable-api.tonwhales.com/jsonRPC'
});

const tonweb = new TonWeb(new TonWeb.HttpProvider('https://scalable-api.tonwhales.com/jsonRPC'));

export const getTokenBalance = async (token: string) => {
    const tokenObjects: any = (supportedTokens.find((t: any) => t.name === token));
    return _getTokenBalance(tokenObjects.address);
}

export const getLPTokenBalance = async () => {
    // TODO: AMM Address from tokens.json
    return _getTokenBalance("EQCSOxDQI94b0vGCN2Lc3DPan8v3P_JRt-z4PJ9Af2_BPHx5");
}

export const getTokensOfLPBalances = async () => {
    const [data, lpBalance] = await Promise.all([
        getData(),
        getLPTokenBalance()
    ]);

    const totalLPs = parseFloat((new BN(BigInt(data.totalSupply).toString()).toNumber() / 1e9).toFixed(2));
    const ratio = lpBalance / totalLPs;

    return [
        parseFloat((new BN(BigInt(data.tonReserves).toString()).toNumber() / 1e9 * ratio).toFixed(2)),
        parseFloat((new BN(BigInt(data.tokenReserves).toString()).toNumber() / 1e9 * ratio).toFixed(2))
    ];
}

// TODO: Remove later
(window as any).getLPTokenBalance = getLPTokenBalance;
(window as any).getData = getData;

const _getTokenBalance = async (tokenAddress: string) => {
    const owner = Address.parse(localStorage.getItem('address') as string);
    let wc = owner.workChain;
    let address = new BN(owner.hash);
    const res = await tonweb.call(tokenAddress, 'ibalance_of', [
        ['num', wc.toString(10)],
        ['num', address.toString(10)]
    ]);

    console.log(new BN(BigInt(res.stack[0][1]).toString()).toString());

    return parseFloat((new BN(BigInt(res.stack[0][1]).toString()).toNumber() / 1e9).toFixed(2));
}

export const getTonBalance = async () => {
    const balance = await tonweb.getBalance(localStorage.getItem('address') as string);
    return parseFloat((new BN(balance).toNumber() / 1e9).toFixed(2));
}

// TODO: Get amount in

export const getAmountsOut = async (srcToken: string, destToken: string, srcAmount: number | null, destAmount: number | null) => {

    let res;

    if (srcAmount != null) {
        const amountIn = srcAmount * 1e9;
        const isTokenSource = srcToken !== "ton"; // && srcAmount != null || destToken === "ton" && destAmount != null;
        // TODO: AMM Address from tokens.json
        res = await tonweb.call("EQCSOxDQI94b0vGCN2Lc3DPan8v3P_JRt-z4PJ9Af2_BPHx5", 'get_amount_out_lp', [
            ['num', amountIn.toString(10)],
            ['num', isTokenSource ? '1' : '0'],
        ]);
    } else if (destAmount != null) {
        const amountIn = (destAmount || 0) * 1e9;
        const isTokenSource = srcToken !== "ton"; // && srcAmount != null || destToken === "ton" && destAmount != null;
        // TODO: AMM Address from tokens.json
        res = await tonweb.call("EQCSOxDQI94b0vGCN2Lc3DPan8v3P_JRt-z4PJ9Af2_BPHx5", 'get_amount_in_lp', [
            ['num', amountIn.toString(10)],
            ['num', isTokenSource ? '1' : '0'],
        ]);
    }

    if (res.stack[0][1].indexOf("-") === 0) {
        const data = await getData();
        if (srcToken === "ton") {
            return parseFloat((new BN(BigInt(data.tonReserves).toString()).toNumber() / 1e9).toFixed(2));
        } else {
            return parseFloat((new BN(BigInt(data.tokenReserves).toString()).toNumber() / 1e9).toFixed(2));
        }
    } else {
        return (new BN(BigInt(res.stack[0][1]).toString()).toNumber() / 1e9);
    }
}

async function getData() {
    // TODO: AMM Address from tokens.json
    const res = await client.callGetMethod(Address.parse('EQCSOxDQI94b0vGCN2Lc3DPan8v3P_JRt-z4PJ9Af2_BPHx5'), 'get_token_data', []);
    const cellName = base64StrToCell(res.stack[0][1].bytes)
    const name = cellToString(cellName[0]);
    const cSymbol = base64StrToCell(res.stack[1][1].bytes)
    const symbol = cellToString(cSymbol[0]);
    const decimals = res.stack[2][1];
    const totalSupply = res.stack[3][1];
    const tokenReserves = res.stack[4][1];
    const tonReserves = res.stack[5][1];
    const initialized = res.stack[7][1];

    return {
        name,
        symbol,
        decimals,
        totalSupply,
        tokenReserves,
        tonReserves,
        initialized
    }
}

export const getLiquidityAmount = async (srcToken: string, destToken: string, srcAmount: number | null, destAmount: number | null): Promise<number> => {
    const lpTokenData = await getData();

    const tokenReserves = new BN(BigInt(lpTokenData.tokenReserves));
    const tonReserves = new BN(BigInt(lpTokenData.tonReserves));

    const ratio = tonReserves.mul(new BN(1e9)).div(tokenReserves).toString() / 1e9;

    if (srcToken === "ton") {
        if (srcAmount != null) {
            return srcAmount / ratio;
        } else if (destAmount != null) {
            return destAmount * ratio;
        }
    } else {
        if (srcAmount != null) {
            return srcAmount * ratio;
        } else if (destAmount != null) {
            return destAmount / ratio;
        }
    }
    return 0;
}
export const getTokenDollarValue = async (token: string, amount: number): Promise<number> => {
    let ratio = 1;

    if (token !== "ton") {
        const lpTokenData = await getData();

        const tokenReserves = new BN(BigInt(lpTokenData.tokenReserves));
        const tonReserves = new BN(BigInt(lpTokenData.tonReserves));

        ratio = tonReserves.mul(new BN(1e9)).div(tokenReserves).toString() / 1e9;
    }

    const coinsResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false`);
    const result = await coinsResponse.json();
    const tonPriceWithAmount = parseFloat((parseFloat(result['the-open-network'].usd) * amount).toPrecision(4));

    return tonPriceWithAmount * ratio;
}

export const getRewards = async (token: string) => {
    // TODO: move localStorage.getItem('address') to store?
    const owner = Address.parse(localStorage.getItem('address') as string);
    let wc = owner.workChain;
    let address = new BN(owner.hash);
    // TODO: AMM Address from tokens.json
    const res = await tonweb.call("EQCSOxDQI94b0vGCN2Lc3DPan8v3P_JRt-z4PJ9Af2_BPHx5",'get_rewards_of', [
        [ 'num', wc.toString(10) ],
        [ 'num', address.toString(10)]
    ]);
    console.log(res.stack[0][1]);
    console.log(new BN(BigInt(res.stack[0][1]).toString()).toNumber() / 1e9);

    // TODO: Change all toFixed and do it only in UI
    return parseFloat((new BN(BigInt(res.stack[0][1]).toString()).toNumber() / 1e9).toFixed(8));
}

export const generateSellLink = async (token: string, tokenAmount: number) => {
    const tokenObjects: any = (supportedTokens.find((t: any) => t.name === token));

    // TODO: AMM Address from tokens.json
    let transfer = await DexActions.transferAndSwapOut(
        Address.parse("EQCSOxDQI94b0vGCN2Lc3DPan8v3P_JRt-z4PJ9Af2_BPHx5"),
        new BN(tokenAmount * 1e9),
        new BN(2)
    );
    const transferStr = transfer.toString();
    const bocT = stripBoc(transferStr);
    const deeplinkTransfer = `ton://transfer/${tokenObjects.address}?amount=${0.2 * 1e9}&text=${bocT}`;

    console.log(deeplinkTransfer);
    return window.open(deeplinkTransfer);
}

export const generateBuyLink = async (token: string, tonAmount: number, tokenAmount: number) => {
    // 0.5% slippage
    const minAmount = tokenAmount * 0.995 * 1e9;
    let transfer = await DexActions.swapIn(new BN(minAmount))
    const transferStr = transfer.toString();
    const bocT = stripBoc(transferStr);
    // TODO: AMM Address from tokens.json
    const deeplinkTransfer = `ton://transfer/EQCSOxDQI94b0vGCN2Lc3DPan8v3P_JRt-z4PJ9Af2_BPHx5?amount=${tonAmount * 1e9}&text=${bocT}`;

    console.log(deeplinkTransfer);
    return window.open(deeplinkTransfer);
}

export const generateAddLiquidityLink = async (token: string, tonAmount: number | string, tokenAmount: number) => {

    const tokenObjects: any = (supportedTokens.find((t: any) => t.name === token));

    // TODO: AMM Address from tokens.json
    const transferAndLiq = await DexActions.transferAndAddLiquidity(
        Address.parse("EQCSOxDQI94b0vGCN2Lc3DPan8v3P_JRt-z4PJ9Af2_BPHx5"), new BN(tokenAmount * 1e9), 10
    )
    const boc = stripBoc(transferAndLiq.toString());
    const deeplink = `ton://transfer/${tokenObjects.address}?amount=${(parseFloat(tonAmount + "") + 0.2) * 1e9}&text=${boc}`;

    console.log(deeplink);
    return window.open(deeplink);
}

export const generateRemoveLiquidityLink = async (token: string, tonAmount: number | string) => {

    const data = await getData();
    const ratio = parseFloat((parseFloat(tonAmount.toString()) / (new BN(BigInt(data.tonReserves).toString()).toNumber() / 1e9)).toFixed(2));
    const totalLPs = parseFloat((new BN(BigInt(data.totalSupply).toString()).toNumber() / 1e9).toFixed(2));

    const transferAndLiq = await DexActions.removeLiquidity(
        new BN(totalLPs * ratio * 1e9)
    )

    const boc = stripBoc(transferAndLiq.toString());
    // TODO: AMM Address from tokens.json
    const deeplink = `ton://transfer/EQCSOxDQI94b0vGCN2Lc3DPan8v3P_JRt-z4PJ9Af2_BPHx5?amount=${0.2 * 1e9}&text=${boc}`;

    console.log(deeplink);
    return window.open(deeplink);

}

export const generateClaimRewards = async () => {

    const claimRewards = await DexActions.claimRewards();
    const boc = stripBoc(claimRewards.toString());
    // TODO: AMM Address from tokens.json
    const deeplink = `ton://transfer/EQCSOxDQI94b0vGCN2Lc3DPan8v3P_JRt-z4PJ9Af2_BPHx5?amount=${0.2 * 1e9}&text=${boc}`;

    console.log(deeplink);
    return window.open(deeplink);

}
