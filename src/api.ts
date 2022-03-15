const supportedTokens: any[] = require('./tokens.json');

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
    const [tonDollarValue, tokenDollarValue] = await getTokenDollarValue(["ton", token], 1);
    const ratio = tokenDollarValue / tonDollarValue;
    if (srcToken === "ton") {
        if (srcAmount != null) {
            return parseFloat((srcAmount * ratio).toPrecision(4));
        } else if (destAmount != null) {
            return parseFloat((destAmount / ratio).toPrecision(4));
        }
    } else {
        if (srcAmount != null) {
            return parseFloat((srcAmount / ratio).toPrecision(4));
        } else if (destAmount != null) {
            return parseFloat((destAmount * ratio).toPrecision(4));
        }
    }
}

export const getTokenDollarValue = async (tokens: string[], amount: number):Promise<number[]> => {
    tokens = tokens.map(t => t.toLowerCase());
    const tokenObjects = (supportedTokens.filter((t: any) => tokens.indexOf(t.name.toLowerCase()) !== -1));
    const coinsResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenObjects.map(t => t.coinGeckoId).join(",")}&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false`);
    const result = await coinsResponse.json();
    return tokenObjects.map(t => parseFloat((parseFloat(result[t.coinGeckoId].usd) * amount).toPrecision(4)));
}

export const getRewards = async (token: string) => {
    return new Promise((resolve) => {
        setTimeout(resolve.bind(null, (Math.random() * 50).toPrecision(4)), Math.random() * 1500);
    });
}

export const generateSellLink = (token: string) => {
    return "https://google.com"
}

export const generateBuyLink = (token: string) => {
    return "https://google.com"
}

export const generateAddLiquidityLink = (token: string, amount: number) => {
    return "https://google.com"
}

export const generateRemoveLiquidityLink = (token: string, amount: number) => {
    return "https://google.com"
}

export const generateClaimRewards = (token: string, amount: number) => {
    return "https://google.com"
}
