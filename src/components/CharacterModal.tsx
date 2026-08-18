import { useState } from 'react';
import { Modal } from './Modal';
import { CharacterAvatar } from './CharacterAvatar';
import { useApp } from '../store/AppContext';
import { COSMETICS, type CosmeticItem } from '../data/cosmetics';
import type { CosmeticSlot } from '../lib/types';

const SLOT_TABS: Array<{ id: CosmeticSlot; label: string }> = [
  { id: 'outfit', label: 'Outfit' },
  { id: 'hat', label: 'Hat' },
  { id: 'accessory', label: 'Accessory' },
  { id: 'aura', label: 'Aura' },
];

interface CharacterModalProps {
  open: boolean;
  onClose: () => void;
}

export function CharacterModal({ open, onClose }: CharacterModalProps) {
  const { state, dispatch, stats } = useApp();
  const [activeSlot, setActiveSlot] = useState<CosmeticSlot>('outfit');
  const items = COSMETICS.filter((c) => c.slot === activeSlot);

  return (
    <Modal open={open} onClose={onClose} title="Your Character">
      <div className="flex flex-col items-center mb-4">
        <CharacterAvatar character={state.character} size={132} />
        <div className="mt-3 flex items-center gap-1.5 text-amber-300 font-display font-bold text-lg">
          <span>💎</span>
          <span>{stats.availableShards}</span>
          <span className="text-xs font-medium text-slate-400 font-sans">Shards</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">Earn Shards by completing quests</p>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {SLOT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSlot(tab.id)}
            className={`rounded-lg py-2 text-xs font-semibold transition ${
              activeSlot === tab.id
                ? 'bg-amber-500/20 border border-amber-400 text-amber-200'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-0.5">
        {items.map((item) => (
          <CosmeticCard
            key={item.id}
            item={item}
            equipped={state.character[activeSlot] === item.id}
            owned={item.cost === 0 || state.unlockedCosmeticIds.includes(item.id)}
            affordable={stats.availableShards >= item.cost}
            onAction={() => {
              const owned = item.cost === 0 || state.unlockedCosmeticIds.includes(item.id);
              if (owned) dispatch({ type: 'EQUIP_COSMETIC', slot: activeSlot, itemId: item.id });
              else dispatch({ type: 'UNLOCK_COSMETIC', itemId: item.id });
            }}
          />
        ))}
      </div>
    </Modal>
  );
}

function CosmeticCard({
  item,
  equipped,
  owned,
  affordable,
  onAction,
}: {
  item: CosmeticItem;
  equipped: boolean;
  owned: boolean;
  affordable: boolean;
  onAction: () => void;
}) {
  const disabled = !owned && !affordable;
  return (
    <button
      onClick={onAction}
      disabled={disabled}
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition ${
        equipped
          ? 'border-amber-400 bg-amber-500/15'
          : disabled
            ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
            : 'border-white/10 bg-white/[0.03] hover:border-white/20'
      }`}
    >
      <ItemSwatch item={item} />
      <span className="text-[11px] font-medium text-slate-200 leading-tight text-center">{item.name}</span>
      {equipped ? (
        <span className="text-[10px] font-bold text-amber-300">Equipped</span>
      ) : owned ? (
        <span className="text-[10px] font-bold text-slate-400">Equip</span>
      ) : (
        <span className="text-[10px] font-bold text-amber-300">💎 {item.cost}</span>
      )}
    </button>
  );
}

function ItemSwatch({ item }: { item: CosmeticItem }) {
  if (item.slot === 'outfit') {
    return <div className="w-8 h-8 rounded-[32%]" style={{ background: item.value }} />;
  }
  if (item.slot === 'aura') {
    return (
      <div
        className="w-8 h-8 rounded-full"
        style={{ background: item.value ? `radial-gradient(circle, ${item.value}, transparent 75%)` : 'transparent' }}
      >
        {!item.value && <div className="w-8 h-8 rounded-full border border-dashed border-white/15" />}
      </div>
    );
  }
  return (
    <div className="w-8 h-8 flex items-center justify-center text-xl">
      {item.value || <span className="text-white/20 text-xs">—</span>}
    </div>
  );
}
