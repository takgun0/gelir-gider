import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './app/App';
import { generateNow } from './app/generation';

const root = document.getElementById('root');
if (!root) throw new Error('#root bulunamadı');

// SPEC §5.3: sabit işlem üretimi ilk render'dan önce çalışır.
const generated = await generateNow();

createRoot(root).render(
  <StrictMode>
    <App generated={generated} />
  </StrictMode>,
);
