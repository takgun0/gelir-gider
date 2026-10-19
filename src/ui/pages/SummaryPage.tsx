import { Eye } from 'lucide-react';
import { EyeOff } from 'lucide-react';
import { usePrefs } from '../../app/prefs';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { Page } from '../components/Page';
import { copy } from '../copy';

export function SummaryPage() {
  const { hideAmounts, setHideAmounts } = usePrefs();
  return (
    <Page>
      <header className="flex h-12 items-center justify-between gap-2">
        <h1 className="sr-only">{copy.nav.summary}</h1>
        <MonthSwitcher large />
        <button
          type="button"
          aria-label={hideAmounts ? copy.amount.show : copy.amount.hide}
          aria-pressed={hideAmounts}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-text-2"
          onClick={() => setHideAmounts(!hideAmounts)}
        >
          {hideAmounts ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </header>
    </Page>
  );
}
