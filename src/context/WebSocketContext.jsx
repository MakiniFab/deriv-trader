import React, { createContext, useContext, useState } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  // Your existing WebSocket logic...
  const authorize = async (token) => {
    // WebSocket authorization call logic
  };

  return (
    <WebSocketContext.Provider value={{ authorize }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useDerivWS = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useDerivWS must be used within a WebSocketProvider');
  }
  return context;
};