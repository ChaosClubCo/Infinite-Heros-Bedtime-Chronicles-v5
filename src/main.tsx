import React from 'react';
import ReactDOM from 'react-dom/client';
import RootApp from './App';
import './index.css';
import { registerServiceWorker } from './services/offlineCacheService';

// Initialize Service Worker for offline bedtime story reading
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);

