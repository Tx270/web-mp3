export default class UIManager {
    constructor(Player) {
        this.Player = Player;
    }

    showLoader() {
        document.getElementById("loader").style.display = "flex";
    }
    
    hideLoader() {
        document.getElementById("loader").style.display = "none";
    }

    openTab(evt, tabName) {
        Array.from(document.getElementsByClassName("tab-content")).forEach(content => {
            content.style.display = "none";
        });
    
        Array.from(document.getElementsByClassName("tab-button")).forEach(button => {
            button.className = button.className.replace(" active", "");
        });
    
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.classList.add("active");

        switch (tabName) {
            case "Search":
                document.getElementById("searchBox").value = "";
                document.getElementById("searchResults").innerText = "";
                break;
            case "Library":
                document.querySelectorAll("#Library .artist").forEach(artist => {
                    artist.open = false;
                });
                break;
            case "Playlists":
                document.querySelectorAll("#Playlists .playlist").forEach(playlist => {
                    playlist.open = false;
                });
        }
    }

    search(query) {
        if (!query) {
            document.getElementById("searchResults").innerHTML = '';
            return;
        }
    
        query = query.toLowerCase();
        let filteredLibrary = {};
    
        for (let artist in this.Player.library) {
            let filteredAlbums = {};
    
            for (let album in this.Player.library[artist]) {
                let filteredSongs = this.Player.library[artist][album].filter(song => 
                    song.name.toLowerCase().includes(query) ||
                    song.artist.toLowerCase().includes(query) ||
                    song.dirArtist.toLowerCase().includes(query) ||
                    song.album.toLowerCase().includes(query)
                );
    
                if (filteredSongs.length > 0) {
                    filteredAlbums[album] = filteredSongs;
                }
            }
    
            if (Object.keys(filteredAlbums).length > 0) {
                filteredLibrary[artist] = filteredAlbums;
            }
        }
    
        if (Object.keys(filteredLibrary).length !== 0)
            this.Player.libraryManager.render(document.getElementById("searchResults"), filteredLibrary);
        else 
            document.getElementById("searchResults").innerText = "No songs matching query";
    
        document.querySelectorAll("#searchResults .selectable").forEach(span => {
            span.addEventListener("mousedown", (event) => {
                document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected")); 
                event.target.classList.add("selected");
            });
        });
    
        if (document.querySelectorAll("#searchResults .artist").length > 3) return;
    
        document.querySelectorAll("#searchResults .artist").forEach(artist => {
            artist.open = true;
            artist.querySelectorAll('.album').forEach(album => {
                if (album.querySelectorAll('.song').length < 4) {
                    album.open = true;
                }
            });
        });
    }

    goToArtist(query = this.Player.rightClickedObject.artist) {
        document.getElementById('SearchButton').click();
        document.getElementById('searchBox').value = query;
        this.search(query);
    }
    
    goToAlbum(query = this.Player.rightClickedObject.album) {
        document.getElementById('SearchButton').click();
        document.getElementById('searchBox').value = query;
        this.search(query);
    }

    contextmenu(e, id, x, y) {
        e.preventDefault();
    
        document.getElementById("context-menus").querySelectorAll(":scope > div").forEach(m => {
            m.style.display = "none";
        });
        
        let menu = document.getElementById(id);
    
        menu.style.display = "block";
        
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
    
        let menuWidth = menu.offsetWidth;
        let menuHeight = menu.offsetHeight;
    
        let posX = x || e.pageX;
        let posY = y || e.pageY;
    
        if (posX + menuWidth > windowWidth) {
            posX -= menuWidth;
        }
    
        if (posY + menuHeight > windowHeight) {
            posY -= menuHeight;
        }
    
        menu.style.left = `${posX}px`;
        menu.style.top = `${posY}px`;
    
        try {
            this.Player.rightClickedObject = JSON.parse(e.target.closest('tr').getAttribute("data-song"));
            this.Player.rightClickedObject.element = e.target.closest('tr');
        } catch {
            try {
                this.Player.rightClickedObject = { artist: e.target.closest('summary').innerText, target: e.target.closest('summary') };
            } catch {
                this.Player.rightClickedObject = { 
                    name: e.target.closest('span').innerText, 
                    target: e.target.closest('span'), 
                    artist: e.target.closest('span').parentNode.parentNode.querySelectorAll("summary")[0].innerText 
                };
            }
        }
    }

    addListeners() {
        document.querySelectorAll(".selectable").forEach(span => {
            if (!span.classList.contains("link")) {
                span.addEventListener("mousedown", (event) => {
                    if (event.target.closest(".selectable") === span) {
                        document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected")); 
                        span.classList.add("selected");
                    }
                });
            }
        });
    
        document.addEventListener("click", (event) => {
            if (!event.target.classList.contains("selectable") && event.target.nodeName !== "TD" && !event.target.classList.contains("contextbtn")) {
                document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected"));
            }
        });
    
        document.addEventListener("keydown", (event) => {
            if (event.key === " " && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
                event.preventDefault();
                this.Player.audioManager.toggle();
            }
        });
    
        document.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) this.Player.audioManager.previous();
        });
    
        document.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) this.Player.audioManager.next();
        });
    
        document.addEventListener("click", (e) => {
            if (!e.target.classList.contains("contextbtn")) {
                document.getElementById("context-menus").querySelectorAll(":scope > div").forEach(menu => {
                    menu.style.display = "none";
                });
            }
        });
    
        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });


        document.getElementById('searchBox').addEventListener('input', () => {
            this.Player.uiManager.search(this.value);
        });
        document.getElementById('cancelSearch').addEventListener('click', () => {
            document.getElementById('searchBox').value = '';
            document.getElementById('searchResults').innerText = '';
        });
        document.getElementById('shuffle').addEventListener('click', () => {
            this.Player.queueManager.shuffle();
        });
        document.getElementById('back').addEventListener('click', () => {
            this.Player.audioManager.previous();
        });
        document.getElementById('play').addEventListener('click', () => {
            this.Player.audioManager.toggle();
        });
        document.getElementById('stop').addEventListener('click', () => {
            this.Player.audioManager.stop();
        });
        document.getElementById('next').addEventListener('click', () => {
            this.Player.audioManager.next();
        });
        document.getElementById('clear').addEventListener('click', () => {
            this.Player.queueManager.clear();
        });
    
        document.getElementById('progress').addEventListener('input', () => {
            this.Player.audioManager.time();
        });
    
        document.getElementById('volumeRange').addEventListener('input', () => {
            this.Player.audioManager.volume();
        });
    
        document.getElementById('details').addEventListener('click', () => {
            if (!this.Player.nowPlaying.blank) this.Player.apiManager.getArtistDetails();
        });
    
        document.getElementById('lyrics').addEventListener('click', () => {
            if (!this.Player.nowPlaying.blank) this.Player.apiManager.getSongLyrics();
        });
    
        document.getElementById('mute').addEventListener('click', () => {
            this.Player.audioManager.mute();
        });
    
        document.getElementById('tab-buttons').querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', event => {
                const targetTab = event.target.textContent;
                this.Player.uiManager.openTab(event, targetTab);
            });
        });        
    
        document.getElementById('removeFromQueue').addEventListener('click', () => {
            this.Player.queueManager.removeSong();
        });
    
        document.getElementById('goToArtist').addEventListener('click', () => {
            this.Player.uiManager.goToArtist();
        });
    
        document.getElementById('goToAlbum').addEventListener('click', () => {
            this.Player.uiManager.goToAlbum();
        });
    
        document.getElementById('showInExplorer').addEventListener('click', () => {
            this.Player.utils.openPath(this.Player.rightClickedObject.path);
        });
    
        document.getElementById('artistDetails').addEventListener('click', () => {
            this.Player.apiManager.getArtistDetails();
        });
    
        document.getElementById('songLyrics').addEventListener('click', () => {
            this.Player.apiManager.getSongLyrics();
        });
    
        document.getElementById('addToQueue').addEventListener('click', () => {
            this.Player.utils.dbClickThis(this.Player.rightClickedObject.target);
        });
    
        document.getElementById('artistDetailsLibrary').addEventListener('click', () => {
            this.Player.apiManager.getArtistDetails();
        });
    
        document.getElementById('addToQueueAlbum').addEventListener('click', () => {
            this.Player.utils.dbClickThis(this.Player.rightClickedObject.target);
        });
    
        document.getElementById('addToQueueSong').addEventListener('click', () => {
            this.Player.utils.dbClickThis(this.Player.rightClickedObject.target);
        });
    
        document.getElementById('showInExplorerSong').addEventListener('click', () => {
            this.Player.utils.openPath(this.Player.rightClickedObject.path);
        });
    
        document.getElementById('songLyricsSong').addEventListener('click', () => {
            this.Player.apiManager.getSongLyrics();
        });
    
        document.getElementById('addToQueuePlaylist').addEventListener('click', () => {
            this.Player.utils.dbClickThis(this.Player.rightClickedObject.target);
        });
    
        document.getElementById('removePlaylist').addEventListener('click', () => {
            this.Player.playlistManager.removePlaylist(this.Player.rightClickedObject.artist);
        });
    
        document.getElementById('addToQueuePlaylistSong').addEventListener('click', () => {
            this.Player.utils.dbClickThis(this.Player.rightClickedObject.target);
        });
    
        document.getElementById('removeFromPlaylist').addEventListener('click', () => {
            this.Player.playlistManager.removeSong(this.Player.rightClickedObject.target.parentElement.querySelector('summary').textContent, this.Player.rightClickedObject.target.dataset.name);
        });
    
        document.getElementById('goToArtistPlaylist').addEventListener('click', () => {
            this.Player.uiManager.goToArtist(this.Player.rightClickedObject.target.dataset.artist);
        });
    
        document.getElementById('goToAlbumPlaylist').addEventListener('click', () => {
            this.Player.uiManager.goToAlbum(this.Player.rightClickedObject.target.dataset.album);
        });
    
        document.getElementById('artistDetailsPlaylist').addEventListener('click', () => {
            this.Player.apiManager.getArtistDetails(this.Player.rightClickedObject.target.dataset.artist, this.Player.rightClickedObject.target.dataset.dirArtist);
        });
    
        document.getElementById('songLyricsPlaylist').addEventListener('click', () => {
            this.Player.apiManager.getSongLyrics(this.Player.rightClickedObject.target.dataset.artist, this.Player.rightClickedObject.target.dataset.name);
        });
    
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (event) => {
                const dialog = event.target.closest('dialog');
                dialog.close();
            });
        });
    
        document.getElementById('newPlaylistForm').addEventListener('submit', (event) => {
            this.Player.playlistManager.validateNewPlaylistForm(event);
        });
    
        document.getElementById('playlistCoverInp').addEventListener('change', () => {
            this.Player.playlistManager.validateCover();
        });
    
        document.getElementById('playlistNameInp').addEventListener('input', () => {
            this.Player.playlistManager.validateName();
        });
    }
}
