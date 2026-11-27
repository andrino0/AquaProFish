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

// Registra o service worker para permitir instalar o AquaProFish pelo navegador.
if ('serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(error => {
      console.warn('AquaProFish: não foi possível registrar o modo instalável:', error);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);