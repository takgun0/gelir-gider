// Günlük harcama grafiği (DESIGN §6.1 madde 5, SPEC §6 "Grafikler").
// Çubuklar ve eksenler Recharts; gün sütunları, pazartesi çizgileri, ortalama etiketi ve
// baloncuk aynı geometriyle HTML olarak üstüne çizilir. Dokunma alanı günün tüm sütunu.
import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { Bar, BarChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import type { TransactionsNavState } from '../../app/nav-state';
import { useMediaQuery } from '../../app/viewport';
import { longDate, monthName } from '../../domain/date';
import type { DayBar } from '../../domain/stats';
import type { DateStr, Period } from '../../domain/types';
import { useAmountText } from '../components/amount-text';
import { axisTicks } from '../charts/scale';
import { useWidth } from '../charts/useWidth';
import { copy } from '../copy';

const X_TICKS = [1, 5, 10, 15, 20, 25, 30];
const X_AXIS_H = 22;
const TOP = 10;

interface DailyChartProps {
  period: Period;
  today: DateStr;
  days: DayBar[];
  average: number | null;
}

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: DayBar;
}

export function DailyChart({ period, today, days, average }: DailyChartProps) {
  const navigate = useNavigate();
  const amountText = useAmountText();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [ref, width] = useWidth<HTMLDivElement>();
  const [selected, setSelected] = useState<number | null>(null);

  const height = isDesktop ? 200 + X_AXIS_H + TOP : 140 + X_AXIS_H + TOP;
  const yWidth = isDesktop ? 48 : 40;
  const barWidth = isDesktop ? 12 : 6;
  const plotW = Math.max(0, width - yWidth);
  const plotH = height - X_AXIS_H - TOP;
  const ticks = axisTicks(Math.max(...days.map((d) => d.expense), average ?? 0));
  const top = ticks[2] ?? 1;
  const band = days.length ? plotW / days.length : 0;
  const yOf = (value: number) => TOP + plotH * (1 - value / top);

  const focusDay = selected ?? days.findIndex((d) => d.isToday);
  const tabbable = focusDay >= 0 ? focusDay : 0;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    e.stopPropagation();
    const next = Math.min(days.length - 1, Math.max(0, tabbable + dir));
    setSelected(next);
    (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
  };

  const picked = selected !== null ? days[selected] : undefined;
  const dayLabel = (d: DayBar) => copy.summary.dayBar(longDate(d.date, today), amountText(-d.expense, 'signed'), d.count);

  const BarShape = ({ x = 0, y = 0, width: w = 0, height: h = 0, payload }: BarShapeProps) => {
    if (!payload || h <= 0) return <g />;
    const bw = Math.min(barWidth, w);
    const opacity = payload.isToday || payload.day - 1 === selected ? 1 : 0.6;
    const r = Math.min(3, h);
    const left = x + (w - bw) / 2;
    return (
      <path
        d={`M${left},${y + h}V${y + r}Q${left},${y} ${left + r},${y}H${left + bw - r}Q${left + bw},${y} ${left + bw},${y + r}V${y + h}Z`}
        fill="var(--expense-chart)"
        opacity={opacity}
      />
    );
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-surface p-4 lg:gap-5 lg:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-[15px] leading-5 font-semibold">{copy.summary.daily}</h2>
        <span className="text-right text-xs leading-4 font-medium text-text-2">
          {isDesktop ? copy.summary.dailyNoteDesktop : copy.summary.dailyNote}
        </span>
      </div>
      <div ref={ref} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <>
            {/* Alt katman: seçili gün sütunu ve pazartesi çizgileri */}
            <div aria-hidden="true" className="absolute" style={{ left: yWidth, top: 0, width: plotW, height: TOP + plotH }}>
              {days.map((d, i) =>
                d.isMonday || i === selected ? (
                  <span
                    key={d.date}
                    className={`absolute top-0 bottom-0 ${i === selected ? 'rounded-t bg-surface-2' : 'w-px bg-border'}`}
                    style={{ left: i * band, width: i === selected ? band : undefined }}
                  />
                ) : null,
              )}
            </div>
            <BarChart
              width={width}
              height={height}
              data={days}
              margin={{ top: TOP, right: 0, bottom: 0, left: 0 }}
              barCategoryGap={0}
              className="relative"
              accessibilityLayer={false}
            >
              <XAxis
                dataKey="day"
                ticks={X_TICKS}
                interval={0}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                height={X_AXIS_H}
                tick={{ fill: 'var(--text-2)', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                width={yWidth}
                ticks={ticks}
                domain={[0, top]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-2)', fontSize: 12, fontWeight: 500 }}
                tickFormatter={(v: number) => amountText(v, 'short')}
              />
              {average !== null && average > 0 && (
                <ReferenceLine y={average} stroke="var(--text-2)" strokeDasharray="4 3" strokeOpacity={0.8} />
              )}
              <Bar dataKey="expense" shape={BarShape} isAnimationActive={!reduceMotion} animationDuration={400} />
            </BarChart>
            {average !== null && average > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-0 bg-surface pl-1 text-xs leading-4 font-medium text-text-2 tabular-nums"
                style={{ top: Math.max(0, yOf(average) - 18) }}
              >
                {copy.summary.average(amountText(average, 'whole'))}
              </span>
            )}
            {/* Üst katman: günün tüm sütunu dokunma alanı; ekran okuyucu gün gün okur */}
            <div
              role="group"
              aria-label={copy.summary.dailyChart(monthName(period))}
              className="absolute flex"
              style={{ left: yWidth, top: 0, width: plotW, height: TOP + plotH }}
              onKeyDown={onKeyDown}
            >
              {days.map((d, i) => (
                <button
                  key={d.date}
                  type="button"
                  tabIndex={i === tabbable ? 0 : -1}
                  disabled={d.isFuture}
                  aria-pressed={i === selected}
                  aria-label={dayLabel(d)}
                  className="h-full flex-1 rounded-t outline-offset-0"
                  onClick={() => setSelected(i === selected ? null : i)}
                />
              ))}
            </div>
            {picked && (
              <button
                type="button"
                className="absolute z-10 -translate-x-1/2 rounded-[10px] bg-text px-3 py-2 text-[13px] leading-[18px] font-medium whitespace-nowrap text-surface shadow-[0_6px_16px_var(--shadow)] tabular-nums"
                style={{
                  left: `${Math.min(72, Math.max(28, ((yWidth + (picked.day - 0.5) * band) / width) * 100))}%`,
                  bottom: height - Math.min(yOf(picked.expense), yOf(average ?? 0)) + 10,
                }}
                onClick={() => {
                  const state: TransactionsNavState = { day: picked.date };
                  void navigate('/islemler', { state });
                }}
              >
                {dayLabel(picked)}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
