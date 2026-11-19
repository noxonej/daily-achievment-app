import { describe, expect, it } from 'vitest';
import { decryptBytes, encryptBytes, bytesToB64, b64ToBytes } from './backupCrypto';
import { mergePrivateText, stripPrivateText } from './firebase';

const key = bytesToB64(crypto.getRandomValues(new Uint8Array(32)));

describe('backup encryption', () => {
  it('round-trips through AES-GCM', async () => {
    const plain = new TextEncoder().encode(JSON.stringify({ diary: 'secret ąčęėįšųūž 🔥' }));
    const { data, iv } = await encryptBytes(key, plain);
    expect(data).not.toContain('secret');
    const back = await decryptBytes(key, data, iv);
    expect(JSON.parse(new TextDecoder().decode(back))).toEqual({ diary: 'secret ąčęėįšųūž 🔥' });
  });

  it('refuses the wrong key', async () => {
    const { data, iv } = await encryptBytes(key, new TextEncoder().encode('x'));
    const other = bytesToB64(crypto.getRandomValues(new Uint8Array(32)));
    await expect(decryptBytes(other, data, iv)).rejects.toThrow();
  });

  it('base64 handles big data', () => {
    const big = Uint8Array.from({ length: 200_000 }, (_, i) => (i * 7919) % 256);
    expect(b64ToBytes(bytesToB64(big))).toEqual(big);
  });
});

describe('backup without a key leaves private writing out', () => {
  const state = {
    quests: [],
    notes: [{ id: 'n', body: 'private note' }],
    dayLogs: { '2026-11-19': { date: '2026-11-19', completedQuestIds: ['a'], freeNote: 'diary', notes: { a: 'gratitude' }, proofs: { a: 'book' } } },
    weekLogs: { '2026-W47': { notes: { w: 'week note' }, completedQuestIds: [] } },
  };

  it('strips diary, notes and proofs but keeps progress', () => {
    const lite = stripPrivateText(state);
    expect(JSON.stringify(lite)).not.toMatch(/private note|diary|gratitude|book|week note/);
    expect(lite.dayLogs['2026-11-19'].completedQuestIds).toEqual(['a']);
  });

  it('puts them back from a full copy', () => {
    expect(mergePrivateText(stripPrivateText(state), state)).toEqual(state);
  });
});
