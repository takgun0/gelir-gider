// Son 6 ay (Tasarım §6.1 madde 7): her ayda gelir ve gider çubuğu yan yana; seçili ay
// tam renk, diğerleri %50. Bir aya dokununca o aya geçilir.
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';
import { useSelectedMonth } from '../../app/month';
import { useMediaQuery } from '../../app/viewport';
import { MONTHS, monthShort, parsePeriod } from '../../domain/date';
import type { MonthBar } from '../../domain/stats';
import { useAmountText } from '../components/amount-text';
import { axisTicks } from '../charts/scale';
import { useWidth } from '../charts/useWidth';
import { copy } from '../copy';

const X_AXIS_H = 22;
const TOP = 10;

interface TickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value: unknown };
}

export function MonthsChart({ months }: { months: MonthBar[] }) {
  const { period: selected, setPeriod } = useSelectedMonth();
  const amountText = useAmountText();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [ref, width] = useWidth<HTMLDivElement>();

  const height = (isDesktop ? 196 : 120) + X_AXIS_H + TOP;
  const yWidth = isDesktop ? 48 : 44;
  const barSize = isDesktop ? 18 : 12;
  const ticks = axisTicks(Math.max(...months.map((m) => Math.max(m.income, m.expense))));
  const top = ticks[2] ?? 1;
  const plotW = Math.max(0, width - yWidth);
  const data = months.map((m) => ({ ...m, label: monthShort(m.period) }));

  const MonthTick = ({ x = 0, y = 0, payload }: TickProps) => {
    const isSelected = data.find((d) => d.label === payload?.value)?.period === selected;
    return (
      <text x={x} y={Number(y) + 12} textAnchor="middle" fontSize={12} fontWeight={isSelected ? 600 : 500} fill={isSelected ? 'var(--text)' : 'var(--text-2)'}>
        {String(payload?.value ?? '')}
      </text>
    );
  };

  const monthFull = (period: string) => MONTHS[(parsePeriod(period)?.m ?? 1) - 1] ?? '';

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl bg-surface p-4 lg:gap-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[15px] leading-5 font-semibold">{copy.summary.lastMonths}</h2>
        <div className="flex gap-3 text-xs leading-4 font-medium text-text-2">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-[2px] bg-income-chart" />
            {copy.type.income}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-[2px] bg-expense-chart" />
            {copy.type.expense}
          </span>
        </div>
      </div>
      <div ref={ref} className="relative w-full lg:mt-auto" style={{ height }}>
        {width > 0 && (
          <>
            <BarChart
              width={width}
              height={height}
              data={data}
              margin={{ top: TOP, right: 0, bottom: 0, left: 0 }}
              barGap={isDesktop ? 4 : 3}
              barCategoryGap="20%"
              accessibilityLayer={false}
            >
              <XAxis dataKey="label" interval={0} tickLine={false} axisLine={{ stroke: 'var(--border)' }} height={X_AXIS_H} tick={MonthTick} />
              <YAxis
                width={yWidth}
                ticks={ticks}
                domain={[0, top]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-2)', fontSize: 12, fontWeight: 500 }}
                tickFormatter={(v: number) => amountText(v, 'short')}
              />
              <Bar dataKey="income" barSize={barSize} radius={[3, 3, 0, 0]} fill="var(--income-chart)" isAnimationActive={!reduceMotion} animationDuration={400}>
                {data.map((d) => (
                  <Cell key={d.period} fillOpacity={d.period === selected ? 1 : 0.5} />
                ))}
              </Bar>
              <Bar dataKey="expense" barSize={barSize} radius={[3, 3, 0, 0]} fill="var(--expense-chart)" isAnimationActive={!reduceMotion} animationDuration={400}>
                {data.map((d) => (
                  <Cell key={d.period} fillOpacity={d.period === selected ? 1 : 0.5} />
                ))}
              </Bar>
            </BarChart>
            <div
              role="group"
              aria-label={copy.summary.monthsChart}
              className="absolute flex"
              style={{ left: yWidth, top: 0, width: plotW, height: height - X_AXIS_H }}
            >
              {data.map((d) => (
                <button
                  key={d.period}
                  type="button"
                  aria-pressed={d.period === selected}
                  aria-label={copy.summary.monthBar(monthFull(d.period), amountText(d.income, 'whole'), amountText(d.expense, 'whole'))}
                  className="h-full flex-1 rounded-t"
                  onClick={() => setPeriod(d.period)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
