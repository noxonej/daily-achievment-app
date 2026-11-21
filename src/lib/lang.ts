import { locale } from './locale';

/** True when the app is showing Lithuanian. */
export const isLt = (): boolean => locale().toLowerCase().startsWith('lt');

/** Inline two-language text for new round-2 screens: L('Squads', 'Komandos'). */
export const L = (en: string, lt: string): string => (isLt() ? lt : en);
