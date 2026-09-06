// src/utils/derivApi.js
const APP_ID = '34jtvKMAMvumIpF2SDF0D';

const ENDPOINTS = [
  `wss://ws.deriv.com/websockets/v3?app_id=${APP_ID}`,
  `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`,
  `wss://blue.derivws.com/websockets/v3?app_id=${APP_ID}`
];

/**
 * Connects to Deriv WebSocket API, authorizes with the user token,
 * and fetches basic active account details.
 * 
 * @param {string} token - OAuth access token retrieved from auth.getToken()
 * @returns {Promise<Object>} Account details object
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

      // 5-second connection timeout to cycle to the next endpoint if stalled
      connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          tryConnect(urlIndex + 1);
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        // Authorize session using OAuth token
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