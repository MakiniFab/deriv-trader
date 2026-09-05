import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ticks, setTicks] = useState({});
  const [activeSymbols, setActiveSymbols] = useState([]);
  
  const APP_ID = import.meta.env.VITE_DERIV_APP_ID || '1089';

  useEffect(() => {
    ws.current = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

    ws.current.onopen = () => {
      setIsConnected(true);
      ws.current.send(JSON.stringify({ active_symbols: 'brief', product_type: 'basic' }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.msg_type === 'tick') {
        const symbol = data.tick.symbol;
        const quote = data.tick.quote;

        setTicks((prev) => {
          const currentPrices = prev[symbol]?.prices || [];
          const updatedPrices = [...currentPrices.slice(-20), quote]; // Keep last 20 ticks
          return {
            ...prev,
            [symbol]: { current: quote, prices: updatedPrices }
          };
        });
      }

      if (data.msg_type === 'active_symbols') {
        setActiveSymbols(data.active_symbols);
      }
    };

    ws.current.onclose = () => setIsConnected(false);
    return () => ws.current?.close();
  }, [APP_ID]);

  const authorize = (token) => {
    return new Promise((resolve, reject) => {
      const handler = (event) => {
        const res = JSON.parse(event.data);
        if (res.msg_type === 'authorize') {
          ws.current.removeEventListener('message', handler);
          res.error ? reject(res.error) : resolve(res.authorize);
        }
      };
      ws.current.addEventListener('message', handler);
      ws.current.send(JSON.stringify({ authorize: token }));
    });
  };

  const subscribeToTick = (symbol) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    }
  };

  const executeTrade = (params) => {
    return new Promise((resolve, reject) => {
      const handler = (event) => {
        const res = JSON.parse(event.data);
        if (res.msg_type === 'buy') {
          ws.current.removeEventListener('message', handler);
          res.error ? reject(res.error) : resolve(res.buy);
        }
      };
      ws.current.addEventListener('message', handler);

      ws.current.send(
        JSON.stringify({
          buy: 1,
          price: params.amount,
          parameters: {
            amount: params.amount,
            basis: 'stake',
            contract_type: params.contractType,
            currency: params.currency || 'USD',
            duration: params.duration || 5,
            duration_unit: 't',
            symbol: params.symbol,
          },
        })
      );
    });
  };

  return (
    <WebSocketContext.Provider
      value={{ isConnected, authorize, subscribeToTick, ticks, activeSymbols, executeTrade }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useDerivWS = () => useContext(WebSocketContext);