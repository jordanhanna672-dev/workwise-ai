# WorkWise AI — Alpha Release

An intelligent workplace assistant that consolidates tasks from emails, messages,
and calendars into a single, prioritized dashboard — with AI suggesting deadlines
and subtasks, and a human always approving before anything is saved.

This is the **alpha**: it proves the whole idea works end-to-end (ingest → AI
extraction → human review → prioritized dashboard), even though it doesn't yet
have real email/Slack/calendar accounts wired up.

---

## Alpha Release Features

- Ingest task information from email, message, or calendar-style text
- Extract a suggested task title, dealine, and subtasks
- Provide an explanation for the generated task suggestion
- Require human approval for the generated task suggestion
- Allow users to reject an AI-generated task suggestion
- Store approved tasks for later use
- Automatically prioritize tasks
- Display reasoning for why tasks are prioritized
- Allow users to mangually override task priority
- Allow users to delete tasks
- Provide automated unit testing
- Provide automated linting and CI/CD validation
- Provide a fallback extraction method when the OpenAI API is not configured

The alpha focuses on demonstrating the complete workflow and integration of the core features rather than providing production-level external service integrations.

---

## 1. What you need before you start

- **Node.js**, version 18 or newer. That's it — no database to install, no
  React/Vite build tools, nothing else.
- If you don't have Node yet: go to <https://nodejs.org>, download the "LTS"
  installer for your operating system, and run it like any other app installer.

To check you have it, open a terminal (see step 2) and type:

```
node --version
```

If you see something like `v20.11.0` or `v22.x.x`, you're good.

---

## 2. Opening a terminal

- **Mac**: press `Cmd + Space`, type `Terminal`, press Enter.
- **Windows**: press the Start key, type `PowerShell`, press Enter. Ensure `PowerShell` Execution Policy has been updated to run scripts under For Developer settings.

Everything below is typed into that window, one line at a time, pressing
Enter after each line.

---

## 3. Get the project onto your computer

If you downloaded this as a `.zip` file:

1. Unzip it (double-click it on Mac/Windows).
2. In your terminal, `cd` into the unzipped folder. For example, if it's on
   your Desktop and named `workwise-ai-alpha`:

   ```
   cd ~/Desktop/workwise-ai-alpha
   ```

If you're getting it from GitHub instead:

```
git clone <the repository URL>
cd workwise-ai-alpha
```

---

## 4. Run it

There is no install step — this app has **zero external dependencies** on
purpose, so there's nothing that can fail to download. Just run:

```
npm start
```

You should see:

```
WorkWise AI alpha running at http://localhost:3000
OPENAI_API_KEY not set - Smart Task Extractor is running in heuristic (no-API-key) mode.
```

Now open a web browser and go to:

```
http://localhost:3000
```

That's the app. To stop it later, click back in the terminal window and press
`Ctrl + C`.

### Try it out

1. On the **Inbox** tab, paste something like:

   > Hey, can you send the Q3 report and the updated slides by Friday? Also
   > loop in Priya on the budget numbers.

2. Click **Extract task with AI**. You'll see a suggested title, deadline,
   and subtasks, plus a "why" explanation.
3. Click **Approve & save** (or **Reject** if it looks wrong — nothing is
   ever saved automatically).
4. Click the **Prioritized Dashboard** tab to see it ranked alongside any
   other tasks, with a "Why is this ranked here?" explanation and a manual
   override box.

---

## 5. CI/CD and Automated Testing 

The project includes a GitHub Actions CI/CD workflow located at:
.github/workflows/ci.yml

The CI workflow runs automatically when changes are pushed to the repository or when a pull request is created.

**The workflow**:
1. Checks out the repository.
2. Sets up Node.js 20.
3. Installs the project dependencies.
4. Runs the lint/syntax check.
5. Runs the automated test suite.
6. Starts the server to verify that the application boots successfuly.
7. Checks the main application endpoint.
8. Checks the '/api/tasks/' endpoint.
9. Stops the test server after the checks are complete.

The same primary quality checks can be run locally with the following down below. 

**Running the automated tests**:

```
npm test
```

This uses Node's own built-in test runner (`node --test`) — again, no
extra install needed. You should see a line like `# pass 9` and `# fail 0`.

To also run the (very lightweight) style/syntax check used in CI:

```
npm run lint
```

A successful GitHub Actions run provides automated verification that the application passes its syntax checks, automated tests, and basic server/API startup checks. 

---

## 6. (Optional) Turning on real AI extraction

By default the "Smart Task Extractor" uses built-in keyword and date-pattern
rules — no API key, no internet call, no cost, and it's what makes this app
runnable by anyone instantly. If you'd like it to use a real large language
model instead:

1. Copy `.env.example` to a new file named `.env`.
2. Put your OpenAI API key after `OPENAI_API_KEY=`.
3. Start the app with `npm run start:with-ai` instead of `npm start`.

If the API call ever fails (bad key, no internet, unexpected response), the
app automatically falls back to the built-in rules instead of crashing or
losing your message — you'll see that noted in the "why" explanation.

