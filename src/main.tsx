import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './app/App';
import { applyTheme, readThemePref, watchSystemTheme } from './app/theme';

applyTheme(readThemePref());
watchSystemTheme(readThemePref);

const root = document.getElementById('root');
if (!root) throw new Error('#root bulunamadı');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
