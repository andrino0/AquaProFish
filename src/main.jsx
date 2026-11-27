import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import App from './App.jsx';
import './styles.css';

// Confirma ao Capgo que o app iniciou corretamente; em caso de falha, o plugin pode reverter a atualização.
if (Capacitor.isNativePlatform()) {
  void CapacitorUpdater.notifyAppReady().catch(error => {
    console.warn('AquaProFish: não foi possível confirmar a inicialização ao Capgo:', error);
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