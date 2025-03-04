require('dotenv').config();
const express = require("express");
const getLibrary = require("./utils/scan");
const path = require("path");
const fs = require('fs');

const app = express();
app.use(express.json());


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

app.get("/api/playlists", (req, res) => {
    const filePath = path.join(__dirname, "..", "data", "playlists.json");

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ error: "Couldn't find the playlists file." });
            }
            return res.status(500).json({ error: "Failed to read the playlists." });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            res.status(500).json({ error: "Playlists JSON parsing error." });
        }
    });
});

app.post("/api/playlists", (req, res) => {
    const playlists = req.body;
    const filePath = path.join(__dirname, "..", "data", "playlists.json");

    if (typeof playlists !== "object") {
        return res.status(400).json({ error: "Invalid playlists format." });
    }

    fs.writeFile(filePath, JSON.stringify(playlists, null, 2), "utf8", (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to save playlists." });
        }
        res.json({ message: "Playlists saved successfully." });
    });
});

app.use(express.static(path.join(__dirname, '..', 'public')));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});