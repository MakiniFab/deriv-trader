// src/utils/derivApi.js
const APP_ID = '34jtvKMAMvumIpF2SDF0D';

const ENDPOINTS = [
  `wss://ws.deriv.com/websockets/v3?app_id=${APP_ID}`,
  `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`,
  `wss://blue.derivws.com/websockets/v3?app_id=${APP_ID}`
];

/**
 * Connects to Deriv WebSocket API, authorizes with the user token,
 * and fetches basic active account details once.
 */
export function fetchAccountDetails(token) {
  return new Promise((resolve, reject) => {
    function tryConnect(urlIndex) {
      if (urlIndex >= ENDPOINTS.length) {
        reject('All WebSocket endpoints failed to connect. Check your network connection.');
        return;
      }

      let ws;
      let connectionTimeout;

      try {
        ws = new WebSocket(ENDPOINTS[urlIndex]);
      } catch (err) {
        tryConnect(urlIndex + 1);
        return;
      }

      connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          tryConnect(urlIndex + 1);
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        ws.send(JSON.stringify({ authorize: token }));
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);

          if (response.msg_type === 'authorize') {
            if (response.error) {
              ws.close();
              reject(response.error.message || 'Authorization failed.');
              return;
            }

            const authData = response.authorize;

            const details = {
              email: authData.email,
              fullName: `${authData.first_name || ''} ${authData.last_name || ''}`.trim() || 'Trader',
              loginid: authData.loginid,
              balance: authData.balance,
              currency: authData.currency,
              isVirtual: Boolean(authData.is_virtual),
              accountType: authData.is_virtual ? 'Demo' : 'Real',
              accountList: authData.account_list || []
            };

            ws.close();
            resolve(details);
          }
        } catch (err) {
          ws.close();
          reject('Failed to parse response payload from WebSocket.');
        }
      };

      ws.onerror = () => {
        clearTimeout(connectionTimeout);
        ws.close();
        tryConnect(urlIndex + 1);
      };
    }

    tryConnect(0);
  });
}

/**
 * Establishes a persistent WebSocket connection to stream live balance updates.
 */
export function subscribeToBalance(token, onBalanceUpdate, onError) {
  let ws = null;
  let urlIndex = 0;

  function connect() {
    if (urlIndex >= ENDPOINTS.length) {
      if (onError) onError('All WebSocket endpoints failed to connect.');
      return;
    }

    ws = new WebSocket(ENDPOINTS[urlIndex]);

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