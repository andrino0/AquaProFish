import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import App from './App.jsx';
import './styles.css';

// Confirma que o JavaScript iniciou corretamente para permitir rollback seguro.
if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady().catch(error => {
    console.warn('AquaProFish: não foi possível confirmar a inicialização do atualizador:', error);
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);