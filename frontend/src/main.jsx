import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </React.StrictMode>
);
