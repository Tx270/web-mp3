const fs = require("fs");
const NodeID3 = require("node-id3");


function getCover(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error("Plik nie istnieje."));
        }

        const tags = NodeID3.read(filePath);
        if (tags.image && tags.image.imageBuffer) {
            resolve({
                mime: tags.image.mime,
                data: tags.image.imageBuffer,
            });
        } else {
            reject(new Error("Brak okładki."));
        }
    });
}

module.exports = getCover;