The API key should be kept in the '.env' file (that can be created by copying the contents on the .example.env file to another named .env and retrieving a secret key from OpenAI) and should not be committed to the GitHub repository. 

---

## 7. Module Integration

The alpha release is organized into serperate modules that work together to provide the complere WorkWise AI workflow. 

**The main integration flow is**:

User input -> public/Frontend -> server.js API -> src/extractor.js -> Human Review -> src/db/js -> src/prioritize/js -> Prioritized Dashboard

**The primary modules are**: 

1. 'public/' provides the user interface for entering messages, reviewing suggestions, and viewing tasks.
2. 'server.js' provides the HTTP server and API endpoints.
3. 'src.extractor.js' processes incoming text and genrates tasks suggestions.
4. 'src/db.js' stores and retrieves approved tasks.
5. 'src/prioritize.js' calculates task priority and provides ranking explanations.
6. 'tests/' verifies important extraction and prioritization functionality.

The modules communication through the server API, creating the end-to-end workflow of message ingestions -> task extraction -> human approval -> storage -> prioritization -> dashboard display. 

This modular strcuture allows the alpha to demonstrate system cohesion while keeping the major responsibilities seperated for future development. 

---

## 8. Security Considerations

**The alpha includes several basic security protections**:

- API request bodies are limited to help prevent excessively large payloads.
- Invalid JSON requests are rejected with an error response.
- Static file requests are checked to help prevent path traversal outside the public directory.
- OpenAI API credentials are provided through environment variables rather than being stored directly in the source code.
- The '.env' file is intended to remain local and should not be committed to the repository.

Because this is an alpha release, production-level authentication, authorization, rate limiting, and additional input validaton remain areas for future security improvements. 

---

## 9. Error Handling

The application includes basic error handling for critical operations. 

API requests validate required input and return appropriate HTTP error responses when required data is missing, JSON is invalid, or a requested task cannot be found. Unexpected API errors are also caught and returned as internal error responses rather than allowing the server to terminate unexpectedly. 

If the optional OPENAI integration fails, the Smart Task Extractor falls back to the built-in extraction rules so the application can continue operating. 

This approach allows the alpha to demonstrate graceful handling of common input and service failures while maintaining the application's core workflow. 

---

## 10. Alpha Validation

The alpha release is designed to provide a lightweight local demonstration without requiring a database server or frontend build process. 

Automated tests validate important task extraction and prioritization functionality, while the CI workflow verifies that the server starts successfully and that the primary application and task API endpoints respond correctly. 

The alpha prioritizes reliable demonstration of the complete workflow and low setup requirement. Performance measurements and production-level performance thresholds will be established as the project moves from the alpha prototype toward the full production architecture. 

---

## 11. Why no Express / React / PostgreSQL in this alpha?

The team's target stack (see the pitch doc) is React + Node/Express +
PostgreSQL + OpenAI. That's still the plan for later milestones. For the
*alpha specifically*, the top priority was: **anyone on the team, or a
grader, can run this in under a minute with zero setup friction.**

Requiring `npm install` of a dozen packages, a PostgreSQL server, and a
frontend build step would work fine on our own laptops but is a common
source of "it doesn't run on my machine" failures for graders and new
teammates. So the alpha instead uses:

| Target stack (future) | Alpha substitute (now) | Swap-in path |
|---|---|---|
| React frontend | Plain HTML/CSS/JS in `public/` | Point a Vite/CRA app at the same `/api/*` endpoints |
| Node.js + Express backend | Node's built-in `http` module in `server.js` | Same routes, drop in Express for routing sugar |
| PostgreSQL database | JSON file (`data/tasks.json`) via `src/db.js` | Reimplement `src/db.js`'s functions using `pg`, same function signatures |
| OpenAI API | Optional — real OpenAI call if `OPENAI_API_KEY` is set, otherwise a rule-based fallback (`src/extractor.js`) | Already wired up; just add a key |

Nothing about the API contract (`/api/tasks`, `/api/ingest`) changes when any
of these are swapped out, so the frontend and tests don't need to be rewritten
later.

---

## 12. Project structure

```
workwise-ai-alpha/
├── server.js              # HTTP server + API routes
├── src/
│   ├── db.js               # JSON-file "database"
│   ├── extractor.js        # Smart Task Extractor (AI feature)
│   └── prioritize.js       # Prioritization algorithm + reasoning log
├── public/                # Frontend (plain HTML/CSS/JS, no build step)
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── tests/                 # node:test unit tests
├── scripts/lint.js         # zero-dependency syntax check used in CI
├── .github/workflows/ci.yml # GitHub Actions: lint + test + boot check
├── data/                  # tasks.json is created here at runtime (git-ignored)
├── .env.example
└── package.json
```

---

## Alpha Release Summary

**The WorkWise AI alpha demonstrates the complete core workflow**: 
test test
Ingest -> AI Task Extraction -> Human Review -> Approve/Reject -> Task Storage -> Prioritization -> Prioritized Dashboard

The alpha provides a functional foundation for the team's planned production architecture while intentionally documenting the current limitations, technical debt, security considerations, testing approach, and future upgrade path. 
