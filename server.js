/**
 * Link Hunter — Express Backend
 * POST /api/scrape  → fetch a URL and extract all download links
 * GET  /api/health  → health check
 */

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3100;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── File-extension categories ─────────────────────────────────────────────────
const EXT_MAP = {
    archive: ['zip', 'rar', '7z', 'gz', 'tar', 'bz2', 'xz', 'zst', 'cab', 'deb', 'rpm', 'pkg', 'dmg', 'iso'],
    video: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp', 'ts', 'vob'],
    audio: ['mp3', 'flac', 'aac', 'ogg', 'wav', 'm4a', 'wma', 'opus', 'aiff'],
    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'epub', 'mobi', 'azw3', 'djvu'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico'],
    software: ['exe', 'msi', 'apk', 'ipa', 'appimage', 'run', 'sh', 'bat', 'ps1'],
    torrent: ['torrent', 'magnet'],
    other: ['bin', 'dat', 'img', 'nfo', 'srt', 'sub', 'ass', 'nzb']
};

const ALL_EXTS = new Set(Object.values(EXT_MAP).flat());

function getCategory(ext) {
    for (const [cat, exts] of Object.entries(EXT_MAP)) {
        if (exts.includes(ext)) return cat;
    }
    return 'other';
}

function resolveUrl(base, href) {
    try {
        if (!href || href.startsWith('javascript:') || href.startsWith('mailto:')) return null;
        if (href.startsWith('magnet:')) return href;
        return new URL(href, base).href;
    } catch { return null; }
}

// ── POST /api/scrape ──────────────────────────────────────────────────────────
app.post('/api/scrape', async (req, res) => {
    const { url, include_all = false } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided.' });

    let html;
    try {
        const resp = await axios.get(url, {
            timeout: 15000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,*/*'
            },
            responseType: 'text'
        });
        html = resp.data;
    } catch (err) {
        return res.status(502).json({ error: `Failed to fetch URL: ${err.message}` });
    }

    const $ = cheerio.load(html);
    const seen = new Set();
    const links = [];

    $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim() || $(el).attr('title') || '';
        const hasDownloadAttr = el.attribs.hasOwnProperty('download');
        const abs = resolveUrl(url, href);
        if (!abs || seen.has(abs)) return;

        // Determine extension
        let ext = '';
        try {
            const pathname = new URL(abs).pathname;
            const parts = pathname.split('.');
            if (parts.length > 1) ext = parts.pop().toLowerCase().split('?')[0];
        } catch { }

        const isDownload = ALL_EXTS.has(ext) || hasDownloadAttr || href.startsWith('magnet:');
        if (!isDownload && !include_all) return;

        seen.add(abs);
        links.push({
            url: abs,
            text: text.substring(0, 120),
            ext: ext || 'link',
            category: getCategory(ext),
            filename: abs.split('/').pop().split('?')[0] || abs
        });
    });

    res.json({ links, count: links.length, source: url });
});

// ── GET /api/health ───────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
    console.log(`\n🔗 Link Hunter → http://localhost:${PORT}\n`);
});
