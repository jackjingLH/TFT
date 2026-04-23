# Repository Guidelines

## Project Structure & Module Organization
Root-level files such as `TFT.txt` and `TFT.md` are the working inputs and outputs for guide processing. Core automation lives in `scraper/` and `images/`.

- `scraper/`: Node.js ESM scripts for fetching TFT guides and saving normalized text or JSON (`fetchTftAcademyGuide.js`, `data/`).
- `images/`: Markdown-to-image pipeline (`workflow.js`, `mdToImage.js`, `splitImageSmart.js`) plus static assets such as `bg.png`.
- `docs/`: term dictionaries and planning/reference documents.
- `output/`: generated images. Treat this as build output, not source.
- `archive/`: reference material and stored content snapshots.

## Build, Test, and Development Commands
Install dependencies from the repository root with `npm install`. Install scraper-specific dependencies with `npm install --prefix scraper`.

- `node scraper/fetchTftAcademyGuide.js <url>`: fetch a TFT Academy guide into local text/JSON artifacts.
- `node images/workflow.js TFT.md`: render the current Markdown guide and split images into `output/`.
- `npm test`: currently a placeholder that exits with an error; do not rely on it as validation.

## Coding Style & Naming Conventions
Use ESM syntax (`import`/`export`), 2-space indentation, semicolons, and small single-purpose scripts. Prefer descriptive camelCase for functions and variables, and verb-led file names such as `fetchSingleComp.js` or `splitImageSmart.js`. Keep configuration constants near the top of each script and use relative paths consistently.

## Communication Rules
Unless the user explicitly requests another language, respond in Chinese in issues, pull requests, review comments, and contributor-facing documentation updates.

## Testing Guidelines
There is no automated test suite yet. Validate changes by running the affected script with a real sample input and checking the generated artifacts in `scraper/data/`, `TFT.txt`, or `output/`. When adding reusable logic, favor functions that can later be covered by Node-based tests.

## Commit & Pull Request Guidelines
Recent history contains minimal messages such as `1` plus merge commits, so contributors should raise the bar. Use short imperative commit subjects like `Add TFTips section parsing` or `Fix image split cleanup`. PRs should include:

- a clear summary of changed workflow steps
- linked issue or context
- sample input URL or file used for verification
- before/after screenshots when image output changes

## Security & Configuration Tips
Keep secrets in `.env` only and do not commit populated credentials. Scrapers use Puppeteer against third-party sites, so preserve rate limits, timeouts, and existing delays in `scraper/config.js` unless there is a concrete reason to change them.
