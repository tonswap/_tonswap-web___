import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import './App.css';
import * as API from './api';
import {Routes, Route, Link, BrowserRouter, useParams} from "react-router-dom";
import {
    generateAddLiquidityLink,
    generateBuyLink,
    generateClaimRewards,
    generateRemoveLiquidityLink,
    generateSellLink
} from "./api";
import Html5QrcodePlugin from "./Html5QrcodePlugin";

const TonWeb = require('tonweb');

const StoreContext = React.createContext<any>({});

function App() {

    const [token, setToken] = useState<any>({});
    const [srcToken, setSrcToken] = useState<any>({});
    const [destToken, setDestToken] = useState<any>({});
    const [showConnect, setShowConnect] = useState(!localStorage.getItem('address'));

    const timeout = useRef(0);

    const calculateTokens = async (srcAmount: number | null, destAmount: number | null) => {
        if (srcAmount != null) {
            srcToken.amount = srcAmount;
            setSrcToken({...srcToken});
            clearTimeout(timeout.current);
            // @ts-ignore
            timeout.current = setTimeout(async () => {
                API.getTokenDollarValue([srcToken.name], srcAmount).then((dollarValue: number[]) => {
                    srcToken.dollarValue = dollarValue[0];
                    setSrcToken({...srcToken});
                });
                const amount = await API.getAmountsOut(srcToken.name, destToken.name, srcAmount, destAmount);
                destToken.amount = amount;
                setDestToken({...destToken});
                destToken.dollarValue = (await API.getTokenDollarValue([destToken.name], amount!!))[0];
                setDestToken({...destToken});
            }, 500);
        } else if (destAmount != null) {
            destToken.amount = destAmount;
            setDestToken({...destToken});
            clearTimeout(timeout.current);
            // @ts-ignore
            timeout.current = setTimeout(async () => {
                API.getTokenDollarValue([destToken.name], destAmount).then((dollarValue: number[]) => {
                    destToken.dollarValue = dollarValue[0];
                    setDestToken({...destToken});
                });
                const amount = await API.getAmountsOut(srcToken.name, destToken.name, srcAmount, destAmount);
                srcToken.amount = amount;
                setSrcToken({...srcToken});
                srcToken.dollarValue = (await API.getTokenDollarValue([srcToken.name], amount!!))[0];
                setSrcToken({...srcToken});
            }, 500);
        }
    };

    return (
        <StoreContext.Provider
            value={{
                token,
                setToken,
                srcToken,
                setSrcToken,
                destToken,
                setDestToken,
                calculateTokens,
                showConnect,
                setShowConnect
            }}>
            <BrowserRouter>
                <div className="App">
                    <Routes>
                        <Route path="/tonswap-web" element={<Home/>}/>
                        <Route path="/tonswap-web/selectToken" element={<SelectToken/>}/>
                        <Route path="/tonswap-web/buy/:token" element={<BuyToken/>}/>
                        <Route path="/tonswap-web/sell/:token" element={<SellToken/>}/>
                        <Route path="/tonswap-web/addLiquidity/:token" element={<AddLiquidity/>}/>
                        <Route path="/tonswap-web/removeLiquidity/:token" element={<RemoveLiquidity/>}/>
                        <Route path="/tonswap-web/claimRewards/:token" element={<ClaimRewards/>}/>
                    </Routes>
                    <Navigation/>
                </div>
            </BrowserRouter>
        </StoreContext.Provider>
    );
}

function Navigation() {

    const store = useContext(StoreContext);

    return <>
        <div>
            <div>
                <Link to={"/tonswap-web/"}>Home</Link>
            </div>
            {
                !store.showConnect &&
                <div>
                    <Link to={"/tonswap-web/selectToken"}>Select a token</Link>
                </div>
            }
            {
                store.token.name && <>
                    <div>
                        <Link to={`/tonswap-web/buy/${store.token?.name}`}>Buy {store.token?.name}</Link>
                    </div>
                    <div>
                        <Link to={`/tonswap-web/sell/${store.token?.name}`}>Sell {store.token?.name}</Link>
                    </div>
                    <div>
                        <Link to={`/tonswap-web/addLiquidity/${store.token?.name}`}>Add liquidity</Link>
                    </div>
                    <div>
                        <Link to={`/tonswap-web/removeLiquidity/${store.token?.name}`}>Remove liquidity</Link>
                    </div>
                    <div>
                        <Link to={`/tonswap-web/claimRewards/${store.token?.name}`}>Claim rewards</Link>
                    </div>
                </>
            }
        </div>
    </>;
}

