// src/utils/derivApi.js
const ENDPOINTS = [
  'wss://ws.deriv.com/websockets/v3?app_id=34jtvKMAMvumIpF2SDF0D',
  'wss://ws.derivws.com/websockets/v3?app_id=34jtvKMAMvumIpF2SDF0D'
];

export function fetchAccountDetails(token) {
  return new Promise((resolve, reject) => {
    function tryConnect(urlIndex) {
      if (urlIndex >= ENDPOINTS.length) {
        reject('All WebSocket endpoints failed to connect.');
        return;
      }

      const ws = new WebSocket(ENDPOINTS[urlIndex]);

      ws.onopen = () => {
        ws.send(JSON.stringify({ authorize: token }));
      };

      ws.onmessage = (event) => {
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
            // Check if active account is virtual (demo) or real
            isVirtual: Boolean(authData.is_virtual),
            accountType: authData.is_virtual ? 'Demo' : 'Real',
            // List of all connected user accounts (CR / VRTC numbers)
            accountList: authData.account_list || []
          };

          ws.close();
          resolve(details);
        }
      };

      ws.onerror = () => {
        ws.close();
        tryConnect(urlIndex + 1);
      };
    }

    tryConnect(0);
  });
}