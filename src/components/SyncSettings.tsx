import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ConfirmDialog } from './ConfirmDialog';

export function SyncSettings() {
  const { syncConfig, syncStatus, syncMessage, connectSync, disconnectSync, syncNow, restoreFromGithub } = useApp();
  const [editing, setEditing] = useState(!syncConfig);
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState(syncConfig?.owner ?? '');
  const [repo, setRepo] = useState(syncConfig?.repo ?? '');
  const [path, setPath] = useState(syncConfig?.path ?? 'cloud-save/progress.json');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const busy = syncStatus === 'syncing';

  async function handleConnect() {
    if (!token.trim() || !owner.trim() || !repo.trim() || !path.trim()) return;
    await connectSync({ token: token.trim(), owner: owner.trim(), repo: repo.trim(), path: path.trim(), autoSync: true });
    setToken('');
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white">☁️ Cloud Sync</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Save your progress to a private file in your own GitHub repo, so it follows you across
          devices and browsers — with full version history for free.
        </p>
      </div>

      {syncConfig && !editing ? (
        <div className="space-y-2.5">
          <div className="text-xs text-slate-300 bg-white/5 rounded-lg px-3 py-2">
            <p>
              Connected to <span className="font-semibold text-white">{syncConfig.owner}/{syncConfig.repo}</span>
            </p>
            <p className="text-slate-500 mt-0.5">{syncConfig.path}</p>
            {syncConfig.lastSyncedAt && (
              <p className="text-slate-500 mt-0.5">
                Last synced {new Date(syncConfig.lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>

          {syncMessage && (
            <p className={`text-xs ${syncStatus === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
              {syncStatus === 'syncing' ? 'Syncing…' : syncMessage}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => syncNow()}
              disabled={busy}
              className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-semibold text-sm py-2.5 transition"
            >
              {busy ? 'Syncing…' : 'Sync Now'}
            </button>
            <button
              onClick={() => setConfirmRestore(true)}
              disabled={busy}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-white font-semibold text-sm py-2.5 transition"
            >
              Restore from GitHub
            </button>
          </div>
          <button
            onClick={() => setConfirmDisconnect(true)}
            className="w-full text-xs text-slate-500 hover:text-red-400 transition py-1"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="GitHub personal access token"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="owner"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-sm"
            />
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="repo"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="cloud-save/progress.json"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-sm"
          />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Create a fine-grained token at GitHub → Settings → Developer settings → Personal
            access tokens, scoped to only this repo, with "Contents: Read and write" permission.
            The token is stored only in this browser and sent only to api.github.com.
          </p>
          {syncMessage && syncStatus === 'error' && <p className="text-xs text-red-400">{syncMessage}</p>}
          <div className="flex gap-2">
            {syncConfig && (
              <button
                onClick={() => setEditing(false)}
                className="flex-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm py-2.5 transition"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleConnect}
              disabled={busy || !token.trim() || !owner.trim() || !repo.trim() || !path.trim()}
              className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-semibold text-sm py-2.5 transition"
            >
              {busy ? 'Connecting…' : 'Connect & Sync'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect Cloud Sync"
        message="Your GitHub token will be removed from this browser. Your existing backup on GitHub stays put."
        confirmLabel="Disconnect"
        danger
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={() => {
          disconnectSync();
          setEditing(true);
          setConfirmDisconnect(false);
        }}
      />

      <ConfirmDialog
        open={confirmRestore}
        title="Restore from GitHub"
        message="This replaces everything on this device with whatever was last synced to GitHub. Local changes since then will be lost."
        confirmLabel="Restore"
        danger
        onCancel={() => setConfirmRestore(false)}
        onConfirm={() => {
          restoreFromGithub();
          setConfirmRestore(false);
        }}
      />
    </div>
  );
}
