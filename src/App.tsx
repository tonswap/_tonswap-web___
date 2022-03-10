import React, {useCallback, useContext, useEffect, useState} from 'react';
import './App.css';
import {Routes, Route, Link, BrowserRouter, useParams} from "react-router-dom";

const StoreContext = React.createContext<any>({});

function App() {

    const [token, setToken] = useState<any>({});
    const [srcToken, setSrcToken] = useState<any>({});
    const [destToken, setDestToken] = useState<any>({});

    const calculateTokens = (srcAmount?: number, destAmount?: number) => {
        if (srcAmount) {
            srcToken.amount = srcAmount;
            // destToken.amount = srcAmount * srcToken.ratio; // TODO:
            destToken.amount = srcAmount * 1.5;
        } else if (destAmount) {
            destToken.amount = destAmount;
            srcToken.amount = destAmount / srcToken.ratio;
        }
        setSrcToken({...srcToken});
        setDestToken({...destToken});
    };

    return (
        <StoreContext.Provider value={{ token, setToken, srcToken, setSrcToken, destToken, setDestToken, calculateTokens }}>
            <BrowserRouter>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<Home/>}/>
                        <Route path="/selectToken" element={<SelectToken/>}/>
                        <Route path="/buy/:token" element={<BuyToken/>}/>
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
            <div>
                <Link to={`/buy/${store.token?.name}`}>Buy {store.token?.name}</Link>
            </div>
            <div>
                <a href={"/selectToken"}>Sell</a>
            </div>
            <div>
                <a href={"/selectToken"}>Add liquidity</a>
            </div>
            <div>
                <a href={"/selectToken"}>Remove liquidity</a>
            </div>
            <div>
                <a href={"/selectToken"}>Claim rewards</a>
            </div>
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
                    tokens.map((t: any, i: number) => <div key={i}
                        onClick={onSelectToken.bind(null, t)}
                        style={{
                            width: '100px',
                            opacity: !selectToken || selectToken === t ? 1 : 0.2,
                            margin: '4px',
                            height: '100px',
                            border: '1px solid black'
                        }}>{t.name}</div>)
                }
            </div>
        </>
    );
}

function BuyToken() {

    const store = useContext(StoreContext);

    let params = useParams();

    useEffect(() => {
        const tokens: [] = require('./tokens.json');
        const token:any = tokens.find((t:any) => t.name === params.token);
        store.setToken(token);
        setTimeout(() => {
            store.setSrcToken({ balance: 20 });
        }, 1000);
        setTimeout(() => {
            store.setDestToken({ balance: 50 });
        }, 1500);
    }, []);

    const onChangeSrc = (amount: string) => {
        store.calculateTokens(parseFloat(amount));
    };

    const onChangeDest = (amount: string) => {
        store.calculateTokens(undefined, parseFloat(amount));
    };

    console.log("store.destToken", store.destToken);

    return (
        <div style={{padding: '10px'}}>
            <div style={{padding: '10px'}}>
                Swap Ton to {store.token?.name}
            </div>
            <TokenInput tokenInfo={store.srcToken} onChange={onChangeSrc}/>
            <div style={{padding: '10px'}}>
                ⬇️
            </div>
            <TokenInput tokenInfo={store.destToken} onChange={onChangeDest}/>
        </div>
    );
}

function TokenInput(props: any) {

    const onChange = (input:any) => {
        const val = input.target.value;
        props.onChange(val);
    };

    console.log("props.tokenInfo?.amount", props.tokenInfo?.amount);

    return (
        <div>
            <div>
                <input defaultValue={props.tokenInfo?.amount} onChange={onChange}/>
                <span>{props.tokenInfo?.balance || '?'}</span>
            </div>
            <div style={{padding: '10px', display: 'flex'}}>
                <span style={{ flex: 1, textAlign: 'left'}}>~${props.tokenInfo?.dollarValue || 0}</span>
                <button>max</button>
            </div>
        </div>
    );
}

export default App;
