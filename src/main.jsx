import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store';
import './index.css';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

console.log("Main.jsx: Script started");
try {
  const rootElement = document.getElementById('root');
  console.log("Main.jsx: Root element found:", rootElement);

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <ErrorBoundary>
          <BrowserRouter>
            <App />
            <Toaster position="top-right" />
          </BrowserRouter>
        </ErrorBoundary>
      </Provider>
    </React.StrictMode>,
  );
} catch (error) {
  console.error("Main.jsx: CRITICAL STARTUP ERROR:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;"><h1>Critical Error</h1><pre>${error.toString()}</pre></div>`;
}
