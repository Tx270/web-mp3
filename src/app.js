require('dotenv').config();
const express = require("express");
const getLibrary = require("./utils/scan");
const removeUnusedCovers = require("./utils/removeUnusedCovers");
const { fileRead, fileWrite } = require("./utils/file");
const path = require("path");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
const playlistCoverUpload = multer({ dest: path.join(__dirname, '..', 'public', 'assets', 'playlistCovers') });


app.get('/api/scan', async (req, res) => {
    try {
        const library = await getLibrary(path.join(__dirname, '..', 'public', 'mp3'));
        const libraryJson = JSON.stringify(library, null, 2);

        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(path.join(__dirname, '..', 'data', 'library.json'), libraryJson, 'utf8');
        
        res.status(200).json({ message: 'Library info saved successfully' });
    } catch (error) {
        console.error('Error saving library info:', error);
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
    removeUnusedCovers(req.body);
    return fileWrite("playlists.json", req.body, res);
});

app.get("/api/queue", (req, res) => {
    return fileRead("queue.json", res);
});

app.post("/api/queue", (req, res) => {
    return fileWrite("queue.json", req.body, res);
});

app.post("/api/open", (req, res) => {
    const normalizedPath = path.dirname(path.resolve(req.body.path));
        
    let command;
    if (process.platform === "win32") {
        command = `explorer "${normalizedPath}"`;
    } else if (process.platform === "darwin") {
        command = `open "${normalizedPath}"`;
    } else {
        command = `xdg-open "${normalizedPath}"`;
    }
    
    exec(command, (error) => {
        if (error) {
            console.error("Error opening folder:", error.message);
            return res.status(500).json({ error: 'Failed to open folder', details: error.message });
        }
        res.status(200).json({ message: 'Folder opened successfully' });
    });
});

app.post("/api/playlistCover", playlistCoverUpload.single("cover"), (req, res) => {
    if (!req.file) return res.json({ success: false, message: "No file uploaded" });

    const fileExt = path.extname(req.file.originalname);
    const newFileName = req.file.filename + fileExt;
    const newPath = path.join(req.file.destination, newFileName);

    require("fs").rename(req.file.path, newPath, (err) => {
        if (err) return res.json({ success: false, message: "File rename error" });

        res.json({ success: true, path: "/assets/playlistCovers/" + newFileName });
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });