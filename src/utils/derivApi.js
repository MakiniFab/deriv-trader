// src/utils/derivApi.js
const APP_ID = '34jtvKMAMvumIpF2SDF0D';
const REST_BASE_URL = 'https://api.derivws.com';

const WS_ENDPOINTS = [
  `wss://ws.deriv.com/websockets/v3?app_id=${APP_ID}`,
  `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`,
  `wss://blue.derivws.com/websockets/v3?app_id=${APP_ID}`
];

// 1. Fetch User Nickname via REST GET /account/v1/nickname
export async function fetchUserNickname(token) {
  const response = await fetch(`${REST_BASE_URL}/account/v1/nickname`, {
    method: 'GET',
    headers: {
      'Deriv-App-ID': APP_ID,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const body = await response.json();

  if (!response.ok || (body.errors && body.errors.length > 0)) {
    const errorMsg = body.errors?.[0]?.message || 'Failed to fetch user nickname from REST API';
    throw new Error(errorMsg);
  }

  return body.data; // Returns { external_reference_id, nickname }
}

// 2. Fetch Account Details & Statement via WebSocket
export function fetchAccountDetailsAndStatement(token) {
  return new Promise((resolve, reject) => {
    function tryConnect(urlIndex) {
      if (urlIndex >= WS_ENDPOINTS.length) {
        reject('All WebSocket endpoints failed to connect. Check local network or ad-blockers.');
        return;
      }

      let ws;
      try {
        ws = new WebSocket(WS_ENDPOINTS[urlIndex]);
      } catch (err) {
        tryConnect(urlIndex + 1);
        return;
      }

      let accountData = null;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          tryConnect(urlIndex + 1);
        }
      }, 6000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        // Step A: Send Authorization
        ws.send(JSON.stringify({ authorize: token }));
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);

          if (response.error) {
            ws.close();
            reject(response.error.message);
            return;
          }

          // Step B: Received authorize response -> Request Statement
          if (response.msg_type === 'authorize') {
            const auth = response.authorize;
            accountData = {
              email: auth.email,
              fullName: `${auth.first_name || ''} ${auth.last_name || ''}`.trim() || 'Trader',
              loginid: auth.loginid,
              balance: auth.balance,
              currency: auth.currency,
              isVirtual: Boolean(auth.is_virtual),
              accountType: auth.is_virtual ? 'Demo' : 'Real',
              accountList: auth.account_list || []
            };

            // Request statement transactions (as specified in documentation)
            ws.send(
              JSON.stringify({
                statement: 1,
                description: 1,
                limit: 10
              })
            );
          }

          // Step C: Received statement response -> Finish
          if (response.msg_type === 'statement') {
            ws.close();
            resolve({
              account: accountData,
              statement: response.statement || { count: 0, transactions: [] }
            });
          }
        } catch (err) {
          ws.close();
          reject('Failed to process WebSocket payload.');
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