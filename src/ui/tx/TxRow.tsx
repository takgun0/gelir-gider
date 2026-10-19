// İşlem satırı (Tasarım §6.2): 64 px; ikon, başlık ve durum ikonları, kategori, tutar.
// Mobilde sola kaydırınca "Sil"; sonuna kadar kaydırmak doğrudan siler. Masaüstünde
// üzerine gelince "⋯" menüsü (Düzenle, Sil). Odaktaki satırda Enter düzenler, Delete siler.
import { Ellipsis } from 'lucide-react';
import { Repeat } from 'lucide-react';
import { StickyNote } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useIsMobile } from '../../app/viewport';
import type { Category, TxType } from '../../domain/types';
import { Amount } from '../components/Amount';
import { CategoryIcon } from '../components/CategoryIcon';
import { copy } from '../copy';

const ACTION_WIDTH = 88;
/** Yatay hareket bu eşiği geçmeden kaydırma başlamaz; dikey kaydırmayla çakışmaz. */
const DIRECTION_THRESHOLD = 10;

interface TxRowProps {
  title: string;
  subtitle: string;
  amount: number;
  type: TxType;
  category: Pick<Category, 'icon' | 'color'> | undefined;
  note?: string;
  recurring?: boolean;
  onOpen: () => void;
  /** Yoksa satır silinemez (planlanan satırlar). */
  onDelete?: (() => void) | undefined;
}

export function TxRow({ title, subtitle, amount, type, category, note = '', recurring = false, onOpen, onDelete }: TxRowProps) {
  const isMobile = useIsMobile();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; base: number; dir: 'h' | 'v' | null; id: number } | null>(null);
  const swipeEnabled = isMobile && onDelete !== undefined;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!swipeEnabled) return;
    gesture.current = { x: e.clientX, y: e.clientY, base: offset, dir: null, id: e.pointerId };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.dir === null) {
      if (Math.abs(dx) > DIRECTION_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        g.dir = 'h';
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      } else if (Math.abs(dy) > DIRECTION_THRESHOLD) {
        g.dir = 'v';
      }
    }
    if (g.dir === 'h') {
      const width = rowRef.current?.offsetWidth ?? 320;
      setOffset(Math.min(0, Math.max(-width, g.base + dx)));
    }
  };
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (g.dir !== 'h') return;
    setDragging(false);
    const width = rowRef.current?.offsetWidth ?? 320;
    if (-offset > width * 0.6) {
      setOffset(-width);
      onDelete?.();
    } else {
      setOffset(-offset > ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0);
    }
  };

  // Menü dışına tıklayınca ya da Esc ile kapanır.
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e instanceof MouseEvent && rowRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  return (
    <div ref={rowRef} className="group relative overflow-hidden rounded-xl">
      {swipeEnabled && offset < 0 && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-y-0 right-0 flex w-[88px] flex-col items-center justify-center gap-0.5 bg-expense text-[13px] font-semibold text-on-expense"
          onClick={onDelete}
        >
          <Trash2 size={20} strokeWidth={1.75} />
          {copy.transactions.delete}
        </button>
      )}
      <div
        className={`relative flex h-16 items-center bg-surface ${dragging ? '' : 'motion-safe:transition-transform'} touch-pan-y`}
        style={offset ? { transform: `translateX(${offset}px)` } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <button
          type="button"
          className="flex h-full min-w-0 flex-1 items-center gap-3 rounded-xl px-0 text-left sm:px-3 sm:group-hover:bg-surface-2"
          onClick={() => {
            if (offset !== 0) setOffset(0);
            else onOpen();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Delete' && onDelete) {
              e.preventDefault();
              onDelete();
            }
          }}
          onFocus={(e) => setKeyboardFocus(e.currentTarget.matches(':focus-visible'))}
          onBlur={() => setKeyboardFocus(false)}
        >
          {category && <CategoryIcon icon={category.icon} color={category.color} />}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-medium">{title}</span>
              {note !== '' && (
                <span className="group/note relative flex shrink-0">
                  <StickyNote size={14} strokeWidth={2} className="text-text-2" role="img" aria-label={copy.transactions.noteIcon} />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-[260px] -translate-x-1/2 rounded-[10px] bg-toast px-3 py-2 text-[13px] leading-[18px] font-medium text-on-toast shadow-[0_6px_16px_var(--shadow)] sm:group-hover/note:line-clamp-2"
                  >
                    {note}
                  </span>
                </span>
              )}
              {recurring && (
                <Repeat size={14} strokeWidth={2} className="shrink-0 text-text-2" role="img" aria-label={copy.transactions.recurringIcon} />
              )}
            </span>
            <span className="truncate text-[13px] leading-[18px] font-medium text-text-2">
              {keyboardFocus && onDelete ? copy.transactions.rowHint : subtitle}
            </span>
          </span>
          <Amount kurus={amount} type={type} className="text-base leading-[22px] font-semibold" />
        </button>
        {onDelete && !isMobile && (
          <div className="relative ml-1 shrink-0">
            <button
              type="button"
              aria-label={copy.transactions.moreActions}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={`hit-area flex size-9 items-center justify-center rounded-[10px] text-text-2 hover:bg-surface-2 focus-visible:opacity-100 ${
                menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <Ellipsis size={18} aria-hidden="true" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute top-full right-0 z-20 mt-1 flex w-40 flex-col rounded-xl bg-surface p-1 shadow-[0_8px_24px_var(--shadow)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  autoFocus
                  className="h-10 rounded-lg px-3 text-left font-medium hover:bg-surface-2 focus-visible:bg-surface-2"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpen();
                  }}
                >
                  {copy.transactions.edit}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="h-10 rounded-lg px-3 text-left font-medium text-expense hover:bg-surface-2 focus-visible:bg-surface-2"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                >
                  {copy.transactions.delete}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
