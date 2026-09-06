// src/utils/derivApi.js
const APP_ID = '34jtvKMAMvumIpF2SDF0D';

const WS_ENDPOINTS = [
  `wss://ws.deriv.com/websockets/v3?app_id=${APP_ID}`,
  `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`,
  `wss://blue.derivws.com/websockets/v3?app_id=${APP_ID}`
];

export function subscribeToBalance(token, onBalanceUpdate, onError) {
  let ws = null;
  let urlIndex = 0;

  function connect() {
    if (urlIndex >= WS_ENDPOINTS.length) {
      onError('All WebSocket endpoints failed to connect.');
      return;
    }

    ws = new WebSocket(WS_ENDPOINTS[urlIndex]);

    ws.onopen = () => {
      // 1. Authorize connection
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);

        if (response.error) {
          onError(response.error.message);
          return;
        }

        // 2. Once authorized, subscribe to balance
        if (response.msg_type === 'authorize') {
          ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
        }

        // 3. Receive initial balance and continuous subscription updates
        if (response.msg_type === 'balance') {
          const balanceData = response.balance;
          onBalanceUpdate({
            balance: balanceData.balance,
            currency: balanceData.currency,
            loginid: balanceData.loginid,
            subscriptionId: balanceData.id
          });
        }
      } catch (err) {
        onError('Failed to parse socket message.');
      }
    };

    ws.onerror = () => {
      ws.close();
      urlIndex++;
      connect();
    };
  }

  connect();

  // Return a cleanup function to close the connection when component unmounts
  return () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
}