'use strict';
/**
 * Smart Task Extractor
 * ---------------------
 * Takes a raw chunk of text (an email body, a chat message, a calendar
 * invite description) and turns it into a *suggested* task: a title,
 * a best-guess deadline, and a list of subtasks. Nothing this module
 * produces is ever saved automatically - server.js always routes the
 * result through a human "approve / edit / reject" step first
 * (mitigates the "AI parsing inaccuracies" risk named in the pitch).
 *
 * Two modes:
 *   - Heuristic mode (default, zero setup): regex + keyword based.
 *     This is what makes the alpha runnable by anyone with no API key.
 *   - LLM mode (optional): if OPENAI_API_KEY is set in the environment,
 *     we call the OpenAI API and ask for strict JSON back. If the
 *     network call fails or the model returns something that isn't
 *     valid JSON matching our schema, we log the problem and fall back
 *     to heuristic mode rather than crashing or saving garbage
 *     ("error handling for malformed AI output" from the risk list).
 */

const DEADLINE_PATTERNS = [
  // "by Friday", "due Friday", "before Friday"
  { re: /\b(?:by|due|before)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, type: 'weekday' },
  // "tomorrow", "today", "tonight"
  { re: /\b(today|tonight)\b/i, type: 'today' },
  { re: /\btomorrow\b/i, type: 'tomorrow' },
  // "next week"
  { re: /\bnext week\b/i, type: 'next_week' },
  // explicit dates: 4/12, 04-12-2026, 2026-04-12
  { re: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, type: 'iso' },
  { re: /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/, type: 'mdy' },
];

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function guessDeadline(text, now = new Date()) {
  for (const pattern of DEADLINE_PATTERNS) {
    const m = text.match(pattern.re);
    if (!m) continue;
    const d = new Date(now);
    if (pattern.type === 'today') {
      d.setHours(23, 59, 0, 0);
      return { deadline: d.toISOString(), matched: m[0], pattern: pattern.type };
    }
    if (pattern.type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(23, 59, 0, 0);
      return { deadline: d.toISOString(), matched: m[0], pattern: pattern.type };
    }
    if (pattern.type === 'next_week') {
      d.setDate(d.getDate() + 7);
      return { deadline: d.toISOString(), matched: m[0], pattern: pattern.type };
    }
    if (pattern.type === 'weekday') {
      const target = WEEKDAYS.indexOf(m[1].toLowerCase());
      const diff = (target - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      d.setHours(23, 59, 0, 0);
      return { deadline: d.toISOString(), matched: m[0], pattern: pattern.type };
    }
    if (pattern.type === 'iso') {
      const [, y, mo, day] = m;
      const parsed = new Date(Number(y), Number(mo) - 1, Number(day), 23, 59);
      if (!isNaN(parsed)) return { deadline: parsed.toISOString(), matched: m[0], pattern: pattern.type };
    }
    if (pattern.type === 'mdy') {
      const [, mo, day, yr] = m;
      const year = yr ? (yr.length === 2 ? 2000 + Number(yr) : Number(yr)) : now.getFullYear();
      const parsed = new Date(year, Number(mo) - 1, Number(day), 23, 59);
      if (!isNaN(parsed)) return { deadline: parsed.toISOString(), matched: m[0], pattern: pattern.type };
    }
  }
  return { deadline: null, matched: null, pattern: null };
}

function guessTitle(text) {
  const firstSentence = text.split(/[.!?\n]/)[0].trim();
  const title = firstSentence.length > 0 ? firstSentence : text.trim().slice(0, 80);
  return title.length > 80 ? title.slice(0, 77) + '...' : title;
}

function guessSubtasks(text) {
  // Look for an explicit list first (bullets, numbers, "1)", "-", "*").
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const listItems = lines.filter((l) => /^([-*•]|\d+[.)])\s+/.test(l));
  if (listItems.length >= 2) {
    return listItems.map((l) => l.replace(/^([-*•]|\d+[.)])\s+/, ''));
  }
  // Otherwise, split the body into sentences first, then split each
  // sentence on clause connectors ("and", "also", ";") as a rough
  // decomposition of the request into separate actionable pieces.
  const body = text.replace(/\n+/g, ' ').trim();
  const sentences = body.split(/(?<=[.!?])\s+/).filter(Boolean);
  const clauses = sentences
    .flatMap((s) => s.split(/,?\s+(?:and|also)\s+|;\s+/i))
    .map((c) => c.trim().replace(/[.!?]+$/, ''))
    .filter((c) => c.length > 3);
  return clauses.slice(0, 6);
}

