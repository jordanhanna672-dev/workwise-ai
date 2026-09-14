'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { heuristicExtract, guessDeadline, guessSubtasks, buildSystemPrompt, llmExtract } = require('../src/extractor');

test('guessDeadline finds "by Friday" style phrases', () => {
  const { deadline, pattern } = guessDeadline('Please send this by Friday, thanks!');
  assert.equal(pattern, 'weekday');
  assert.ok(deadline, 'expected a deadline to be derived');
});

test('guessDeadline finds explicit dates', () => {
  const { deadline, pattern } = guessDeadline('The report is due 2026-04-12.');
  assert.equal(pattern, 'iso');
  assert.equal(new Date(deadline).getUTCFullYear(), 2026);
});

test('guessDeadline returns null when nothing matches', () => {
  const { deadline, pattern } = guessDeadline('Just checking in, no rush at all.');
  assert.equal(deadline, null);
  assert.equal(pattern, null);
});

test('guessSubtasks splits an explicit bullet list', () => {
  const text = 'Please do the following:\n- Draft the report\n- Send to Priya\n- Book the room';
  const subtasks = guessSubtasks(text);
  assert.equal(subtasks.length, 3);
  assert.match(subtasks[0], /Draft the report/);
});

test('heuristicExtract always returns a well-formed suggestion object', () => {
  const result = heuristicExtract('Can you send the Q3 report and slides by Friday?', 'email');
  assert.equal(typeof result.title, 'string');
  assert.equal(result.mode, 'heuristic');
  assert.ok(Array.isArray(result.subtasks));
  assert.ok(Array.isArray(result.reasoningLog));
  assert.ok(result.reasoningLog.length > 0);
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
});

test('buildSystemPrompt embeds the actual current date so the model cannot fall back to a stale training-data date', () => {
  const now = new Date('2026-09-14T12:00:00Z');
  const prompt = buildSystemPrompt(now);
  assert.match(prompt, /2026-09-14/);
  assert.match(prompt, /Monday/);
});

test('llmExtract discards an implausible (far-past) deadline returned by the model', async () => {
  const now = new Date('2026-09-14T12:00:00Z');
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Send the Q3 report',
              deadline_iso: '2023-10-26T23:59:00.000Z', // stale / hallucinated
              subtasks: ['Send report', 'Send slides'],
              confidence: 0.8,
            }),
          },
        },
      ],
    }),
  });
  try {
    const result = await llmExtract('send by Friday', 'email', 'fake-key', now);
    assert.equal(result.deadline, null);
    assert.ok(result.reasoningLog.some((line) => /Discarded/.test(line)));
  } finally {
    global.fetch = originalFetch;
  }
});

test('llmExtract keeps a plausible near-term deadline returned by the model', async () => {
  const now = new Date('2026-09-14T12:00:00Z');
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Send the Q3 report',
              deadline_iso: '2026-09-18T23:59:00.000Z',
              subtasks: ['Send report', 'Send slides'],
              confidence: 0.8,
            }),
          },
        },
      ],
    }),
  });
  try {
    const result = await llmExtract('send by Friday', 'email', 'fake-key', now);
    assert.equal(result.deadline, '2026-09-18T23:59:00.000Z');
  } finally {
    global.fetch = originalFetch;
  }
});
