/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { LocaleProvider } from '~/i18n/LocaleContext';
import type { Locale } from '~/i18n/locale';
import QrCodeGeneratorTool from './QrCodeGeneratorTool';
import { STORAGE_KEY } from './lib/settings';

// The shared guide below the tool links to the other tools, so the component
// needs a router context.
function renderTool(locale: Locale = 'en') {
  return render(
    <MemoryRouter>
      <LocaleProvider locale={locale}>
        <QrCodeGeneratorTool />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

function fill(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function logoInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) {
    throw new Error('no logo input');
  }
  return input;
}

/** The rendered QR as an element, or null while nothing has been entered. */
function preview(): SVGSVGElement | null {
  return document.querySelector('.qr-preview-image svg');
}

describe('QR Code Generator', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows a hint instead of a code until something is entered', () => {
    renderTool();
    expect(preview()).toBeNull();
    expect(
      screen.getByText('Fill in the fields above and the code appears here.'),
    ).toBeInTheDocument();
  });

  it('draws a code as the URL is typed', () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    const svg = preview();
    expect(svg).not.toBeNull();
    // 'https://yoshinya.com' needs 25 modules, plus the default quiet zone of
    // 4 on each side.
    expect(svg?.getAttribute('viewBox')).toBe('0 0 33 33');
  });

  it('enables the save buttons only once there is a code', () => {
    renderTool();
    const png = screen.getByRole('button', { name: 'Save as PNG' });
    expect(png).toBeDisabled();
    fill('Web address', 'yoshinya.com');
    expect(png).toBeEnabled();
  });

  it('reports the exported size, rounded to whole modules', () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    // 33 modules across at the default 512px request: 512 / 33 = 15.5…
    expect(document.querySelector('.qr-size')?.textContent).toContain(
      'Exported at 495 × 495 px',
    );
  });

  it('switches the fields with the mode', () => {
    renderTool();
    fireEvent.click(screen.getByRole('tab', { name: 'WiFi' }));
    expect(screen.getByLabelText('Network name (SSID)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Web address')).not.toBeInTheDocument();
  });

  it('hides the password field for an open network', () => {
    renderTool();
    fireEvent.click(screen.getByRole('tab', { name: 'WiFi' }));
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Security'), {
      target: { value: 'nopass' },
    });
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('says so when the text cannot fit in one code', () => {
    renderTool();
    fireEvent.click(screen.getByRole('tab', { name: 'Text' }));
    fill('Text', 'x'.repeat(5000));
    expect(preview()).toBeNull();
    expect(
      screen.getByText(/This is too long for one QR code/),
    ).toBeInTheDocument();
  });

  it('counts the lines waiting in the bulk box', () => {
    renderTool();
    // The section shares its heading with the box, so the role narrows it.
    fireEvent.change(
      screen.getByRole('textbox', { name: '④ Make many at once' }),
      { target: { value: 'a,https://a.example\nhttps://b.example' } },
    );
    expect(screen.getByText('2 codes ready')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Generate and download the ZIP' }),
    ).toBeEnabled();
  });

  it('keeps the bulk button disabled while the box is empty', () => {
    renderTool();
    expect(
      screen.getByRole('button', { name: 'Generate and download the ZIP' }),
    ).toBeDisabled();
  });

  it('remembers settings but never what was typed', () => {
    const { unmount } = renderTool();
    fireEvent.change(screen.getByLabelText('Error correction'), {
      target: { value: 'H' },
    });
    fill('Web address', 'yoshinya.com');
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? '';
    expect(JSON.parse(stored).errorCorrection).toBe('H');
    expect(stored).not.toContain('yoshinya.com');
    unmount();

    renderTool();
    expect(screen.getByLabelText('Error correction')).toHaveValue('H');
    expect(screen.getByLabelText('Web address')).toHaveValue('');
  });

  it('warns when two colours are too close to read apart', () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    expect(
      screen.queryByText(/These two colours are only/),
    ).not.toBeInTheDocument();
    // Brand coral on white: 2.8:1, the choice a palette invites.
    fireEvent.change(screen.getByLabelText('Code colour'), {
      target: { value: '#fb713c' },
    });
    expect(
      screen.getByText(/These two colours are only 2.8:1 apart/),
    ).toBeInTheDocument();
  });

  it('takes a hex code typed straight into the field', () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    // The brand navy, as someone would paste it from a brand guide.
    fill('Code colour', '#162E64');
    expect(preview()?.querySelector('path')?.getAttribute('fill')).toBe(
      '#162e64',
    );
  });

  it('marks a value that is not a colour without breaking the code', () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    fill('Code colour', 'navy blue please');
    const field = screen.getByLabelText('Code colour');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText('That is not a colour. Use six hex digits, like #162E64.'),
    ).toBeInTheDocument();
    // The last colour that parsed is still the one being drawn.
    expect(preview()?.querySelector('path')?.getAttribute('fill')).toBe(
      '#000000',
    );
  });

  it('warns about an inverted code separately', () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    fireEvent.change(screen.getByLabelText('Code colour'), {
      target: { value: '#ffffff' },
    });
    fireEvent.change(screen.getByLabelText('Background colour'), {
      target: { value: '#000000' },
    });
    // The guide below explains inversion too, so this looks at the warning.
    expect(document.querySelector('.qr-warning')?.textContent).toContain(
      'This code is lighter than its background',
    );
  });

  it('puts the colours back', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText('Code colour'), {
      target: { value: '#fb713c' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Back to black on white' }));
    expect(screen.getByLabelText('Code colour')).toHaveValue('#000000');
    expect(screen.getByLabelText('Background colour')).toHaveValue('#ffffff');
  });

  it('refuses an SVG logo, which could carry a script into the markup', () => {
    renderTool();
    fireEvent.click(screen.getByRole('radio', { name: 'Logo' }));
    const file = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' });
    fireEvent.change(logoInput(), { target: { files: [file] } });
    expect(
      screen.getByText('Choose a PNG, JPEG or WebP image.'),
    ).toBeInTheDocument();
  });

  it('embeds a chosen logo and moves to the level that can rebuild it', async () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    fireEvent.click(screen.getByRole('radio', { name: 'Logo' }));
    const file = new File([new Uint8Array([1, 2, 3])], 'logo.png', {
      type: 'image/png',
    });
    fireEvent.change(logoInput(), { target: { files: [file] } });

    await screen.findByRole('button', { name: 'Remove the logo' });
    expect(preview()?.querySelector('image')).not.toBeNull();
    // A logo is damage the code has to survive.
    expect(screen.getByLabelText('Error correction')).toHaveValue('H');
    expect(
      screen.getByText(/Error correction switched to H/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove the logo' }));
    expect(preview()?.querySelector('image')).toBeNull();
  });

  it('draws a word over the middle, in the code colour by default', () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    fill('Code colour', '#162E64');
    fireEvent.click(screen.getByRole('radio', { name: 'Text' }));
    fill('Text to show', 'YOSHINYA');

    const text = preview()?.querySelector('text');
    expect(text?.textContent).toBe('YOSHINYA');
    expect(text?.getAttribute('fill')).toBe('#162e64');
    // Anything over the middle needs the level that can rebuild it.
    expect(screen.getByLabelText('Error correction')).toHaveValue('H');
  });

  it('lets the word take its own colour, and gives the default back', () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    fireEvent.click(screen.getByRole('radio', { name: 'Text' }));
    fill('Text to show', 'よしにゃ');
    fill('Text colour', '#fb713c');
    expect(preview()?.querySelector('text')?.getAttribute('fill')).toBe(
      '#fb713c',
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Match the code colour' }),
    );
    expect(preview()?.querySelector('text')?.getAttribute('fill')).toBe(
      '#000000',
    );
  });

  it('shows only one thing in the middle at a time', () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    fireEvent.click(screen.getByRole('radio', { name: 'Text' }));
    fill('Text to show', 'よしにゃ');
    expect(preview()?.querySelector('text')).not.toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Nothing' }));
    expect(preview()?.querySelector('text')).toBeNull();
  });

  it('shrinks the font rather than letting a long word cut across the code', () => {
    renderTool();
    fill('Web address', 'yoshinya.com');
    fireEvent.click(screen.getByRole('radio', { name: 'Text' }));
    fill('Text to show', 'よ');
    const big = Number(preview()?.querySelector('text')?.getAttribute('font-size'));
    fill('Text to show', 'よしにゃによしにゃに');
    const small = Number(
      preview()?.querySelector('text')?.getAttribute('font-size'),
    );
    expect(small).toBeLessThan(big);
  });

  it('names the trademark holder, as Japanese pages are expected to', () => {
    renderTool('ja');
    expect(
      screen.getByText('QRコードは株式会社デンソーウェーブの登録商標です。'),
    ).toBeInTheDocument();
  });

  it('renders the Japanese page', () => {
    renderTool('ja');
    expect(
      screen.getByRole('heading', { name: 'よしにゃにQRコード作成', level: 1 }),
    ).toBeInTheDocument();
    fill('URL', 'yoshinya.com');
    expect(preview()).not.toBeNull();
  });
});
