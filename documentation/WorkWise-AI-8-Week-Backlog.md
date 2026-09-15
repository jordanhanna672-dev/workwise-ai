# WorkWise AI — 8-Week Project Backlog

**Team:** Jordan Hanna (Lead Architect) · Ti'Asia Gause (Interface Designer) · Cal Reed (Integration Lead)
**Project:** An AI-powered dashboard that consolidates tasks from email, messages, and calendars, prioritizes deadlines, and breaks down complex assignments — with human oversight at every AI decision point.

This backlog is organized so that by Week 8 the team has all three capstone deliverables ready: the code repository, the stakeholder video, and the material each teammate needs for their individual position paper.

---

## Week 1 — Foundations & Architecture
**Sprint Goal:** Agree on tech stack, scaffold the repo, and stand up the skeleton CI/CD pipeline.

| Owner | Tasks |
|---|---|
| Jordan (Lead Architect) | Finalize tech stack; design system architecture diagram; define database schema (users, tasks, sources, priority scores) |
| Ti'Asia (Interface Designer) | Wireframe the dashboard (task list, priority view, task-card detail); set up design system/component library |
| Cal (Integration Lead) | Create GitHub repo with branch protection rules; set up base CI pipeline (lint + build on PR); write initial README |

**Backlog items:**
- [ ] Repo scaffolding (frontend, backend, docs folders)
- [ ] Architecture decision record (ADR) #1: stack choice
- [ ] Database schema v1 + ER diagram
- [ ] Low-fidelity wireframes for dashboard
- [ ] CI pipeline: lint + build passes on push
- [ ] Team working agreement (branching, PR review, commit conventions)

**Ties to deliverables:** Repo structure, first CI/CD evidence, architecture material for the video's "Solution Overview."

---

## Week 2 — Core Backend & Auth
**Sprint Goal:** Stand up the backend service and basic authentication so real data can flow.

| Owner | Tasks |
|---|---|
| Jordan | Build core API endpoints (users, tasks CRUD); set up database migrations |
| Ti'Asia | Build dashboard shell UI (nav, empty states, task-card component) in code |
| Cal | Implement authentication (OAuth or JWT); connect frontend to backend via API client |

**Backlog items:**
- [ ] `POST/GET/PUT/DELETE /tasks` endpoints
- [ ] Auth flow (login/signup or SSO stub)
- [ ] Task-card React/Vue component connected to mock API data
- [ ] Unit tests for backend endpoints (target: core CRUD covered)
- [ ] CI updated to run backend test suite

**Ties to deliverables:** First unit test coverage numbers for code-quality metrics.

---

## Week 3 — Data Ingestion (Email, Chat, Calendar)
**Sprint Goal:** Pull raw items in from at least one email/calendar source and normalize them into a common task-input format.

| Owner | Tasks |
|---|---|
| Jordan | Design ingestion pipeline architecture (queue or scheduled job pattern); define normalized "raw item" schema |
| Ti'Asia | Design "source" indicators in UI (e.g., which item came from email vs. chat vs. calendar) |
| Cal | Integrate one real or sandboxed API (e.g., Gmail/Outlook API, Google Calendar API) with test credentials |

**Backlog items:**
- [ ] Calendar API integration (read-only, sandbox account)
- [ ] Email API integration (read-only, sandbox account) or a realistic mock dataset if API access is restricted
- [ ] Normalized ingestion schema implemented
- [ ] Integration tests for ingestion pipeline
- [ ] ADR #2: why this ingestion pattern (justify against constraints)

**Ties to deliverables:** Concrete example for the position paper's "decomposition" and "pattern recognition" discussion.

---

## Week 4 — AI Feature v1: Smart Task Extractor
**Sprint Goal:** Get a first working version of the AI parsing pipeline with mandatory human review before anything saves.

| Owner | Tasks |
|---|---|
| Jordan | Design the AI service integration (API call structure, prompt design, error handling) |
| Ti'Asia | Build the "review & approve" UI flow (AI suggests → user edits/approves/rejects) |
| Cal | Wire the AI service (LLM API) into the ingestion pipeline; add logging for AI outputs |

**Backlog items:**
- [ ] LLM prompt for extracting action items, deadlines, and subtasks from raw text
- [ ] Human-in-the-loop approval UI (no task saves without user confirmation)
- [ ] Structured output parsing (JSON schema for extracted tasks)
- [ ] Error handling for malformed AI output
- [ ] Test cases: emails/messages with known expected extractions (accuracy baseline)

**Ties to deliverables:** This is the centerpiece AI feature for the video demo and the "AI Feature Integration" repo requirement.

---

## Week 5 — Prioritization Logic & Subtask Breakdown
**Sprint Goal:** Add the ranking/urgency algorithm and richer subtask generation; polish the dashboard UX.

