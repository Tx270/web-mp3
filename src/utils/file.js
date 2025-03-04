const fs = require('fs');
const path = require("path");


function fileRead(file, res) {
    const filePath = path.join(__dirname, "..", "..", "data", file);

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ error: "Couldn't find the file." });
            }
            return res.status(500).json({ error: "Failed to read the file" });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            res.status(500).json({ error: "JSON parsing error." });
        }
    });
}

function fileWrite(file, data, res) {
    const filePath = path.join(__dirname, "..", "..", "data", file);

    if (typeof data !== "object") {
        return res.status(400).json({ error: "Invalid playlists format." });
    }

    fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8", (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to save file." });
        }
        res.json({ message: "File saved successfully." });
    });
}

module.exports = { fileRead, fileWrite };