const fs = require('fs');
const path = require('path');


async function removeUnusedCovers(playlists) {
    try {
        const coversDir = path.join(__dirname, '..', '..', 'public', 'assets', 'playlistCovers');

        if (!playlists || typeof playlists !== 'object') {
            return;
        }

        const coverFiles = await fs.promises.readdir(coversDir);
        
        const usedCovers = new Set(
            Object.values(playlists).map(p => path.basename(p.cover))
        );

        for (const file of coverFiles) {
            if (!usedCovers.has(file)) {
                const filePath = path.join(coversDir, file);
                await fs.promises.unlink(filePath);
            }
        }
    } catch (error) {
        console.error("Error while cleaning up covers:", error);
    }
}

module.exports = removeUnusedCovers;
