const fs = require('fs');
const path = require('path');
const NodeID3 = require('node-id3');
const mm = require('music-metadata');
const crypto = require('crypto');

async function getMp3Duration(filePath) {
    try {
        const metadata = await mm.parseFile(filePath);
        return metadata.format.duration || 0;
    } catch (error) {
        console.error(`Error while reading mp3 length: ${filePath}`, error);
        return 0;
    }
}

function getCover(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error("File doesn't exist."));
        }

        const tags = NodeID3.read(filePath);
        if (tags.image && tags.image.imageBuffer) {
            resolve({
                mime: tags.image.mime,
                data: tags.image.imageBuffer,
            });
        } else {
            reject(new Error("No cover found."));
        }
    });
}

function clearCoversDirectory(directory) {
    if (!fs.existsSync(directory)) return;

    fs.readdirSync(directory).forEach((file) => {
        const filePath = path.join(directory, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            clearCoversDirectory(filePath);
        } else {
            fs.unlinkSync(filePath);
        }
    });
}

async function getLibrary(directory) {
    const coversDir = path.join(__dirname, '../../public/assets/covers');
    clearCoversDirectory(coversDir);
    fs.mkdirSync(coversDir, { recursive: true });

    let library = {};
    if (!fs.existsSync(directory)) return library;
    let d = fs.readdirSync(directory);
    let totalArtists = d.length;
    let currentArtist = 0;

    for (const artist of d) {
        const artistPath = path.join(directory, artist);
        if (!fs.lstatSync(artistPath).isDirectory()) continue;

        library[artist.replace(/_/g, '/')] = {};

        currentArtist++;
        console.log("Processing artist " + currentArtist + " out of " + totalArtists + ": " + artist);

        for (const album of fs.readdirSync(artistPath)) {
            const albumPath = path.join(artistPath, album);
            if (!fs.lstatSync(albumPath).isDirectory()) continue;

            library[artist.replace(/_/g, '/')][album.replace(/_/g, '/')] = [];

            let songs = fs.readdirSync(albumPath).filter(file => path.extname(file) === '.mp3');
            songs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

            let coverPath = '';
            try {
                const cover = await getCover(path.join(albumPath, songs[0]));
                const coverName = crypto.randomBytes(16).toString('hex') + path.extname(cover.mime);
                coverPath = path.join("assets", "covers", coverName);
                fs.writeFileSync(path.join(coversDir, coverName), cover.data);
            } catch (error) {
                console.error(`Error while saving cover for album ${albumPath}:`, error);
            }

            for (const song of songs) {
                const songPath = path.join(albumPath, song);
                const tags = NodeID3.read(songPath);

                let length = await getMp3Duration(songPath);
                let title = tags.title || song.replace(/_/g, '/').slice(0, -4);
                let track = song[1] === ' ' ? `0${song}` : song;
                track = track.slice(0, 2);
                
                let cleanName = song[3] === '-' ? song.slice(5) : song.slice(2);
                cleanName = cleanName.replace(/_/g, '/').slice(0, -4);
                
                let artistName = tags.artist || artist.replace(/_/g, '/');

                library[artist.replace(/_/g, '/')][album.replace(/_/g, '/')].push({
                    name: title,
                    path: `/mp3/${artist}/${album}/${song}`,
                    artist: artistName,
                    dirArtist: artist.replace(/_/g, '/'),
                    album: album.replace(/_/g, '/'),
                    track: track,
                    length: length,
                    cover: coverPath
                });
            }
        }
    }

    return library;
}

module.exports = getLibrary;