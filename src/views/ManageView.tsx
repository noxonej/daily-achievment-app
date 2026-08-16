import { useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { QuestFormModal } from '../components/QuestFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Frequency, Quest } from '../lib/types';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from '../lib/xp';

export function ManageView() {
  const { state, dispatch } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quest | null>(null);
  const [formFrequency, setFormFrequency] = useState<Frequency>('daily');
  const [deleteTarget, setDeleteTarget] = useState<Quest | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const daily = state.quests.filter((q) => q.frequency === 'daily');
  const weekly = state.quests.filter((q) => q.frequency === 'weekly');

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
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
      <div>
        <p className="text-slate-400 text-sm">Configure your journey</p>
        <h1 className="font-display text-2xl font-bold text-white mt-0.5">Manage Quests</h1>
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
            ⬇ Export Backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm py-2.5 transition"
          >
            ⬆ Import Backup
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

        <button
          onClick={() => setConfirmReset(true)}
          className="w-full rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 font-semibold text-sm py-2.5 transition mt-2"
        >
          Reset All Progress
        </button>
      </div>

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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Quest"
        message={`Delete "${deleteTarget?.title}"? Its history stays in your stats, but you won't be able to complete it again.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) dispatch({ type: 'DELETE_QUEST', questId: deleteTarget.id });
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
          className="rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-semibold px-3 py-1.5 transition"
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
      <span className="text-lg shrink-0">{quest.icon}</span>
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
          ✎
        </button>
        <button
          onClick={onArchiveToggle}
          className="text-slate-500 hover:text-white text-sm p-1.5"
          aria-label={quest.archived ? 'Unarchive' : 'Archive'}
        >
          {quest.archived ? '↩' : '📦'}
        </button>
        {quest.custom && (
          <button onClick={onDelete} className="text-slate-500 hover:text-red-400 text-sm p-1.5" aria-label="Delete">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
