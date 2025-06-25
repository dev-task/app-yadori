import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import '@yadori/logic/src/i18n'; // i18n設定をインポート

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);