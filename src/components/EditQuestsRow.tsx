import { settings } from '../lib/settingsNav';
import { Icon } from './Icon';

/** A clear way to change your quests right where you see them (they live in Settings > Quests). */
export function EditQuestsRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <button
        onClick={() => settings.open('quests')}
        className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300"
      >
        <Icon name="✎" size={12} />
        Edit quests
      </button>
    </div>
  );
}
