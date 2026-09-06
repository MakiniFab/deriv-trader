// src/utils/derivApi.js
const APP_ID = '34jtvKMAMvumIpF2SDF0D';

const ENDPOINTS = [
  `wss://ws.deriv.com/websockets/v3?app_id=${APP_ID}&l=EN`,
  `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}&l=EN`,
  `wss://blue.derivws.com/websockets/v3?app_id=${APP_ID}&l=EN`
];

export function fetchAccountDetails(token) {
  return new Promise((resolve, reject) => {
    function tryConnect(urlIndex) {
      if (urlIndex >= ENDPOINTS.length) {
        reject('All WebSocket endpoints failed to connect. Please check your network or disable ad-blockers.');
        return;
      }

      let ws;
      let connectionTimeout;

      try {
        ws = new WebSocket(ENDPOINTS[urlIndex]);
      } catch (e) {
        tryConnect(urlIndex + 1);
        return;
      }

      // Set a 5-second connection timeout to avoid hanging on a single failed endpoint
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
              reject(response.error.message);
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
          reject('Failed to parse response from server.');
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