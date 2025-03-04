require('dotenv').config();
const express = require("express");
const getLibrary = require("./utils/scan");
const { fileRead, fileWrite } = require("./utils/file");
const path = require("path");
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));


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
    return fileRead("library.json", res);
});

app.get("/api/playlists", (req, res) => {
    return fileRead("playlists.json", res);
});

app.post("/api/playlists", (req, res) => {
    return fileWrite("playlists.json", req.body, res);
});

app.get("/api/queue", (req, res) => {
    return fileRead("queue.json", res);
});

app.post("/api/queue", (req, res) => {
    return fileWrite("queue.json", req.body, res);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });