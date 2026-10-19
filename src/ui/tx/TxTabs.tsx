// İşlemler › Kayıtlar / Sabit sekmeleri (Tasarım §6.2). Sekmeler ayrı adreslerdir.
import { NavLink } from 'react-router';
import { copy } from '../copy';

export function TxTabs() {
  const tab = (to: string, label: string) => (
    <NavLink
      to={to}
      end
      replace
      className={({ isActive }) =>
        `flex h-[38px] items-center justify-center rounded-[10px] lg:h-9 ${
          isActive ? 'bg-surface font-semibold text-text' : 'font-medium text-text-2'
        }`
      }
    >
      {label}
    </NavLink>
  );
  return (
    <nav aria-label={copy.nav.transactions} className="grid grid-cols-2 rounded-xl bg-surface-2 p-[3px] lg:w-60">
      {tab('/islemler', copy.transactions.tabRecords)}
      {tab('/islemler/sabit', copy.transactions.tabRecurring)}
    </nav>
  );
}
