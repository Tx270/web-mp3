export default class LibraryManager {
    constructor(Player) {
        this.Player = Player;
    }

    async load() {
        try {
            const response = await fetch('/api/library');
            this.Player.library = await response.json();
            var letter = "`";
    
            const container = document.getElementById('Library');
    
            this.render(container, this.Player.library, letter);
    
        } catch (error) {
            this.Player.notificationManager.show('Error loading mp3 library: ' + error.message, true);
            document.getElementById('sidebar').innerHTML = 'Error loading mp3 library: <br>' + error;
        }
    }

    render(container, lib, letter = '') {
        container.innerHTML = '';
        let first = true;
    
        if (!lib) return;
    
        Object.entries(lib).forEach(([artist, albums]) => {
            if (letter && artist[0].toLowerCase() !== letter) {
                letter = String.fromCharCode(letter.charCodeAt(0) + 1);
                var s = document.createElement('span');
                s.innerText = letter.toUpperCase();
                s.classList.add("braker");
                if (first) {
                    first = false;
                    s.style.marginTop = "0";
                }
                container.appendChild(s);
                container.appendChild(document.createElement('hr'));
            }
    
            const artistDetails = document.createElement('details');
            artistDetails.classList.add('artist');
    
            const artistSummary = document.createElement('summary');
            artistSummary.classList.add('selectable');
            artistSummary.textContent = artist;
            artistSummary.title = artist;
            artistSummary.dataset.menu = "libraryArtistMenu";
            artistSummary.classList.add("custom-context");
            artistSummary.addEventListener("contextmenu", (e) => { this.Player.uiManager.contextmenu(e, artistSummary.getAttribute("data-menu")); });
            artistSummary.ondblclick = () => { this.Player.queueManager.addSong(Object.entries(albums).flat(Infinity)); };
    
            artistDetails.appendChild(artistSummary);
    
            Object.entries(albums).forEach(([album, songs]) => {
                const albumDetails = document.createElement('details');
                albumDetails.classList.add('album');
    
                const albumSummary = document.createElement('summary');
                albumSummary.classList.add('selectable');
                albumSummary.textContent = album;
                albumSummary.title = album;
                albumSummary.dataset.menu = "libraryAlbumMenu";
                albumSummary.classList.add("custom-context");
                albumSummary.addEventListener("contextmenu", (e) => { this.Player.uiManager.contextmenu(e, albumSummary.getAttribute("data-menu")); });
                albumSummary.ondblclick = () => { this.Player.queueManager.addSong(songs); };
    
                const albumCover = document.createElement('img');
                albumCover.classList.add("albumCover");
                albumCover.src = songs[0].cover;
    
                albumSummary.prepend(albumCover);
                albumDetails.append(albumSummary);
    
                songs.forEach(song => {
                    const songSpan = document.createElement('span');
                    songSpan.classList.add('song', 'selectable');
                    songSpan.textContent = song.name;
                    songSpan.title = song.name;
                    songSpan.dataset.menu = "librarySongMenu";
                    songSpan.classList.add("custom-context");
                    songSpan.addEventListener("contextmenu", (e) => { this.Player.uiManager.contextmenu(e, songSpan.getAttribute("data-menu")); });
    
                    songSpan.ondblclick = () => { this.Player.queueManager.addSong([song]); };
                    songSpan.dataset.song = JSON.stringify(song);
    
                    albumDetails.appendChild(songSpan);
                });
    
                artistDetails.appendChild(albumDetails);
            });
    
            artistDetails.addEventListener('toggle', () => {
                if (artistDetails.open && Object.entries(albums).length === 1) {
                    artistDetails.querySelector('.album').open = true;
                } else if (!artistDetails.open) {
                    artistDetails.querySelectorAll('.album').forEach(album => {
                        album.style.transition = 'none';
                        album.open = false;
                        void album.offsetHeight;
                        album.style.transition = '';
                    });
                }
            });
    
            container.appendChild(artistDetails);
        });
    }
}