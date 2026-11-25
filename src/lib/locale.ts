/**
 * The app's language and time format. Every date, weekday, number and time in the app is
 * formatted with these, so picking a language also translates calendars and clocks.
 */
let current = typeof navigator !== 'undefined' ? navigator.language : 'en';
let hour12Pref: 'auto' | '12' | '24' = 'auto';

export function locale(): string {
  return current;
}

export function setLocale(code: string) {
  current = code;
  try {
    document.documentElement.lang = code;
    localStorage.setItem('dayforge-lang', code);
  } catch {
    // ignore
  }
}

export function setTimeFormat(f: 'auto' | '12' | '24') {
  hour12Pref = f;
}

/** undefined = the language's normal clock. */
export function hour12(): boolean | undefined {
  return hour12Pref === 'auto' ? undefined : hour12Pref === '12';
}

/**
 * A date formatter for the current language, made once and reused (2026-11-25). Calling
 * date.toLocaleDateString(lang, options) builds a brand new formatter every time, which is slow:
 * on the Today screen those calls alone took ~35 ms on a slow phone.
 */
const formatters = new Map<string, Intl.DateTimeFormat>();
export function dateFormat(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${current}|${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(current, options);
    formatters.set(key, f);
  }
  return f;
}

/** Weekday name for Monday-based index 0..6 in the current language. */
export function weekdayName(index: number, style: 'long' | 'short'): string {
  // 2024-01-01 was a Monday.
  return dateFormat({ weekday: style }).format(new Date(2024, 0, 1 + index));
}
