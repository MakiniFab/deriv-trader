export function fetchAccountDetails(token) {
  return new Promise((resolve, reject) => {
    // Open WebSocket connection to Deriv
    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=34jtvKMAMvumIpF2SDF0D');

    ws.onopen = () => {
      // 1. Authorize connection using token
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

        // 2. Extract account details
        const details = {
          email: authData.email,
          fullName: `${authData.first_name || ''} ${authData.last_name || ''}`.trim() || 'Trader',
          loginid: authData.loginid,
          balance: authData.balance,
          currency: authData.currency,
          accountList: authData.account_list || []
        };

        ws.close();
        resolve(details);
      }
    };

    ws.onerror = (err) => {
      ws.close();
      reject('WebSocket connection failed.');
    };
  });
}