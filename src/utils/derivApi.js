// src/utils/derivApi.js
const APP_ID = '34jtvKMAMvumIpF2SDF0D';

const WS_ENDPOINTS = [
  `wss://ws.deriv.com/websockets/v3?app_id=${APP_ID}`,
  `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`,
  `wss://blue.derivws.com/websockets/v3?app_id=${APP_ID}`
];

/**
 * Fetch options trading accounts via REST API
 */
export async function fetchUserAccounts(token) {
  const response = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
    method: 'GET',
    headers: {
      'Deriv-App-ID': APP_ID,
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve account details.');
  }

  return data.accounts || data.data || [];
}

/**
 * Subscribe to balance updates via WebSocket with automatic HTTPS REST Polling fallback
 */
export function subscribeToBalance(token, onBalanceUpdate, onError) {
  let ws = null;
  let pollingInterval = null;
  let urlIndex = 0;
  let isConnected = false;

  // 1. Attempt WebSocket Connection
  function connectWebSocket() {
    if (urlIndex >= WS_ENDPOINTS.length) {
      console.warn('WebSockets blocked by environment. Falling back to HTTPS REST polling...');
      startHttpPolling();
      return;
    }

    try {
      ws = new WebSocket(WS_ENDPOINTS[urlIndex]);
    } catch (e) {
      urlIndex++;
      connectWebSocket();
      return;
    }

    // Set a connection timeout to avoid hanging if socket drops quietly
    const timeout = setTimeout(() => {
      if (!isConnected) {
        if (ws) ws.close();
        urlIndex++;
        connectWebSocket();
      }
    }, 3000);

    ws.onopen = () => {
      clearTimeout(timeout);
      isConnected = true;
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);

        if (response.error) {
          if (onError) onError(response.error.message);
          return;
        }

        if (response.msg_type === 'authorize') {
          ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
        }

        if (response.msg_type === 'balance') {
          const balanceData = response.balance;
          if (onBalanceUpdate) {
            onBalanceUpdate({
              balance: balanceData.balance,
              currency: balanceData.currency,
              loginid: balanceData.loginid
            });
          }
        }
      } catch (err) {
        if (onError) onError('Failed to parse socket message.');
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      if (ws) ws.close();
      urlIndex++;
      connectWebSocket();
    };
  }

  // 2. HTTPS REST Fallback Polling (Used when WSS is completely blocked)
  function startHttpPolling() {
    async function fetchBalanceOverHttp() {
      try {
        const response = await fetch('https://api.derivws.com/account/v1/balance', {
          method: 'GET',
          headers: {
            'Deriv-App-ID': APP_ID,
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok && data.data) {
          if (onBalanceUpdate) {
            onBalanceUpdate({
              balance: data.data.balance,
              currency: data.data.currency,
              loginid: data.data.loginid
            });
          }
        } else if (data.errors && data.errors.length > 0) {
          if (onError) onError(data.errors[0].message);
        }
      } catch (err) {
        if (onError) onError('Unable to retrieve balance over HTTPS network connection.');
      }
    }

    fetchBalanceOverHttp();
    pollingInterval = setInterval(fetchBalanceOverHttp, 4000); // Poll every 4 seconds
  }

  connectWebSocket();

  // Cleanup handler
  return () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  };
}