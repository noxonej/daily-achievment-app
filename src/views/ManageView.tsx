import { Switch } from '../components/Switch';
import { ScrollLockGuide } from '../components/today/ScrollLockCard';
import { useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { QuestFormModal } from '../components/QuestFormModal';
import { QuestLibraryModal } from '../components/QuestLibraryModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SyncSettings } from '../components/SyncSettings';
import type { AppState, Frequency, Quest } from '../lib/types';
import { listSnapshots, readSnapshot } from '../lib/safeStorage';
import { formatDisplayDate } from '../lib/date';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from '../lib/xp';
import { Icon } from '../components/Icon';

/** Quest lists (part="quests") or backups and sync (part="data"), shown inside Settings. */
export function ManageView({ part }: { part: 'quests' | 'data' }) {
  const { state, dispatch, undoable } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [editing, setEditing] = useState<Quest | null>(null);
  const [formFrequency, setFormFrequency] = useState<Frequency>('daily');
  const [deleteTarget, setDeleteTarget] = useState<Quest | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const daily = state.quests.filter((q) => q.frequency === 'daily' && !q.wildcardDate);
  const weekly = state.quests.filter((q) => q.frequency === 'weekly' && !q.wildcardWeekKey);

  function openAdd(freq: Frequency) {
    setEditing(null);
    setFormFrequency(freq);
    setFormOpen(true);
  }
  function openEdit(q: Quest) {
    setEditing(q);
    setFormFrequency(q.frequency);
    setFormOpen(true);
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-quests-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File) {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.quests) || !Array.isArray(parsed.goals)) {
          throw new Error('This file does not look like a valid backup.');
        }
        dispatch({ type: 'IMPORT_STATE', state: parsed });
      } catch (e) {
        setImportError(e instanceof Error ? e.message : 'Could not read that file.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      {part === 'quests' && (
      <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Add, edit or pause the quests you do every day and week.</p>
        <button
          onClick={() => setLibraryOpen(true)}
          className="shrink-0 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm px-3.5 py-2 transition"
        >
          <Icon name="📚" size="1.15em" className="icon-inline" />Library
        </button>
      </div>

      <QuestSection
        title="Daily Quests"
        quests={daily}
        onAdd={() => openAdd('daily')}
        onEdit={openEdit}
        onArchiveToggle={(q) => dispatch({ type: 'TOGGLE_ARCHIVE_QUEST', questId: q.id })}
        onDelete={(q) => setDeleteTarget(q)}
      />

      <QuestSection
        title="Weekly Quests"
        quests={weekly}
        onAdd={() => openAdd('weekly')}
        onEdit={openEdit}
        onArchiveToggle={(q) => dispatch({ type: 'TOGGLE_ARCHIVE_QUEST', questId: q.id })}
        onDelete={(q) => setDeleteTarget(q)}
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white"><Icon name="🎲" size="1.15em" className="icon-inline text-rose-300" />Wildcard Quests</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Bonus surprise quests — one rotates daily, one rotates weekly. Don't count toward your streak.
            </p>
          </div>
          <Switch on={!!state.wildcardEnabled} onChange={() => dispatch({ type: 'SET_WILDCARD_ENABLED', enabled: !state.wildcardEnabled })} label="Daily wildcard quest" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white"><Icon name="🔀" size="1.15em" className="icon-inline text-sky-300" />Daily twists</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Some days a quest changes a little: 2.5 L of water instead of 2 L, or meditate 5 minutes, or twice for 5. Same XP.
            </p>
          </div>
          <Switch on={state.prefs?.dailyTwists !== false} onChange={() => dispatch({ type: 'SET_PREFS', prefs: { dailyTwists: state.prefs?.dailyTwists === false } })} label="Daily twists" />
        </div>
      </div>

      <ScrollLockSetting />

      </>
      )}

      {part === 'data' && (
      <>
      <SyncSettings />

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Your Data</p>
        <p className="text-xs text-slate-400 -mt-2">
          Everything is saved on this device. Export a backup so you never lose your progress.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleExport}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm py-2.5 transition"
          >
            <Icon name="⬇" size="1.15em" className="icon-inline" />Export Backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm py-2.5 transition"
          >
            <Icon name="⬆" size="1.15em" className="icon-inline" />Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {importError && <p className="text-xs text-red-400">{importError}</p>}

        <AutoBackups />

        <button
          onClick={() => setConfirmReset(true)}
          className="w-full rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 font-semibold text-sm py-2.5 transition mt-2"
        >
          Reset All Progress
        </button>
      </div>
      </>
      )}

      <QuestFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing ?? undefined}
        defaultFrequency={formFrequency}
        onSubmit={(data) => {
          if (editing) {
            dispatch({ type: 'UPDATE_QUEST', questId: editing.id, updates: data });
          } else {
            dispatch({ type: 'ADD_QUEST', quest: data });
          }
        }}
      />

      <QuestLibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Quest"
        message={`Delete "${deleteTarget?.title}"? Its history stays in your stats, but you won't be able to complete it again.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) undoable({ type: 'DELETE_QUEST', questId: deleteTarget.id }, `${deleteTarget.title} deleted`);
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset All Progress"
        message="This wipes every quest, goal, streak, and achievement and starts fresh. This can't be undone unless you have a backup."
        confirmLabel="Reset Everything"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          dispatch({ type: 'RESET_ALL' });
          setConfirmReset(false);
        }}
      />
    </div>
  );
}

function QuestSection({
  title,
  quests,
  onAdd,
  onEdit,
  onArchiveToggle,
  onDelete,
}: {
  title: string;
  quests: Quest[];
  onAdd: () => void;
  onEdit: (q: Quest) => void;
  onArchiveToggle: (q: Quest) => void;
  onDelete: (q: Quest) => void;
}) {
  const activeQuests = quests.filter((q) => !q.archived);
  const archivedQuests = quests.filter((q) => q.archived);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-sm font-bold text-white">{title}</p>
        <button
          onClick={onAdd}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold px-3 py-1.5 transition"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {activeQuests.map((q) => (
          <QuestRow key={q.id} quest={q} onEdit={() => onEdit(q)} onArchiveToggle={() => onArchiveToggle(q)} onDelete={() => onDelete(q)} />
        ))}
        {activeQuests.length === 0 && (
          <p className="text-xs text-slate-500 py-2">No active quests here yet.</p>
        )}
      </div>
      {archivedQuests.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-slate-500 cursor-pointer select-none">
            {archivedQuests.length} archived
          </summary>
          <div className="space-y-2 mt-2">
            {archivedQuests.map((q) => (
              <QuestRow key={q.id} quest={q} onEdit={() => onEdit(q)} onArchiveToggle={() => onArchiveToggle(q)} onDelete={() => onDelete(q)} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function QuestRow({
  quest,
  onEdit,
  onArchiveToggle,
  onDelete,
}: {
  quest: Quest;
  onEdit: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
        quest.archived ? 'border-white/5 bg-white/[0.01] opacity-60' : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      <Icon name={quest.icon} size={19} className="shrink-0 text-slate-300" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{quest.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${DIFFICULTY_COLOR[quest.difficulty]}`}>
            {DIFFICULTY_LABEL[quest.difficulty]}
          </span>
          <span className="text-[10px] text-slate-500">{quest.category}</span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <button onClick={onEdit} className="text-slate-500 hover:text-white text-sm p-1.5" aria-label="Edit">
          <Icon name="✎" size={15} />
        </button>
        <button
          onClick={onArchiveToggle}
          className="text-slate-500 hover:text-white text-sm p-1.5"
          aria-label={quest.archived ? 'Unarchive' : 'Archive'}
        >
          {quest.archived ? <Icon name="🔄" size={15} /> : <Icon name="📦" size={15} />}
        </button>
        {quest.custom && (
          <button onClick={onDelete} className="text-slate-500 hover:text-red-400 text-sm p-1.5" aria-label="Delete">
            <Icon name="✕" size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

/** The automatic daily copies kept on this device: restore one if something went wrong today. */
function AutoBackups() {
  const { storageKey, undoable } = useApp();
  const [list] = useState(() => listSnapshots(storageKey));
  const [confirm, setConfirm] = useState<string | null>(null);
  if (!list.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <p className="text-sm font-semibold text-white">Automatic backups</p>
      <p className="text-xs text-slate-400 mt-0.5">A copy is kept each day for the last {list.length} {list.length === 1 ? 'day' : 'days'}, on this phone only.</p>
      <ul className="mt-2 space-y-1.5">
        {list.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-slate-300">
              {formatDisplayDate(s.date)} <span className="text-slate-500 text-xs">· start of day · {Math.max(1, Math.round(s.bytes / 1024))} KB</span>
            </span>
            {confirm === s.key ? (
              <button
                onClick={() => {
                  const data = readSnapshot(s.key);
                  if (data && typeof data === 'object' && Array.isArray((data as { quests?: unknown }).quests)) {
                    undoable({ type: 'IMPORT_STATE', state: data as AppState }, `Restored ${formatDisplayDate(s.date)}`);
                  }
                  setConfirm(null);
                }}
                className="shrink-0 rounded-lg bg-amber-500 text-white text-xs font-bold px-3 py-1.5"
              >
                Yes, restore
              </button>
            ) : (
              <button onClick={() => setConfirm(s.key)} className="shrink-0 rounded-lg border border-white/10 text-slate-200 text-xs font-semibold px-3 py-1.5">
                Restore
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScrollLockSetting() {
  const { state, dispatch } = useApp();
  const n = state.prefs?.scrollLock ?? 0;
  const [guide, setGuide] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white"><Icon name="🔒" size="1.15em" className="icon-inline text-rose-300" />Scroll lock</p>
          <p className="text-xs text-slate-400 mt-0.5">TikTok, Instagram and YouTube only after your quests. Today shows when you’ve earned them.</p>
        </div>
        <Switch on={n > 0} onChange={() => dispatch({ type: 'SET_PREFS', prefs: { scrollLock: n ? 0 : 3 } })} label="Scroll lock" />
      </div>
      {n > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Quests first:</span>
          {[2, 3, 4, 5].map((k) => (
            <button
              key={k}
              onClick={() => dispatch({ type: 'SET_PREFS', prefs: { scrollLock: k } })}
              className={`w-9 h-9 rounded-lg text-sm font-bold tabular-nums ${k === n ? 'bg-amber-500 text-white' : 'bg-white/5 border border-white/10 text-slate-300'}`}
            >
              {k}
            </button>
          ))}
          <button onClick={() => setGuide(true)} className="ml-auto text-xs font-semibold text-slate-300 underline underline-offset-2">
            Set up on my phone
          </button>
        </div>
      )}
      <ScrollLockGuide open={guide} onClose={() => setGuide(false)} />
    </div>
  );
}