function Home() {

    const [showPopup, setShowPopup] = useState(false);
    const store = useContext(StoreContext);
    const {setShowConnect, showConnect} = store;
    const onClick = useCallback(() => {
        setShowPopup(!showPopup);
    }, [showPopup]);

    const onBlur = useCallback((input) => {
        const address = input.nativeEvent.target.value;
        if (TonWeb.utils.Address.isValid(address)) {
            localStorage.setItem('address', address);
            setShowConnect(!input.nativeEvent.target.value);
            setShowPopup(!input.nativeEvent.target.value);
        } else {
            alert('Bad wallet');
        }
    }, [setShowConnect]);

    const onScan = useCallback((result: any) => {
        alert(`Found address ${result}`);
        localStorage.setItem('address', result);
        setShowConnect(false);
        setShowPopup(false);
    }, [setShowConnect]);

    return (
        <>
            <header className="App-header">
                <div>Welcome to Tonswap</div>
                {
                    showConnect && <button onClick={onClick}>Connect</button>
                }
                {
                    showPopup && <>
                        <div style={{width: '500px', height: '500px'}}>
                            <Html5QrcodePlugin
                                // @ts-ignore
                                fps={10}
                                qrbox={450}
                                disableFlip={false}
                                qrCodeSuccessCallback={onScan}/>
                        </div>

                        <input style={{width: '300px'}} onBlur={onBlur}/>
                    </>
                }
                {!store.token && <a href={"/selectToken"}>Select a token</a>}
            </header>
        </>
    );
}

function SelectToken() {
    const tokens: [] = require('./tokens.json');
    const store = useContext(StoreContext);

    const [selectToken, setSelectToken] = useState(store.token);

    const onSelectToken = useCallback((token: string) => {
        setSelectToken(token);
        store.setToken(token);
    }, [store]);

    return (
        <>
            <div style={{display: 'flex', width: '30%', flexWrap: 'wrap'}}>
                {
                    tokens.filter((t: any) => t.name !== "TON").map((t: any, i: number) =>
                        <div key={i}
                             onClick={onSelectToken.bind(null, t)}
                             style={{
                                 width: '100px',
                                 opacity: !selectToken.name || selectToken.name === t.name ? 1 : 0.2,
                                 margin: '4px',
                                 height: '100px',
                                 border: '1px solid black'
                             }}>
                            {t.name}
                        </div>)
                }
            </div>
        </>
    );
}

function BuyToken() {

    const store = useContext(StoreContext);

    const {token} = store;

    const getBalances = useCallback(() => {
        return Promise.all([
            API.getTonBalance(),
            API.getTokenBalance(token.name)
        ]);
    }, [token]);

    return <div>
        <TokensOperation
            getBalances={getBalances}
            srcToken={"ton"}
            destToken={store.token.name}
            title={`Swap Ton to ${store.token?.name}`}
            emoji={"⬇️"}
        />
        <button onClick={generateBuyLink.bind(null, store.token?.name, store.token?.amount)}>
            Buy ${store.token?.name}
        </button>
    </div>
}

function AddLiquidity() {

    const store = useContext(StoreContext);

    return <div>
        <TokensOperation
            getBalances={() => {
                return Promise.all([
                    API.getTonBalance(),
                    API.getTokenBalance(store.token.name)
                ]);
            }}
            srcToken={"ton"}
            destToken={store.token.name}
            title={`Add TON/${store.token?.name} liquidity`}
            emoji={"➕"}
        />
        <button onClick={generateAddLiquidityLink.bind(null, store.token?.name, store.token?.amount)}>
            Add Liquidity
        </button>
    </div>
}

function RemoveLiquidity() {

    const store = useContext(StoreContext);

    return <div>
        <TokensOperation
            getBalances={() => {
                return Promise.all([
                    API.getTonBalance(),
                    API.getTokenBalance(store.token.name)
                ]);
            }}
            srcToken={"ton"}
            destToken={store.token.name}
            title={`Remove TON/${store.token?.name} liquidity`}
            emoji={"➖"}
        />
        <button onClick={generateRemoveLiquidityLink.bind(null, store.token?.name, store.token?.amount)}>
            Remove Liquidity
        </button>
    </div>
}

