const assert = require('assert');
const { test, describe } = require('node:test');
const mock = require('mock-require');

// Stub database layer before importing GameState
const queries = [];
mock('../server/db', {
  pool: {
    query: async (...args) => {
      queries.push(args);
      // Simulate SELECT returning empty rows and UPDATE returning success
      return { rows: [] };
    }
  }
});

const GameState = require('../server/gameState');

describe('GameState scoring', () => {
  test('adds arbitrary score amounts and persists player totals', async () => {
    const gs = new GameState();
    gs.players.set('socket-1', { name: 'Larry', score: 5 });
    gs.persistentScores.set('Larry', {
      score: 5,
      bumpedTargets: new Set(),
      socialPlatform: null,
      socialHandle: null
    });

    const updated = await gs.addScore('socket-1', 100);

    assert.strictEqual(updated, true, 'addScore should succeed when player exists');
    assert.strictEqual(gs.players.get('socket-1').score, 105);
    assert.strictEqual(gs.persistentScores.get('Larry').score, 105);
    assert.ok(
      queries.some(([sql]) => sql.startsWith('UPDATE players SET score = $1')),
      'should persist score updates to the database layer'
    );
  });

  test('returns false when attempting to score a missing player', async () => {
    const gs = new GameState();
    const updated = await gs.addScore('missing', 10);
    assert.strictEqual(updated, false);
  });
});
