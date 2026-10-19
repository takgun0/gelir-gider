// İlk girişte gösterilen tanıtım. "Görüldü" bilgisi cihaza özgü bir tercihtir;
// tema gibi localStorage'da tutulur ve yedeğe girmez. Ayarlar'dan yeniden açılabilir.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Tour } from '../ui/tour/Tour';

export const TOUR_SEEN_KEY = 'tourSeen';

export function readTourSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === 'true';
  } catch {
    // Depolama kapalıysa tur her açılışta gösterilir; Geç ile kapatılabilir.
    return false;
  }
}

export function writeTourSeen(): void {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, 'true');
  } catch {
    // Depolama kapalıysa yalnızca bu oturumda geçerli olur.
  }
}

interface TourApi {
  openTour: () => void;
}

const TourContext = createContext<TourApi | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() => !readTourSeen());
  const openTour = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openTour }), [openTour]);

  return (
    <TourContext value={value}>
      {children}
      {open && (
        <Tour
          onClose={() => {
            writeTourSeen();
            setOpen(false);
          }}
        />
      )}
    </TourContext>
  );
}

export function useTour(): TourApi {
  const value = useContext(TourContext);
  if (!value) throw new Error('TourProvider eksik');
  return value;
}
