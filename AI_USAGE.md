# AI Usage

## Tool

**Claude Code** (Claude Opus 5.5), in VS Code. No other AI tool was used.

## How I worked with it

I know the fundamentals of .NET, SQL and React, but for this project I chose to work AI-first: Claude Code wrote the implementation, and I directed it — setting the scope, making the product decisions and deciding what went into the repository. I think this is how a lot of software will be built, and I wanted to show I can get a complete, tested system out of that way of working.

| Part | AI's role |
|---|---|
| Plan | The step-by-step plan (one GitHub issue and branch per step), checked against every numbered rule in the brief. |
| Backend | The endpoints, database model and migrations, seat locking, expiry sweeper and error handling. |
| Tests | The backend tests (including the concurrency and two-process tests) and the frontend tests. |
| Frontend | The pages and components, the error handling and the school-portal redesign. |
| Docker and CI | The Dockerfiles, `docker-compose.yml` and the GitHub Actions workflow. |
| Docs | README, ASSUMPTIONS and this file. |

## What I decided

- Product choices: a richer, school-style website after seeing the first, too-plain version; the fictional school's name; English with Bangla on key labels; light theme only.
- Workflow: one issue and branch per step with several commits each; I opened and merged every pull request and decided when each step was pushed.
- I asked for the finished work to be checked against the brief, item by item.

## Where the AI was wrong, and how it was caught

Each step was tested before it was merged; these are the problems that testing and review turned up.

| # | What went wrong | How it was caught | Fix |
|---|---|---|---|
| 1 | The first plan missed rule 7 (bad input must never give `500`), a duplicate application racing past the check into a database error, and holds still reading `HELD` after their time ran out. | Re-checking the plan against each numbered rule. | Validation for every input, unique-index violations mapped to `409`, expiry judged on every read. |
| 2 | It added a `Co-Authored-By` line to commits, so it showed up as a contributor on GitHub. | I noticed it on GitHub. | Rewrote those commits; AI use is disclosed here instead. |
| 3 | The concurrency tests passed alone, but the full test run failed with "too many clients": each test app could open 100 database connections. | Running the whole suite, not just the new tests. | Capped each test app at 30 connections; the same limit (40) was later set for the real backends. |
| 4 | A command committed the change above even though tests had failed, because it only checked that a summary line was printed. | Reading the test output before pushing. | Fixed and re-ordered the commits so every commit passes; nothing broken was pushed. |
| 5 | The two-process test still passed with the seat lock removed: the second app was starting up and took the requests one by one, hiding the race. | Removing the lock on purpose to see whether the test fails. | The test warms up both processes first; without the lock it now fails every time. |
| 6 | The home page went silently empty when the server sent something that was not a list (for example a proxy's error page). | Testing the page with unexpected responses. | Such answers now show "The server sent an answer this page does not understand" with Try again. |
| 7 | After a button was renamed to "Cancel application · বাতিল", a test that checked it was gone kept passing for the wrong reason. | Reviewing the tests after the label change. | The test matches the new label, so it fails again if Cancel shows when it should not. |
| 8 | The first website was too plain and did not look like a real school's site. | I said so after running it. | Redesigned as a school portal: home page, class list, help page, application slip, admission dashboard. |
| 9 | Layout slips: on phones the admin table broke class names mid-word, and the "seats open" bars looked empty because they showed taken seats. | Reviewing screenshots at desktop and phone width. | Fixed the layouts; the bars now show free seats. |
