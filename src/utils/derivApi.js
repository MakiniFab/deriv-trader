// src/utils/derivApi.js
const APP_ID = '34jtvKMAMvumIpF2SDF0D';

const WS_ENDPOINTS = [
  `wss://ws.deriv.com/websockets/v3?app_id=${APP_ID}`,
  `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`,
  `wss://blue.derivws.com/websockets/v3?app_id=${APP_ID}`
];

/**
 * Client-side REST call to fetch all options trading accounts.
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
 * Client-side WebSocket balance subscription.
 */
export function subscribeToBalance(token, onBalanceUpdate, onError) {
  let ws = null;
  let urlIndex = 0;

  function connect() {
    if (urlIndex >= WS_ENDPOINTS.length) {
      if (onError) onError('All WebSocket connection endpoints failed.');
      return;
    }

    ws = new WebSocket(WS_ENDPOINTS[urlIndex]);

    ws.onopen = () => {
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);

        if (response.error) {
          if (onError) onError(response.error.message);
          return;
        }

        // Once authorized, request subscribed balance
        if (response.msg_type === 'authorize') {
          ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
        }

        if (response.msg_type === 'balance') {
          const balanceData = response.balance;
          if (onBalanceUpdate) {
            onBalanceUpdate({
              balance: balanceData.balance,
              currency: balanceData.currency,
              loginid: balanceData.loginid,
              subscriptionId: balanceData.id
            });
          }
        }
      } catch (err) {
        if (onError) onError('Failed to parse socket message.');
      }
    };

    ws.onerror = () => {
      ws.close();
      urlIndex++;
      connect();
    };
  }

  connect();

  return () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
}