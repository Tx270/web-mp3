const fs = require('fs');
const path = require('path');
const NodeID3 = require('node-id3');
const mm = require('music-metadata');



async function getMp3Duration(filePath) {
    try {
        const metadata = await mm.parseFile(filePath);
        return metadata.format.duration || 0;
    } catch (error) {
        console.error(`Error while reading mp3 lenght: ${filePath}`, error);
        return 0;
    }
}

async function getLibrary(directory) {
    let library = {};
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
                    length: length
                });
            }
        }
    }

    return library;
}


module.exports = getLibrary;
