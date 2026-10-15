# SideHustle AI Studio

A polished, local-first AI writing assistant for freelancers, creators, and small businesses. It drafts product listings, social captions, and client messages using an open-weight model served locally by [Ollama](https://ollama.com).

## Why this fits the Side Hustle theme

- **Useful and specific:** helps small sellers and freelancers get through repetitive writing tasks.
- **Open-weight AI at the core:** generation is done by a model running locally through Ollama, not by hardcoded example outputs or a hosted proprietary API.
- **Privacy-first by design:** prompts are sent from the local Node server to Ollama on `127.0.0.1`. They are not sent to a hosted model provider by this app.
- **No per-request API charge:** once the model is downloaded, local inference does not require a paid model API. The user's device still consumes electricity and needs enough memory/compute.
- **Model choice:** select another model by setting `OLLAMA_MODEL` when starting the server.
- **Built with web basics:** HTML, CSS, browser JavaScript, and a small Node.js server with no npm dependencies.

## Features

- Three tools: product listing, social caption, and client message
- Tone and length options
- Character counter, clear action, copy draft action, loading and error states
- Responsive layout for desktop and mobile
- Local model health check
- No account, database, analytics, or cloud AI key required

## Requirements

- Node.js 18 or newer
- Ollama installed: https://ollama.com
- A model downloaded in Ollama. The default is `llama3.2`; check the model's current hardware requirements before downloading.

## Run locally

1. Install and open Ollama.
2. In a terminal, download/start the default model:

   ```bash
   ollama run llama3.2
   ```

   Wait for the model to download if this is the first run. You can exit the interactive prompt after it starts; keep Ollama running.

3. Open a second terminal in this project folder and run:

   ```bash
   npm start
   ```

4. Open http://localhost:3000 in your browser.

If you have a different Ollama model installed, set its name when starting the server.

PowerShell:

```powershell
$env:OLLAMA_MODEL="mistral"
npm start
```

macOS/Linux:

```bash
OLLAMA_MODEL=mistral npm start
```

Make sure that model is installed first. This app expects Ollama's local API at `127.0.0.1:11434`.

## Project structure

```text
sidehustle-ai-studio/
├── index.html   # app layout and accessible controls
├── style.css    # responsive visual design
├── app.js       # UI state, form handling, copy action, API calls
├── server.js    # local static server and Ollama API bridge
├── package.json
└── README.md
```

## Architecture

Browser UI → local Node.js server → Ollama local API → open-weight model → draft returned to browser.

The Node server binds to `127.0.0.1` so it is intended for use on the same machine. Do not expose this development server to a public network without adding authentication, request limits, and appropriate security controls.

## Known limitations

- Output quality depends on the selected model and your hardware.
- The app generates drafts, not verified business, legal, or product claims. Review outputs before publishing.
- The app does not currently save drafts after refreshing the page.
- The Google Fonts import in `style.css` is optional visual polish; if offline, the page falls back to system sans-serif fonts. Model inference itself is local once the model is installed.

## Next steps

- Add export to `.txt` and saved draft history
- Add Hindi and other language modes
- Add editable brand voice presets
- Add a simple local feedback/evaluation set to compare models
- Test with a real freelancer or small seller and record honest feedback

## Submission note

Do not claim you have a first user, paying customer, or measured business result unless you have actually tested it. A good next step is to let one local seller or freelancer try the tool, ask what they would pay for, and include their real feedback in your project post.
