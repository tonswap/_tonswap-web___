import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import './App.css';
import * as API from './api';
import {Routes, Route, Link, BrowserRouter, useParams} from "react-router-dom";

const StoreContext = React.createContext<any>({});

function App() {

    const [token, setToken] = useState<any>({});
    const [srcToken, setSrcToken] = useState<any>({});
    const [destToken, setDestToken] = useState<any>({});

    const timeout = useRef(0);

    const calculateTokens = async (srcAmount: number | null, destAmount: number | null) => {
        if (srcAmount != null) {
            srcToken.amount = srcAmount;
            setSrcToken({...srcToken});
            API.getTokenDollarValue(srcToken.name, srcAmount).then((dollarValue: number) => {
                srcToken.dollarValue = dollarValue;
                setSrcToken({...srcToken});
            });
            clearTimeout(timeout.current);
            // @ts-ignore
            timeout.current = setTimeout(async () => {
                const amount = await API.getAmountsOut(srcToken.name, destToken.name, srcAmount, destAmount);
                destToken.amount = amount;
                setDestToken({...destToken});
                destToken.dollarValue = await API.getTokenDollarValue(destToken.name, amount!!);
                setDestToken({...destToken});
            }, 500);
        } else if (destAmount != null) {
            destToken.amount = destAmount;
            setDestToken({...destToken});
            API.getTokenDollarValue(destToken.name, destAmount).then((dollarValue: number) => {
                destToken.dollarValue = dollarValue;
                setDestToken({...destToken});
            });
            clearTimeout(timeout.current);
            // @ts-ignore
            timeout.current = setTimeout(async () => {
                const amount = await API.getAmountsOut(srcToken.name, destToken.name, srcAmount, destAmount);
                srcToken.amount = amount;
                setSrcToken({...srcToken});
                srcToken.dollarValue = await API.getTokenDollarValue(srcToken.name, amount!!);
                setSrcToken({...srcToken});
            }, 500);
        }
    };

    return (
        <StoreContext.Provider
            value={{token, setToken, srcToken, setSrcToken, destToken, setDestToken, calculateTokens}}>
            <BrowserRouter>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<Home/>}/>
                        <Route path="/selectToken" element={<SelectToken/>}/>
                        <Route path="/buy/:token" element={<BuyToken/>}/>
                        <Route path="/sell/:token" element={<SellToken/>}/>
                        <Route path="/addLiquidity/:token" element={<AddLiquidity/>}/>
                        <Route path="/removeLiquidity/:token" element={<RemoveLiquidity/>}/>
                        <Route path="/claimRewards/:token" element={<ClaimRewards/>}/>
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
                <Link to={"/"}>Home</Link>
            </div>
            <div>
                <Link to={"/selectToken"}>Select a token</Link>
            </div>
            {
                store.token.name && <>
                    <div>
                        <Link to={`/buy/${store.token?.name}`}>Buy {store.token?.name}</Link>
                    </div>
                    <div>
                        <a href={`/sell/${store.token?.name}`}>Sell {store.token?.name}</a>
                    </div>
                    <div>
                        <a href={`/addLiquidity/${store.token?.name}`}>Add liquidity</a>
                    </div>
                    <div>
                        <a href={`/removeLiquidity/${store.token?.name}`}>Remove liquidity</a>
                    </div>
                    <div>
                        <a href={`/claimRewards/${store.token?.name}`}>Claim rewards</a>
                    </div>
                </>
            }
        </div>
    </>;
}

function Home() {

    const [showPopup, setShowPopup] = useState(false);
    const [showConnect, setShowConnect] = useState(!localStorage.getItem('address'));
    const store = useContext(StoreContext);

    const onClick = useCallback(() => {
        setShowPopup(!showPopup);
    }, [showPopup]);

    const onBlur = useCallback((input) => {
        localStorage.setItem('address', input.nativeEvent.target.value);
        setShowConnect(!input.nativeEvent.target.value);
        setShowPopup(!input.nativeEvent.target.value);
    }, []);

    return (
        <>
            <header className="App-header">
                <div>Welcome to Tonswap</div>
                {
                    showConnect && <button onClick={onClick}>Connect</button>
                }
                {
                    showPopup && <><input onBlur={onBlur}/></>
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
                    tokens.map((t: any, i: number) =>
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

    return <TokensOperation
        getBalances={() => {
            return Promise.all([
                API.getTonBalance(),
                API.getTokenBalance(store.token.name)
            ]);
        }}
        srcToken={"ton"}
        destToken={store.token.name}
        title={`Swap Ton to ${store.token?.name}`}
        emoji={"⬇️"}
    />
}

function AddLiquidity() {

    const store = useContext(StoreContext);

    return <TokensOperation
        getBalances={() => {
            return Promise.all([
                API.getTonBalance(),
                API.getTokenBalance(store.token.name)
            ]);
        }}
        srcToken={"ton"}
        destToken={store.token.name}
        title={`Add ${store.token?.name}/TON liquidity`}
        emoji={"➕"}
    />
}

function RemoveLiquidity() {

    const store = useContext(StoreContext);

    return <TokensOperation
        getBalances={() => {
            return Promise.all([
                API.getTonBalance(),
                API.getTokenBalance(store.token.name)
            ]);
        }}
        srcToken={"ton"}
        destToken={store.token.name}
        title={`Remove ${store.token?.name}/TON liquidity`}
        emoji={"➖"}
    />
}

function SellToken() {

    const store = useContext(StoreContext);

    return <TokensOperation
        getBalances={() => {
            return Promise.all([
                API.getTokenBalance(store.token.name),
                API.getTonBalance()
            ]);
        }}
        srcToken={store.token.name}
        destToken={"ton"}
        title={`Swap ${store.token?.name} to Ton`}
        emoji={"⬇️"}
    />
}

function TokensOperation(props: any) {
    const store = useContext(StoreContext);

    let params = useParams();

    useEffect(() => {
        const tokens: [] = require('./tokens.json');
        const token: any = tokens.find((t: any) => t.name === params.token);
        store.setToken(token);
    });

    useEffect(() => {
        if (!props.srcToken || !props.destToken) return;
        (async () => {
            const [srcTokenBalance, destTokenBalance] = await props.getBalances();
            store.setSrcToken({balance: srcTokenBalance, name: props.srcToken});
            store.setDestToken({balance: destTokenBalance, name: props.destToken});
        })();
    }, [props.srcToken, props.destToken])

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
                API.getTokenBalance(token.name)
            ]);
            store.setSrcToken({balance: tokenBalance, name: token.name});
        })();
    }, []);

    const onChangeReward = (amount: string) => {
        API.getTokenDollarValue(store.srcToken.name, parseFloat(amount)).then((dollarValue: number) => {
            store.srcToken.dollarValue = dollarValue;
            store.setSrcToken({...store.srcToken});
        });
        store.calculateTokens(parseFloat(amount || "0"), null);
    };

    return (
        <div style={{padding: '10px'}}>
            <div style={{padding: '10px'}}>
                Claim rewards {store.token?.name}
            </div>
            <TokenInput tokenInfo={store.srcToken} onChange={onChangeReward}/>
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
