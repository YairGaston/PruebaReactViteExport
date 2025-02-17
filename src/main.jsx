import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { FirebaseProvider } from './context/FirebaseProvider';
import './styles/App.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </React.StrictMode>
);
