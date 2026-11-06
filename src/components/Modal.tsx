import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const EXIT_MS = 220;

export function Modal({ open, onClose, title, children }: ModalProps) {
  // Stay mounted briefly after closing so the sheet can slide away, showing what it showed while open.
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const last = useRef({ title, children });
  if (open) last.current = { title, children };

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  const shown = open ? { title, children } : last.current;
  return (
    <div data-overlay className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 ${closing ? 'pointer-events-none' : ''}`}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${closing ? 'backdrop-out' : 'backdrop-in'}`} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={shown.title}
        className={`relative w-full sm:max-w-md bg-[#121629] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${
          closing ? 'sheet-out' : 'sheet-in'
        }`}
      >
        <div className="sm:hidden flex justify-center pt-2">
          <span className="w-10 h-1 rounded-full bg-white/15" />
        </div>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#121629]">
          <h2 className="font-display text-lg font-bold tracking-wide text-white">{shown.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <Icon name="✕" size={18} />
          </button>
        </div>
        <div className="p-5">{shown.children}</div>
      </div>
    </div>
  );
}
