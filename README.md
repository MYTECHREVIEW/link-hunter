# Link Hunter 🔗

**jDownloader URL Scraper** — Paste a URL, grab all download links, send them straight to jDownloader.

## Features
- Scrapes 60+ file types: archives, video, audio, documents, software, torrents
- Filter by category and keyword
- Checkbox multi-select
- **Copy to jDownloader** — copies selected URLs (newline-separated) to clipboard → paste into jDownloader's *Add Links* dialog
- **Save .txt** — download a text file with all selected URLs

## Quick Start

```bash
npm install
npm start
```

Open [http://localhost:3100](http://localhost:3100)

## Usage in jDownloader
1. Scan a URL in Link Hunter
2. Select the files you want
3. Click **📋 Copy to jDownloader**
4. In jDownloader: **Linkgrabber → Add Links** → paste (Ctrl/Cmd + V) → click OK

## Port
Default port is `3100`. Override with `PORT=xxxx npm start`.
