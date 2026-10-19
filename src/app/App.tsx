import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { copy } from '../ui/copy';
import { Placeholder } from '../ui/pages/Placeholder';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Placeholder title={copy.nav.summary} />} />
        <Route path="/islemler" element={<Placeholder title={copy.nav.transactions} />} />
        <Route path="/islemler/sabit" element={<Placeholder title={copy.nav.transactions} />} />
        <Route path="/kategoriler" element={<Placeholder title={copy.nav.categories} />} />
        <Route path="/ayarlar" element={<Placeholder title={copy.nav.settings} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
