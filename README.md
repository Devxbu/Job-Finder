# JobFound

Automated job outreach tool that:

- **Fetches job listings** via Bright Data Dataset API.
- **Generates tailored outreach messages** using Groq LLM.
- **Sends LinkedIn messages** to target profiles using Puppeteer automation.
- **Logs found jobs** into `job_details.json`.


## Tech Stack

- **Node.js** (CLI)
- **Axios** for HTTP requests
- **Puppeteer** for LinkedIn automation
- **Groq SDK** for LLM text generation
- **dotenv** for config management


## Features

- **Robust Bright Data fetcher** with retries, snapshot polling, and NDJSON handling.
- **Streaming LLM generation** for message bodies (Groq `llama-3.1-8b-instant`).
- **LinkedIn messaging** with login, profile visit, lazy-load handling, and message send.
- **Batch sending** with delay to reduce rate-limit risks.


## Requirements

- Node.js 18+ recommended.
- Bright Data account and Dataset ID access used by this project.
- Groq API key for LLM generation.
- LinkedIn credentials for automation.


## Environment Variables

Create a `.env` from `.env.example` and fill in values:

- `GROQ_API_KEY` (required for message generation)
- `LINKEDIN_EMAIL` (required)
- `LINKEDIN_PASSWORD` (required)
- `BRIGHTDATA_API_KEY` (required for job fetch)
- `CHROME_USER_DATA_DIR` (optional, currently not used by code)

Example:

```
cp .env.example .env
# then edit .env
```


## Installation

```
npm install
```


## Usage

There is a single script that runs the workflow end-to-end.

```
# Uses default arguments hard-coded in main.js
npm run main
```

To customize the search, edit the `main()` call at the bottom of `main.js`:

```
main(
  location,
  keyword,
  country,
  time_range,        // e.g., "Past 24 hours", "Past week", "Past month"
  job_type,          // e.g., "Full-time", "Part-time"
  experience_level,  // e.g., "Entry level", "Mid-Senior"
  remote,            // e.g., "Remote", "On-site", "Hybrid"
  company,
  location_radius    // e.g., "50 mi"
);
```

The script will:

- **Fetch** jobs via Bright Data using the parameters above.
- **Append** normalized job entries to `job_details.json`.
- **Generate** a personalized message for each job via Groq.
- **Send** LinkedIn messages to each `profileUrl` in sequence.


## Data Outputs

- `job_details.json`: Array of job objects appended per run.


## Notes on LinkedIn Automation

- The flow logs in interactively. If LinkedIn presents a checkpoint/CAPTCHA, the script waits up to 10 minutes for you to complete it in the browser window.
- Default Puppeteer launch is non-headless (`headless = false` inside `sendLinkedInMessage` call). Adjust in code if you want headless.
- UI selectors on LinkedIn change occasionally; the script tries multiple selectors, but failures can still occur.


## Troubleshooting

- "BRIGHTDATA_API_KEY is not set" → Add it to `.env`.
- "GROQ_API_KEY is not set" → Add it to `.env`.
- LinkedIn "checkpoint" or CAPTCHA → Complete it manually in the opened browser.
- Send button/input not found → UI may have changed; update selectors in `utils/sendMessage.js`.
- Timeouts on Bright Data → The client already retries with backoff; re-run later or check dataset status/limits.


## Scripts

- `npm run main` → Executes `node main.js`.


## Project Structure

```
jobFound/
├─ main.js                 # Orchestrates fetch → generate → send flow
├─ job_details.json        # Output log of found jobs
├─ utils/
│  ├─ searchJobs.js        # Bright Data fetcher with retries & parsing
│  ├─ generateText.js      # Message generation via Groq (streaming)
│  ├─ sendMessage.js       # LinkedIn automation via Puppeteer
│  └─ sendMail.js          # (present, not used by main.js)
├─ .env.example            # Template for required environment variables
├─ package.json            # Dependencies & scripts
└─ todos.md                # Small internal TODO list
```


## Security & Compliance

- Store secrets only in `.env` (never commit real secrets).
- LinkedIn automation may violate LinkedIn Terms of Service. Use responsibly and at your own risk.
- Rate limits and account restrictions can apply; adjust delays and volume accordingly.


## License

ISC © devxbu