| Owner | Tasks |
|---|---|
| Jordan | Implement prioritization algorithm (deadline proximity, source signals, user-set importance); document the ranking logic |
| Ti'Asia | Build prioritized-list view with visual urgency cues; add override controls (drag-to-reprioritize, manual edit) |
| Cal | Add transparent "reasoning log" showing why a task was ranked/prioritized a certain way |

**Backlog items:**
- [ ] Prioritization algorithm implemented + unit tested
- [ ] Subtask generation refined (multi-step breakdown for complex tasks)
- [ ] Reasoning-log feature (addresses the "poor prioritization" risk from the pitch)
- [ ] Manual override/edit controls in UI
- [ ] Usability pass with the team acting as test users

**Ties to deliverables:** Directly demonstrates the "algorithmic thinking" and "abstraction" points from the Computational Problem-Solving section.

---

## Week 6 — Testing, Metrics & Full CI/CD
**Sprint Goal:** Harden the system — expand test coverage, capture code-quality metrics, and get the full CI/CD pipeline (test → build → deploy) working end to end.

| Owner | Tasks |
|---|---|
| Jordan | Run performance benchmarks (API response times, AI extraction latency); document results |
| Ti'Asia | Accessibility and cross-device UI testing; polish visual design |
| Cal | Extend CI/CD to include automated deployment (staging environment); add code coverage reporting (e.g., Codecov, SonarQube, or built-in tooling) |

**Backlog items:**
- [ ] Test coverage report (target a stated %, e.g., 70–80% on core modules)
- [ ] CI/CD pipeline: lint → test → build → deploy to staging, with passing run screenshots
- [ ] Performance benchmark report (latency, throughput, AI accuracy rate)
- [ ] Security pass: verify encryption in transit/at rest, review data access controls
- [ ] Bug triage and fixes from testing round

**Ties to deliverables:** This week generates the hard evidence for "Code Quality Metrics," "CI/CD Pipeline Evidence," and "Performance Metrics" — and the quantitative data each person needs for Position Paper Section 2.

---

## Week 7 — Documentation & Presentation Prep
**Sprint Goal:** Finish all repo documentation and build the stakeholder video.

| Owner | Tasks |
|---|---|
| Jordan | Write/finalize API documentation and architecture write-up |
| Ti'Asia | Write user manual/installation guide with screenshots; design video slides |
| Cal | Write README polish (setup instructions, badges, contribution guide); draft video demo script and record screen-capture footage |

**Backlog items:**
- [ ] README finalized (overview, setup, usage, architecture diagram, contributors)
- [ ] API documentation complete
- [ ] Installation guide + user manual complete
- [ ] Video script drafted, covering: problem statement, architecture, live AI demo, performance data, value proposition
- [ ] Raw footage/screen recordings captured

**Ties to deliverables:** Completes "Comprehensive Documentation" requirement; sets up Part 2 for final edit.

---

## Week 8 — Final Polish, Video, and Individual Reflections
**Sprint Goal:** Ship the final repo, finish and export the video, and give each teammate room to write their position paper.

| Owner | Tasks |
|---|---|
| Jordan | Final code freeze; verify CI/CD is green; tag release version |
| Ti'Asia | Final UI polish pass; edit and finalize video (titles, transitions, captions) |
| Cal | Final repo cleanup (remove dead code/branches); compile contribution log (commit history summary per member) |
| All | Individually draft and submit 1,300-word Position Paper (Parts 1–3) |

**Backlog items:**
- [ ] Final release tagged (e.g., v1.0.0) with CI/CD green checkmark
- [ ] Video exported and uploaded (YouTube/Vimeo or MP4 file)
- [ ] Individual contribution log finalized (for submission requirement)
- [ ] Each member drafts Position Paper:
  - Section 1: System delivery & integration (400 words)
  - Section 2: Methodology & performance evaluation, with citations to SEI/IEEE standards (450 words)
  - Section 3: Professional development roadmap, with citations to Stack Overflow Survey / Octoverse / IEEE reports (450 words)
- [ ] Final submission package assembled (repo link, video link, PDFs)

---

## Risk Checkpoints (revisit weekly)
- **AI parsing inaccuracy** → confirm human-review gate is still mandatory before every save (check in Weeks 4, 5, 6)
- **Data privacy** → confirm encryption and access controls are in place before any real account data is used (check in Weeks 3, 6)
- **Poor prioritization** → confirm reasoning logs and override controls are visible and functional (check in Weeks 5, 6)

---

## Notes on Using This Backlog
- This is a **starting point** generated to give the team a realistic week-by-week structure — adjust task ownership and scope as the actual tech stack and team availability solidify.
- Each week's backlog items double as a natural source of "specific examples from your codebase and development process" for Position Paper Section 1, and the Week 6 metrics directly support Section 2's quantitative evidence requirement.
- Consider tracking these items in a GitHub Projects board or Jira so the commit history and board activity together form your collaboration evidence.
