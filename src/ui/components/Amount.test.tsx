import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrefsProvider } from '../../app/prefs';
import { Amount } from './Amount';

function render(node: React.ReactNode, hidden = false): string {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (key === 'hideAmounts' && hidden ? 'true' : null),
    setItem: () => undefined,
    removeItem: () => undefined,
  });
  return renderToStaticMarkup(<PrefsProvider>{node}</PrefsProvider>);
}

const text = (html: string) => html.replace(/<[^>]+>/g, '');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<Amount>', () => {
  it('türden işaret ve renk alır', () => {
    const expense = render(<Amount kurus={34000} type="expense" />);
    expect(text(expense)).toBe('−₺340,00');
    expect(expense).toContain('text-amount-expense');
    expect(expense).toContain('tabular-nums');
    expect(render(<Amount kurus={250000} type="income" />)).toContain('text-income');
    expect(text(render(<Amount kurus={250000} type="income" />))).toBe('+₺2.500,00');
  });

  it('standart ve işaretli biçim', () => {
    expect(text(render(<Amount kurus={500100} />))).toBe('₺5.001,00');
    expect(text(render(<Amount kurus={0} signed />))).toBe('₺0,00');
    expect(render(<Amount kurus={-273900} />)).toContain('text-expense');
  });

  it('kahraman varyantında ₺ ve kuruş ayrı', () => {
    const html = render(<Amount kurus={590000} signed variant="hero" />);
    expect(text(html)).toBe('+₺5.900,00');
    expect(html).toMatch(/text-text-2[^>]*>\+₺</);
    expect(html).toMatch(/text-text-2[^>]*>,00</);
  });

  it('gizliyken her varyantta ₺•••••; ekran okuyucuya tutar sızmaz', () => {
    for (const node of [<Amount kurus={590000} signed variant="hero" />, <Amount kurus={34000} type="expense" />]) {
      const html = render(node, true);
      expect(html).toContain('₺•••••');
      expect(html).toContain('Tutar gizli');
      expect(text(html)).not.toMatch(/\d/);
    }
  });
});
