export default class PlaylistManager {
    constructor(Player) {
        this.Player = Player;
    }

    async load() {
        try {
            const response = await fetch("/api/playlists");
            if (!response.ok) throw new Error("Failed to load playlists");
            this.Player.playlists = await response.json();
        } catch (error) {
            this.Player.notificationManager.show("Error loading playlists: " + error.message, true);
            this.Player.playlists = {};
        }
        this.render();
    }

    render() {
        var openedPlaylists = [];
        document.querySelectorAll("#Playlists summary").forEach(summary => {
            if (summary.parentElement.open) {
                openedPlaylists.push(summary.textContent);
            }
        });

        const container = document.getElementById('Playlists');
        container.innerHTML = '';

        var p = Object.keys(this.Player.playlists);
        p.sort();

        p.forEach(playlist => {
            const playlistDetails = document.createElement('details');
            playlistDetails.classList.add('playlist');

            const playlistSummary = document.createElement('summary');
            playlistSummary.classList.add('selectable');
            playlistSummary.textContent = playlist;
            playlistSummary.title = playlist;
            playlistSummary.dataset.menu = "playlistMenu";
            playlistSummary.classList.add("custom-context", "playlist");

            playlistSummary.addEventListener("contextmenu", (e) => { 
                this.Player.uiManager.contextmenu(e, playlistSummary.dataset.menu);
            });

            playlistSummary.ondblclick = () => { 
                try { 
                    this.Player.queueManager.addSong(this.Player.playlists[playlist].songs);
                } catch { 
                    this.Player.nowPlaying = { blank: true };
                }
            };

            const playlistCover = document.createElement('img');
            playlistCover.classList.add("playlistCover");
            playlistCover.src = this.Player.playlists[playlist].cover;

            playlistSummary.prepend(playlistCover);
            playlistDetails.append(playlistSummary);

            playlistSummary.addEventListener("mousedown", (event) => {
                if (event.target.closest(".selectable") === playlistSummary) {
                    document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected"));
                    playlistSummary.classList.add("selected");
                }
            });

            this.Player.playlists[playlist].songs.forEach(song => {
                const songSpan = document.createElement('span');
                songSpan.classList.add('song', 'selectable');
                songSpan.textContent = song.name;
                songSpan.title = song.name;
                songSpan.dataset.menu = "playlistSongMenu";
                songSpan.classList.add("custom-context");
                songSpan.dataset.album = song.album;
                songSpan.dataset.artist = song.artist;
                songSpan.dataset.dirArtist = song.dirArtist;
                songSpan.dataset.name = song.name;

                songSpan.addEventListener("contextmenu", (e) => { 
                    this.Player.uiManager.contextmenu(e, songSpan.dataset.menu);
                });

                songSpan.ondblclick = () => { 
                    this.Player.queueManager.addSong([song]);
                };

                songSpan.addEventListener("mousedown", (event) => {
                    if (event.target.closest(".selectable") === songSpan) {
                        document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected"));
                        songSpan.classList.add("selected");
                    }
                });

                const artistSpan = document.createElement('span');
                artistSpan.textContent = song.artist;
                artistSpan.title = song.artist;
                artistSpan.classList.add("artistSpan");

                songSpan.append(artistSpan);
                playlistDetails.append(songSpan);
            });

            container.append(playlistDetails);
        });

        const addContainer = document.createElement('div');
        addContainer.id = "addPlaylist";
        const addPlaylist = document.createElement('img');
        addPlaylist.src = "assets/icons/add.png";
        addPlaylist.title = "Add playlist";
        addPlaylist.onclick = () => { 
            document.getElementById('newPlaylistDialog').showModal(); 
        };

        addContainer.append(addPlaylist);
        container.append(addContainer);

        document.querySelectorAll("#Playlists summary").forEach(summary => {
            if (openedPlaylists.includes(summary.textContent)) {
                summary.parentElement.open = true;
            }
        });
    }
    
    async addPlaylist(name, cover) {
        if (!this.Player.playlists[name]) {
            this.Player.playlists[name] = {
                cover: cover,
                songs: []
            };
            await this.save();
            this.Player.notificationManager.show(`Playlist ${name} created successfully`, false, cover);
        } else {
            this.Player.notificationManager.show("Playlist of that name already exists", true);
        }
    }

