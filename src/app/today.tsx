// "Bugün" uygulama genelinde tek kaynaktan okunur; gece yarısı ve sayfa yeniden
// görünür olduğunda yenilenir.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { todayStr } from '../domain/date';
import type { DateStr } from '../domain/types';

const TodayContext = createContext<DateStr>(todayStr());

export function TodayProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(() => todayStr());

  useEffect(() => {
    let timer = 0;
    const refresh = () => setToday(todayStr());
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = window.setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, next.getTime() - now.getTime());
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    scheduleMidnight();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return <TodayContext value={today}>{children}</TodayContext>;
}

export function useToday(): DateStr {
  return useContext(TodayContext);
}
