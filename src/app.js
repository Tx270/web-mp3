require('dotenv').config();
const express = require("express");
const getCover = require("./utils/cover");
const getLibrary = require("./utils/scan");
const path = require("path");
const fs = require('fs');

const app = express();


app.get("/api/cover", async (req, res) => {
    if (!req.query.file) {
        return res.status(400).json({ error: "Brak ścieżki do pliku MP3." });
    }

    const filePath = path.join(__dirname, '..', 'public', req.query.file);

    try {
        const cover = await getCover(filePath);
        res.setHeader("Content-Type", cover.mime);
        res.send(cover.data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.get('/api/scan', async (req, res) => {
    try {
        const library = await getLibrary(path.join(__dirname, '..', 'public', 'mp3'));
        const libraryJson = JSON.stringify(library, null, 2);
        fs.writeFileSync(path.join(__dirname, '..', 'data', 'library.json'), libraryJson, 'utf8');
        res.status(200).json({ message: 'Library info saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save library info' });
    }
});

app.get("/api/library", (req, res) => {
    const filePath = path.join(__dirname, "..", "data", "library.json");

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ error: "Couldn't find the library file. Use scan to generate it." });
            }
            return res.status(500).json({ error: "Failed to read the library" });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            res.status(500).json({ error: "Library JSON parsing error." });
        }
    });
});


app.use(express.static(path.join(__dirname, '..', 'public')));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});