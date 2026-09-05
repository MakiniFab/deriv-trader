import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDerivWS } from '../context/WebSocketContext';
import { analyzeMarket } from '../services/analyzer';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { ticks, activeSymbols, subscribeToTick, executeTrade } = useDerivWS();
  const [selectedSymbol, setSelectedSymbol] = useState('R_100');
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('active_account');
    if (!saved) {
      navigate('/');
      return;
    }
    setAccount(JSON.parse(saved));
  }, [navigate]);

  useEffect(() => {
    if (selectedSymbol) {
      subscribeToTick(selectedSymbol);
    }
  }, [selectedSymbol, subscribeToTick]);

  // Automated Execution Engine
  useEffect(() => {
    if (!isAutoTrading || !ticks[selectedSymbol]) return;

    const prices = ticks[selectedSymbol].prices || [];
    const analysis = analyzeMarket(prices);

    if (analysis.signal !== 'NEUTRAL') {
      addLog(`Signal detected: ${analysis.signal}. Placing trade...`);
      
      executeTrade({
        amount: 10,
        duration: 5,
        contractType: analysis.signal,
        symbol: selectedSymbol,
        currency: account?.currency || 'USD'
      })
        .then((res) => addLog(`SUCCESS: Contract ID ${res.contract_id}`))
        .catch((err) => addLog(`ERROR: ${err.message}`));
    }
  }, [ticks, isAutoTrading]);

  const addLog = (msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleManualTrade = (type) => {
    addLog(`Manual order triggered: ${type}`);
    executeTrade({
      amount: 10,
      duration: 5,
      contractType: type,
      symbol: selectedSymbol,
      currency: account?.currency || 'USD'
    })
      .then((res) => addLog(`SUCCESS: Contract ID ${res.contract_id}`))
      .catch((err) => addLog(`ERROR: ${err.message}`));
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Deriv Auto-Trader & Analysis Terminal</h2>
      {account && <p>Connected Account: <strong>{account.account}</strong> ({account.currency})</p>}

      <div style={{ marginBottom: '20px' }}>
        <label>Select Market: </label>
        <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
          {activeSymbols.map((s) => (
            <option key={s.symbol} value={s.symbol}>{s.display_name}</option>
          ))}
        </select>
      </div>

      <div style={{ padding: '15px', background: '#eef2f5', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>Live Price ({selectedSymbol}): {ticks[selectedSymbol]?.current || 'Connecting...'}</h3>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => handleManualTrade('CALL')}
          style={{ flex: 1, padding: '12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Buy Rise (CALL)
        </button>
        <button 
          onClick={() => handleManualTrade('PUT')}
          style={{ flex: 1, padding: '12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Buy Fall (PUT)
        </button>
      </div>

      <button 
        onClick={() => setIsAutoTrading(!isAutoTrading)}
        style={{
          width: '100%', padding: '15px', fontWeight: 'bold', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
          backgroundColor: isAutoTrading ? '#f44336' : '#2196f3'
        }}
      >
        {isAutoTrading ? 'STOP AUTO-TRADING' : 'START AUTO-TRADING'}
      </button>

      <h3>Execution Logs</h3>
      <div style={{ background: '#111', color: '#0f0', padding: '15px', borderRadius: '5px', height: '200px', overflowY: 'auto', fontFamily: 'monospace' }}>
        {logs.length === 0 ? <div>System ready...</div> : logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    </div>
  );
};