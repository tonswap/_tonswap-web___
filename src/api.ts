const sleep = (milliseconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export const getTokenBalance = async (token: string) => {
    return new Promise((resolve) => {
        setTimeout(resolve.bind(null, (Math.random() * 50).toPrecision(4)), Math.random() * 1500);
    });
}

export const getTonBalance = async () => {
    return new Promise((resolve) => {
        setTimeout(resolve.bind(null, (Math.random() * 200).toPrecision(4)), Math.random() * 1500);
    });
}

export const getAmountsOut = async (srcToken: string, destToken: string, srcAmount: number | null, destAmount: number | null) => {
    // Right now only support ton + token
    const token = srcToken === "ton" ? destToken : srcToken;

    await sleep(500);
    const tokens: any[] = require('./tokens.json');
    const ratio = (tokens.find((t: any) => t.name === token))?.ratio || 1;

    if (srcAmount != null) {
        return parseFloat((srcAmount * ratio).toPrecision(4));
    } else if (destAmount != null) {
        return parseFloat((destAmount / ratio).toPrecision(4));
    }
}

export const getTokenDollarValue = async (token: string, amount: number) => {
    await sleep(500);
    let dollarRatio: any;
    if (token === "ton") {
        dollarRatio = 1.85;
    } else {
        const tokens: any[] = require('./tokens.json');
        dollarRatio = (tokens.find((t: any) => t.name === token))?.dollar || 1;
    }
    return parseFloat((amount * dollarRatio).toPrecision(4));
}

export const getRewards = async (token: string) => {

}
