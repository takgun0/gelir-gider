import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { CategoriesPage } from '../ui/pages/CategoriesPage';
import { SettingsPage } from '../ui/pages/SettingsPage';
import { SummaryPage } from '../ui/pages/SummaryPage';
import { TransactionsPage } from '../ui/pages/TransactionsPage';
import { GenerationWatcher } from './generation';
import { Layout } from './Layout';
import { SelectedMonthProvider } from './month';
import { PrefsProvider } from './prefs';
import { TodayProvider } from './today';
import { ToastProvider } from './toast';
import { TxSheetProvider } from './tx-sheet';

export function App({ generated }: { generated: number }) {
  return (
    <PrefsProvider>
      <TodayProvider>
        <SelectedMonthProvider>
          <ToastProvider>
            <GenerationWatcher initialCount={generated} />
            <HashRouter>
              <TxSheetProvider>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<SummaryPage />} />
                    <Route path="islemler" element={<TransactionsPage />} />
                    <Route path="islemler/sabit" element={<TransactionsPage />} />
                    <Route path="kategoriler" element={<CategoriesPage />} />
                    <Route path="ayarlar" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </TxSheetProvider>
            </HashRouter>
          </ToastProvider>
        </SelectedMonthProvider>
      </TodayProvider>
    </PrefsProvider>
  );
}
