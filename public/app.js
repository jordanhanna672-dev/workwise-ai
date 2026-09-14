'use strict';

// --- Tab switching ---
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'dashboard') loadTasks();
  });
});

// --- Ingest / extraction flow ---
const ingestForm = document.getElementById('ingest-form');
const suggestionArea = document.getElementById('suggestion-area');

ingestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = document.getElementById('ingest-text').value;
  const source = document.getElementById('ingest-source').value;
  if (!text.trim()) return;

  suggestionArea.innerHTML = '<p class="hint">Extracting…</p>';
  try {
    const res = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'extraction failed');
    renderSuggestion(data.suggestion);
  } catch (err) {
    suggestionArea.innerHTML = `<p class="hint">Something went wrong: ${escapeHtml(err.message)}</p>`;
  }
});

function renderSuggestion(suggestion) {
  const div = document.createElement('div');
  div.className = 'task-card suggestion-card';
  div.innerHTML = `
    <header>
      <h3 class="task-title">${escapeHtml(suggestion.title)}</h3>
      <span class="confidence">confidence: ${(suggestion.confidence * 100).toFixed(0)}% · mode: ${suggestion.mode}</span>
    </header>
    <p class="task-meta">Deadline: ${suggestion.deadline ? new Date(suggestion.deadline).toLocaleString() : 'not detected'} · Source: ${suggestion.source}</p>
    <ul class="task-subtasks">
      ${suggestion.subtasks.map((s) => `<li>${escapeHtml(s)}</li>`).join('') || '<li>(no subtasks detected)</li>'}
    </ul>
    <details class="task-reasoning" open>
      <summary>AI reasoning</summary>
      <ul>${suggestion.reasoningLog.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
    </details>
    <div class="task-actions">
      <button class="approve-btn">Approve & save</button>
      <button class="secondary reject-btn">Reject</button>
    </div>
  `;

  div.querySelector('.approve-btn').addEventListener('click', async () => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: suggestion.title,
        deadline: suggestion.deadline,
        subtasks: suggestion.subtasks,
        source: suggestion.source,
        importance: 3,
        extractionReasoning: suggestion.reasoningLog,
      }),
    });
    suggestionArea.innerHTML = '<p class="hint">Saved. Check the Prioritized Dashboard tab.</p>';
    document.getElementById('ingest-text').value = '';
  });

  div.querySelector('.reject-btn').addEventListener('click', () => {
    suggestionArea.innerHTML = '<p class="hint">Suggestion rejected — nothing was saved.</p>';
  });

  suggestionArea.innerHTML = '';
  suggestionArea.appendChild(div);
}

// --- Dashboard / prioritized list ---
const taskListEl = document.getElementById('task-list');
const cardTemplate = document.getElementById('task-card-template');

async function loadTasks() {
  taskListEl.innerHTML = '<p class="hint">Loading…</p>';
  const res = await fetch('/api/tasks');
  const data = await res.json();
  renderTasks(data.tasks);
}

function renderTasks(tasks) {
  taskListEl.innerHTML = '';
  if (!tasks.length) {
    taskListEl.innerHTML = '<p class="hint">No tasks yet — approve a suggestion from the Inbox tab, or one will appear here once added.</p>';
    return;
  }
  tasks.forEach((task) => {
    const node = cardTemplate.content.cloneNode(true);
    node.querySelector('.task-title').textContent = task.title;
    node.querySelector('.task-score').textContent = `${task.priorityScore}/100`;
    node.querySelector('.task-meta').textContent =
      `Deadline: ${task.deadline ? new Date(task.deadline).toLocaleString() : 'none'} · Source: ${task.source} · Importance: ${task.importance}/5`;

    const subtasksEl = node.querySelector('.task-subtasks');
    (task.subtasks || []).forEach((s) => {
      const li = document.createElement('li');
      li.textContent = s;
      subtasksEl.appendChild(li);
    });

    const reasoningEl = node.querySelector('.task-reasoning ul');
    (task.reasoningLog || []).forEach((r) => {
      const li = document.createElement('li');
      li.textContent = r;
      reasoningEl.appendChild(li);
    });

    const overrideInput = node.querySelector('.override-input');
    overrideInput.value = task.manualOverride != null ? task.manualOverride : '';
    overrideInput.addEventListener('change', async () => {
      const val = overrideInput.value === '' ? null : Number(overrideInput.value);
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualOverride: val }),
      });
      loadTasks();
    });

    node.querySelector('.delete-btn').addEventListener('click', async () => {
      await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      loadTasks();
    });

    taskListEl.appendChild(node);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Initial load in case dashboard tab is opened first.
loadTasks();
