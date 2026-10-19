// Uygulama kabuğu (DESIGN §5): <640 alt çubuk, 640–1023 72 px ikon şeridi,
// ≥1024 200 px kenar çubuğu. Masaüstü kısayolları: N, /, ← →.
import { LayoutDashboard } from 'lucide-react';
import { List } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Settings2 } from 'lucide-react';
import { Shapes } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { copy } from '../ui/copy';
import { isModalOpen } from '../ui/components/modal-stack';
import { useSelectedMonth } from './month';
import { useTxSheet } from './tx-sheet';
import { useKeyboardOpen } from './viewport';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const SUMMARY: NavItem = { to: '/', label: copy.nav.summary, icon: LayoutDashboard, end: true };
const TRANSACTIONS: NavItem = { to: '/islemler', label: copy.nav.transactions, icon: List };
const CATEGORIES: NavItem = { to: '/kategoriler', label: copy.nav.categories, icon: Shapes };
const SETTINGS: NavItem = { to: '/ayarlar', label: copy.nav.settings, icon: Settings2 };

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function useShortcuts(onNew: () => void) {
  const navigate = useNavigate();
  const { shift } = useSelectedMonth();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target) || isModalOpen()) return;
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        onNew();
      } else if (event.key === '/') {
        event.preventDefault();
        void navigate('/islemler', { state: { search: true } });
      } else if (event.key === 'ArrowLeft') {
        shift(-1);
      } else if (event.key === 'ArrowRight') {
        shift(1);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navigate, onNew, shift]);
}

function BottomBar({ onAdd }: { onAdd: () => void }) {
  const item = ({ to, label, icon: Icon, end }: NavItem) => (
    <NavLink
      key={to}
      to={to}
      end={end ?? false}
      className={({ isActive }) =>
        `flex h-[52px] flex-col items-center justify-center gap-0.5 text-xs leading-4 ${
          isActive ? 'font-semibold text-accent' : 'font-medium text-text-2'
        }`
      }
    >
      <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
      {label}
    </NavLink>
  );
  return (
    <nav
      aria-label={copy.nav.main}
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-end bg-surface px-1 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[inset_0_1px_0_var(--border)] sm:hidden"
    >
      {item(SUMMARY)}
      {item(TRANSACTIONS)}
      <div className="flex h-[52px] items-start justify-center">
        <button
          type="button"
          aria-label={copy.nav.add}
          className="-mt-[22px] flex size-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-[0_6px_16px_var(--shadow)] active:brightness-90"
          onClick={onAdd}
        >
          <Plus size={26} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      {item(CATEGORIES)}
      {item(SETTINGS)}
    </nav>
  );
}

function Rail({ onAdd }: { onAdd: () => void }) {
  const item = ({ to, label, icon: Icon, end }: NavItem) => (
    <NavLink
      key={to}
      to={to}
      end={end ?? false}
      aria-label={label}
      className={({ isActive }) =>
        `group relative flex size-12 items-center justify-center rounded-xl ${
          isActive ? 'bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-accent' : 'text-text-2'
        }`
      }
    >
      <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-full z-40 ml-2 hidden rounded-lg bg-toast px-2.5 py-1.5 text-[13px] leading-[18px] font-medium whitespace-nowrap text-on-toast group-hover:block group-focus-visible:block"
      >
        {label}
      </span>
    </NavLink>
  );
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col items-center gap-4 bg-surface pt-[max(16px,env(safe-area-inset-top))] pb-4 shadow-[inset_-1px_0_0_var(--border)] sm:flex lg:hidden">
      <button
        type="button"
        aria-label={copy.nav.add}
        className="group relative flex size-12 items-center justify-center rounded-xl bg-accent text-on-accent"
        onClick={onAdd}
      >
        <Plus size={22} strokeWidth={2} aria-hidden="true" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-full z-40 ml-2 hidden rounded-lg bg-toast px-2.5 py-1.5 text-[13px] leading-[18px] font-medium whitespace-nowrap text-on-toast group-hover:block group-focus-visible:block"
        >
          {copy.nav.add}
        </span>
      </button>
      <nav aria-label={copy.nav.main} className="flex flex-1 flex-col items-center gap-1">
        {item(SUMMARY)}
        {item(TRANSACTIONS)}
        {item(CATEGORIES)}
        <div className="flex-1" />
        {item(SETTINGS)}
      </nav>
    </aside>
  );
}

function Sidebar({ onAdd }: { onAdd: () => void }) {
  const item = ({ to, label, icon: Icon, end }: NavItem) => (
    <NavLink
      key={to}
      to={to}
      end={end ?? false}
      className={({ isActive }) =>
        `flex h-11 items-center gap-3 rounded-xl px-3 ${
          isActive ? 'bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] font-semibold text-accent' : 'font-medium text-text-2'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      {label}
    </NavLink>
  );
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[200px] flex-col gap-5 bg-surface px-3 py-6 shadow-[inset_-1px_0_0_var(--border)] lg:flex">
      <div className="px-2 text-[15px] leading-5 font-semibold">{copy.appName}</div>
      <button
        type="button"
        className="flex h-11 items-center gap-2 rounded-xl bg-accent px-3 font-semibold text-on-accent active:brightness-90"
        onClick={onAdd}
      >
        <Plus size={20} strokeWidth={2} aria-hidden="true" />
        <span className="flex-1 text-left">{copy.nav.add}</span>
        <kbd className="rounded-md bg-white/20 px-1.5 py-px font-sans text-xs leading-4">N</kbd>
      </button>
      <nav aria-label={copy.nav.main} className="flex flex-1 flex-col gap-0.5">
        {item(SUMMARY)}
        {item(TRANSACTIONS)}
        {item(CATEGORIES)}
        <div className="flex-1" />
        {item(SETTINGS)}
      </nav>
    </aside>
  );
}

export function Layout() {
  const { openNew } = useTxSheet();
  const openNewPlain = useCallback(() => openNew(), [openNew]);
  const keyboardOpen = useKeyboardOpen();
  useShortcuts(openNewPlain);

  return (
    <div className="min-h-dvh sm:pl-[72px] lg:pl-[200px]">
      <div className="pt-[env(safe-area-inset-top)] pb-[calc(96px+env(safe-area-inset-bottom))] sm:pb-12">
        <Outlet />
      </div>
      {!keyboardOpen && <BottomBar onAdd={openNewPlain} />}
      <Rail onAdd={openNewPlain} />
      <Sidebar onAdd={openNewPlain} />
    </div>
  );
}