function heuristicExtract(rawText, source) {
  const { deadline, matched, pattern } = guessDeadline(rawText);
  const title = guessTitle(rawText);
  const subtasks = guessSubtasks(rawText);
  const reasoningLog = [
    `Pattern recognition: scanned for known deadline phrasing ("by <day>", "tomorrow", dates, etc.).`,
    matched
      ? `Found deadline phrase "${matched}" (pattern: ${pattern}) → set deadline.`
      : `No recognizable deadline phrase found → left deadline unset for manual entry.`,
    `Decomposition: split the message into ${subtasks.length || 1} candidate subtask(s).`,
    `Abstraction: hid raw message text from the task card; only the derived title, deadline, and subtasks are shown.`,
    `Source: "${source}" recorded so the dashboard can show where this task came from.`,
  ];
  return {
    title,
    deadline,
    subtasks: subtasks.length ? subtasks : [],
    source,
    confidence: matched ? 0.6 : 0.35, // heuristic mode is intentionally conservative
    mode: 'heuristic',
    reasoningLog,
  };
}

function buildSystemPrompt(now) {
  const todayIso = now.toISOString().slice(0, 10);
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  return `You extract one actionable task from a raw work message (email, chat, or calendar note).
Today's date is ${todayIso} (${weekday}). Treat this as "today" when resolving relative dates like
"Friday", "tomorrow", "next week", or "in two weeks" - always resolve to the NEXT matching date at or
after today. Never use a date from your training data or any date before today unless the message
itself references a specific past date.
Respond with ONLY a JSON object, no prose, no markdown fences, matching exactly this shape:
{"title": string, "deadline_iso": string | null, "subtasks": string[], "confidence": number between 0 and 1}
If there is no clear deadline, use null for deadline_iso. Keep subtasks short and actionable (max 6).`;
}

async function llmExtract(rawText, source, apiKey, now = new Date()) {
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: buildSystemPrompt(now) },
      { role: 'user', content: rawText },
    ],
    temperature: 0.2,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API returned ${res.status}`);
  }
  const data = await res.json();
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) throw new Error('OpenAI response missing content');

  const cleaned = content.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned); // throws on malformed output → caller falls back

  if (typeof parsed.title !== 'string' || !Array.isArray(parsed.subtasks)) {
    throw new Error('OpenAI response failed schema validation');
  }

  const reasoningLog = [
    'Sent the raw message to the configured LLM (OpenAI) for extraction.',
    `Included today's date (${now.toISOString().slice(0, 10)}) in the prompt so relative dates like "Friday" resolve correctly.`,
    'Validated the response against the expected JSON schema before using it.',
    `Source: "${source}" recorded so the dashboard can show where this task came from.`,
  ];

  // Sanity check: even with today's date in the prompt, models occasionally
  // still hallucinate a stale date (e.g. one from training data). A deadline
  // more than ~60 days in the past is far more likely to be a hallucination
  // than a real overdue task the user just heard about, so discard it rather
  // than show something clearly wrong.
  let deadline = parsed.deadline_iso || null;
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const daysPast = (now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24);
    if (!isNaN(deadlineDate) && daysPast > 60) {
      reasoningLog.push(
        `Discarded the AI's proposed deadline (${deadline}) - it was ${Math.round(daysPast)} days in the past, which looks like a hallucinated date rather than a real one.`
      );
      deadline = null;
    }
  }

  return {
    title: parsed.title,
    deadline,
    subtasks: parsed.subtasks,
    source,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
    mode: 'llm',
    reasoningLog,
  };
}

/**
 * Main entry point used by the server.
 * Always resolves (never throws) - on any LLM failure it silently
 * degrades to heuristic mode and notes that in the reasoning log.
 */
async function extractTask(rawText, source, now = new Date()) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return heuristicExtract(rawText, source);
  }
  try {
    return await llmExtract(rawText, source, apiKey, now);
  } catch (err) {
    const fallback = heuristicExtract(rawText, source);
    fallback.reasoningLog.unshift(
      `LLM extraction failed (${err.message}) → fell back to heuristic mode so the task isn't lost.`
    );
    return fallback;
  }
}

module.exports = {
  extractTask,
  heuristicExtract,
  guessDeadline,
  guessTitle,
  guessSubtasks,
  buildSystemPrompt,
  llmExtract,
};
