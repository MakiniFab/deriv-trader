const TOKEN_KEY = 'deriv_access_token';

export const auth = {
  // Save access token securely
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Retrieve current token
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Check if session exists
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Clear session on logout or error
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('oauth_state');
  }
};