function SellToken() {

    const store = useContext(StoreContext);

    const {token} = store;

    const getBalances = useCallback(() => {
        return Promise.all([
            API.getTokenBalance(token.name),
            API.getTonBalance()
        ]);
    }, [token]);

    return <div>
        <TokensOperation
            getBalances={getBalances}
            srcToken={store.token.name}
            destToken={"ton"}
            title={`Swap ${store.token?.name} to Ton`}
            emoji={"⬇️"}
        />
        <button onClick={generateSellLink.bind(null, store.token?.name)}>Sell ${store.token?.name}</button>
    </div>
}

function TokensOperation(props: any) {
    const store = useContext(StoreContext);

    let params = useParams();

    useEffect(() => {
        const tokens: [] = require('./tokens.json');
        const token: any = tokens.find((t: any) => t.name === params.token);
        store.setToken(token);
    });

    const {srcToken, destToken, getBalances} = props;
    const {setDestToken, setSrcToken} = store;

    useEffect(() => {
        if (!srcToken || !destToken) return;
        (async () => {
            const [srcTokenBalance, destTokenBalance] = await getBalances();
            setSrcToken({balance: srcTokenBalance, name: srcToken});
            setDestToken({balance: destTokenBalance, name: destToken});
        })();
    }, [srcToken, destToken, getBalances, setDestToken, setSrcToken]);

    const onChangeSrc = (amount: string) => {
        store.calculateTokens(parseFloat(amount || "0"), null);
    };

    const onChangeDest = (amount: string) => {
        store.calculateTokens(null, parseFloat(amount || "0"));
    };

    return (
        <div style={{padding: '10px'}}>
            <div style={{padding: '10px'}}>
                {props.title}
            </div>
            <TokenInput tokenInfo={store.srcToken} onChange={onChangeSrc}/>
            <div style={{padding: '10px'}}>
                {props.emoji}
            </div>
            <TokenInput tokenInfo={store.destToken} onChange={onChangeDest}/>
        </div>
    );
}

function ClaimRewards() {

    const store = useContext(StoreContext);

    let params = useParams();

    useEffect(() => {
        (async () => {
            const tokens: [] = require('./tokens.json');
            const token: any = tokens.find((t: any) => t.name === params.token);
            store.setToken(token);
            const [tokenBalance] = await Promise.all([
                API.getRewards(token.name)
            ]);
            store.setSrcToken({balance: tokenBalance, name: token.name});
        })();
    });

    const onChangeReward = (amount: string) => {
        store.srcToken.amount = amount;
        store.setSrcToken({...store.srcToken});

        if (store.srcToken.name) {
            API.getTokenDollarValue([store.srcToken.name], parseFloat(amount)).then((dollarValue: number[]) => {
                store.srcToken.dollarValue = dollarValue[0];
                store.setSrcToken({...store.srcToken});
            });
        }
    };

    return (
        <div style={{padding: '10px'}}>
            <div style={{padding: '10px'}}>
                Claim rewards {store.token?.name}
            </div>
            <TokenInput tokenInfo={store.srcToken} onChange={onChangeReward}/>
            <button onClick={generateClaimRewards.bind(null, store.token?.name, store.token?.amount)}>
                Claim rewards
            </button>
        </div>
    );
}

function TokenInput(props: any) {

    const onChange = (input: any) => {
        const val = input.target.value;
        props.onChange(val);
    };

    const maxOnClick = () => {
        props.onChange(props.tokenInfo?.balance);
    }

    return (
        <div>
            <div>
                <input value={props.tokenInfo?.amount || ''} onChange={onChange}/>
                <span>{props.tokenInfo?.balance || '?'}</span>
            </div>
            <div style={{padding: '10px', display: 'flex'}}>
                <span style={{flex: 1, textAlign: 'left'}}>~${props.tokenInfo?.dollarValue || 0}</span>
                <button onClick={maxOnClick}>max</button>
            </div>
        </div>
    );
}

export default App;