    async addSong(playlistName, song) {
        if (this.Player.playlists[playlistName]) {
            this.Player.playlists[playlistName].songs.push(song);
            await this.save();
            this.Player.notificationManager.show(`Song added to playlist ${playlistName}`, false, this.Player.playlists[playlistName].cover);
        } else {
            this.Player.notificationManager.show("Playlist not found", true);
        }
    }

    async removePlaylist(name) {
        if (this.Player.playlists[name]) {
            let cover = this.Player.playlists[name].cover;
            delete this.Player.playlists[name];
            await this.save();
            this.Player.notificationManager.show(`Playlist ${name} removed successfully`, false, cover);
        } else {
            this.Player.notificationManager.show("Playlist not found", true);
        }
    }

    async removeSong(playlistName, songName) {
        if (this.Player.playlists[playlistName]) {
            this.Player.playlists[playlistName].songs = this.Player.playlists[playlistName].songs.filter(song => song.name !== songName);
            await this.save();
            this.Player.notificationManager.show(`Song removed from playlist ${playlistName}`, false, this.Player.playlists[playlistName].cover);
        } else {
            this.Player.notificationManager.show("Playlist not found", true);
        }
    }

    async save() {
        this.updateContext();
        this.render();

        try {
            await fetch("/api/playlists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.Player.playlists)
            });
        } catch (error) {
            this.Player.notificationManager.show(`Error saving playlists: ${error.message}`, true);
        }
    }

    updateContext() {
        document.querySelectorAll(".playlistSubmenu").forEach(submenu => {
            submenu.innerHTML = "";

            if (Object.keys(this.Player.playlists).length === 0 || !this.Player.playlists) {
                submenu.style.visibility = "hidden";
                return;
            } else {
                submenu.style.visibility = "visible";
            }
    
            Object.keys(this.Player.playlists).toSorted().forEach(playlist => {
                let item = document.createElement("li");
                item.textContent = playlist;
                item.onclick = () => {
                    let song;
                    try {
                        song = JSON.parse(this.Player.rightClickedObject.target.dataset.song);
                    } catch (error) {
                        song = this.Player.rightClickedObject;
                    }
                    this.addSong(playlist, song);
                };
                submenu.appendChild(item);
            });
        });
    }

    validateName() {
        const name = document.getElementById("playlistNameInp").value.trim();
        const e = document.getElementById("playlistNameInpError");

        if (!name) {
            e.innerText = "Playlist name is required";
            return false;
        } else if (this.Player.playlists[name]) {
            e.innerText = "Playlist of that name already exists";
            return false;
        } else if (name.length > 30) {
            e.innerText = "Playlist name must be shorter than 30 characters";
            return false;
        }
        e.innerText = "";
        return true;
    }

    validateCover() {
        const file = document.getElementById("playlistCoverInp").files[0];
        const e = document.getElementById("playlistCoverInpError");

        if (file) {
            if (!file.type.startsWith("image/")) {
                e.innerText = "Cover file must be an image";
                return false;
            } else if (file.size > 5 * 1024 * 1024) {
                e.innerText = "Cover file must be smaller than 5MB";
                return false;
            }
        }
        e.innerText = "";
        return true;
    }

    async validateNewPlaylistForm(e) {
        e.preventDefault();

        if (!this.validateName() || !this.validateCover()) return;

        let coverUrl = "assets/empty.svg";

        if (document.getElementById("playlistCoverInp").files.length > 0) {
            const file = document.getElementById("playlistCoverInp").files[0];
            const formData = new FormData();
            formData.append("cover", file);

            try {
                const response = await fetch("/api/playlistCover", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                if (result.success) {
                    coverUrl = result.path;
                } else {
                    this.Player.notificationManager.show("Playlist cover upload error", true);
                    document.getElementById('newPlaylistDialog').close();
                    document.getElementById("newPlaylistForm").reset();
                    return;
                }
            } catch (error) {
                this.Player.notificationManager.show(`Playlist cover upload error: ${error}`, true);
                document.getElementById('newPlaylistDialog').close();
                document.getElementById("newPlaylistForm").reset();
                return;
            }
        }

        await this.addPlaylist(document.getElementById("playlistNameInp").value.trim(), coverUrl);

        document.getElementById('newPlaylistDialog').close();
        document.getElementById("newPlaylistForm").reset();
    }
}
