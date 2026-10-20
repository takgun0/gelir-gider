import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { CategoriesPage } from '../ui/pages/CategoriesPage';
import { DebtsPage } from '../ui/pages/DebtsPage';
import { SettingsPage } from '../ui/pages/SettingsPage';
import { SummaryPage } from '../ui/pages/SummaryPage';
import { RecurringPage } from '../ui/pages/RecurringPage';
import { TransactionsPage } from '../ui/pages/TransactionsPage';
import { GenerationWatcher } from './generation';
import { Layout } from './Layout';
import { TourProvider } from './onboarding';
import { SelectedMonthProvider } from './month';
import { PrefsProvider } from './prefs';
import { UpdateWatcher } from './pwa';
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
            <UpdateWatcher />
            <HashRouter>
              <TxSheetProvider>
                <TourProvider>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route index element={<SummaryPage />} />
                      <Route path="islemler" element={<TransactionsPage />} />
                      <Route path="islemler/sabit" element={<RecurringPage />} />
                      <Route path="islemler/borclar" element={<DebtsPage />} />
                      <Route path="kategoriler" element={<CategoriesPage />} />
                      <Route path="ayarlar" element={<SettingsPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
                </TourProvider>
              </TxSheetProvider>
            </HashRouter>
          </ToastProvider>
        </SelectedMonthProvider>
      </TodayProvider>
    </PrefsProvider>
  );
}
