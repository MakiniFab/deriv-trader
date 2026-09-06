// src/utils/derivApi.js
const APP_ID = '34jtvKMAMvumIpF2SDF0D';
const WS_ENDPOINTS = [
  `wss://ws.deriv.com/websockets/v3?app_id=${APP_ID}`,
  `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`
];

export function subscribeToBalance(token, onBalanceUpdate, onError) {
  let ws = null;
  let pollingInterval = null;
  let wsConnected = false;

  // 1. Attempt WebSocket Connection
  function startWebSocket() {
    let endpointIndex = 0;

    function connect() {
      if (endpointIndex >= WS_ENDPOINTS.length) {
        console.warn('WebSockets blocked by browser/network. Switching to HTTP fallback...');
        startHttpPolling();
        return;
      }

      ws = new WebSocket(WS_ENDPOINTS[endpointIndex]);

      const connectionTimeout = setTimeout(() => {
        if (!wsConnected) {
          ws.close();
          endpointIndex++;
          connect();
        }
      }, 3500);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        wsConnected = true;
        ws.send(JSON.stringify({ authorize: token }));
      };

      ws.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);

          if (res.msg_type === 'authorize' && !res.error) {
            ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
          }

          if (res.msg_type === 'balance' && res.balance) {
            onBalanceUpdate({
              balance: res.balance.balance,
              currency: res.balance.currency,
              loginid: res.balance.loginid,
              source: 'WebSocket Live'
            });
          }
        } catch (e) {
          onError('Failed to parse response.');
        }
      };

      ws.onerror = () => {
        clearTimeout(connectionTimeout);
        ws.close();
        endpointIndex++;
        connect();
      };
    }

    connect();
  }

  // 2. HTTP Polling Fallback if WS fails
  function startHttpPolling() {
    async function poll() {
      try {
        const res = await fetch('https://api.derivws.com/account/v1/balance', {
          headers: {
            'Deriv-App-ID': APP_ID,
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.data) {
          onBalanceUpdate({
            balance: data.data.balance,
            currency: data.data.currency,
            loginid: data.data.loginid,
            source: 'HTTP Rest'
          });
        }
      } catch (err) {
        onError('Network blocked both WebSocket and HTTP calls.');
      }
    }

    poll();
    pollingInterval = setInterval(poll, 5000); // Poll every 5 seconds
  }

  startWebSocket();

  // Cleanup on unmount
  return () => {
    if (ws) ws.close();
    if (pollingInterval) clearInterval(pollingInterval);
  };
}