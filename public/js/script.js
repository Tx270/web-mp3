var nowPlaying = { blank: true }, rightClickedObject = {}, queue = [], volume = "1", library, playlists = {};



async function loadPlaylists() {
    try {
        const response = await fetch("/api/playlists");
        if (!response.ok) throw new Error("Failed to load playlists");
        playlists = await response.json();
    } catch (error) {
        console.error("Error loading playlists:", error);
        playlists = {};
    }
    renderPlaylists();
}

async function savePlaylists() {
    try {
        await fetch("/api/playlists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(playlists)
        });
    } catch (error) {
        console.error("Error saving playlists:", error);
    }
}

async function newPlaylist(name) {
    if (!playlists[name]) {
        playlists[name] = {
            cover: "assets/empty.svg",
            songs: []
        };
        await savePlaylists();
        renderPlaylists();
    } else {
        alert("Playlist already exists");
    }
}

async function removePlaylist(name) {
    if (playlists[name]) {
        delete playlists[name];
        await savePlaylists();
        renderPlaylists();
    } else {
        alert("Playlist not found");
    }
}

async function addToPlaylist(playlistName, song) {
    if (playlists[playlistName]) {
        playlists[playlistName].songs.push(song);
        await savePlaylists();
        renderPlaylists();
    } else {
        alert("Playlist not found");
    }
}

async function removeFromPlaylist(playlistName, songName) {
    if (playlists[playlistName]) {
        playlists[playlistName].songs = playlists[playlistName].songs.filter(song => song.name !== songName);
        await savePlaylists();
        renderPlaylists();
    } else {
        alert("Playlist not found");
    }
}

async function changePlaylistCover(playlistName, cover) {
    if (playlists[playlistName]) {
        playlists[playlistName].cover = cover;
        await savePlaylists();
        renderPlaylists();
    } else {
        alert("Playlist not found");
    }
}

async function changePlaylistName(oldName, newName) {
    if (playlists[oldName]) {
        playlists[newName] = playlists[oldName];
        delete playlists[oldName];
        await savePlaylists();
        renderPlaylists();
    } else {
        alert("Playlist not found");
    }
}

async function renderPlaylists() {
    var openedPlaylists = [];
    document.querySelectorAll("#Playlists summary").forEach(summary => {
        if (summary.parentElement.open == true) openedPlaylists.push(summary.textContent);
    });

    const container = document.getElementById('Playlists');
    container.innerHTML = '';

    var p = Object.keys(playlists);
    p.sort();

    p.forEach(playlist => {
        const playlistDetails = document.createElement('details');
        playlistDetails.classList.add('playlist');

        const playlistSummary = document.createElement('summary');
        playlistSummary.classList.add('selectable');
        playlistSummary.textContent = playlist;
        playlistSummary.title = playlist;
        playlistSummary.dataset.menu = "playlistMenu";
        playlistSummary.classList.add("custom-context");
        playlistSummary.classList.add("playlist");
        playlistSummary.addEventListener("contextmenu", (e) => { contextmenu(e, playlistSummary.getAttribute("data-menu")); });
        playlistSummary.ondblclick = function(){ try{ addToQueue(playlists[playlist].songs) } catch { nowPlaying = { blank: true }} };

        const playlistCover = document.createElement('img');
        playlistCover.classList.add("playlistCover");
        playlistCover.src = playlists[playlist].cover;

        playlistSummary.prepend(playlistCover);
        playlistDetails.append(playlistSummary);

        playlistSummary.addEventListener("mousedown", (event) => {
            if (event.target.closest(".selectable") === playlistSummary) {
                document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected"));
                playlistSummary.classList.add("selected");
            }
        });

        playlists[playlist].songs.forEach(song => {
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
            songSpan.addEventListener("contextmenu", (e) => { contextmenu(e, songSpan.getAttribute("data-menu")); });
            songSpan.ondblclick = function(){ addToQueue([song]); };

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
    addPlaylist.onclick = function(){ newPlaylist(prompt("Enter playlist name:")); }

    addContainer.append(addPlaylist);
    container.append(addContainer);

    document.querySelectorAll("#Playlists summary").forEach(summary => {
        if (openedPlaylists.includes(summary.textContent)) summary.parentElement.open = true;
    });
}

function addListeners() {
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

    document.addEventListener("keydown", function(event) {
        if (event.key === " " && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
            event.preventDefault();
            toggleAudio();
        }
    });

    document.addEventListener("keydown", function(event) {
        if (event.key === "ArrowLeft" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) previousSong();
    });

    document.addEventListener("keydown", function(event) {
        if (event.key === "ArrowRight" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) nextSong();
    });


    document.addEventListener("click", (e) => {
        if(!e.target.classList.contains("contextbtn")) {
            let menus = document.querySelectorAll(".context-menu");
            menus.forEach(menu => {
                menu.style.display = "none";
            });
        }
    });

    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
    });
}

async function loadLibrary() {
    try {
        const response = await fetch('/api/library');
        library = await response.json();
        var letter = "`";

        const container = document.getElementById('Library');

        renderLibrary(container, library, letter);

    } catch (error) {
        console.error('Error loading mp3 library:', error);
        document.getElementById('sidebar').innerHTML = 'Error loading mp3 library: <br>' + error;
    }
}

function renderLibrary(container, lib, letter = '') {
    container.innerHTML = '';
    first = true;

    Object.entries(lib).forEach(([artist, albums]) => {
        if(letter && artist[0].toLowerCase() != letter) {
            letter = String.fromCharCode(letter.charCodeAt(0) + 1);
            var s = document.createElement('span')
            s.innerText = letter.toUpperCase();
            s.classList.add("braker");
            if(first) {
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
        artistSummary.addEventListener("contextmenu", (e) => { contextmenu(e, artistSummary.getAttribute("data-menu")); });
        artistSummary.ondblclick = function(){ addToQueue(Object.entries(albums).flat(Infinity)) };

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
            albumSummary.addEventListener("contextmenu", (e) => { contextmenu(e, albumSummary.getAttribute("data-menu")); });
            albumSummary.ondblclick = function(){ addToQueue(songs) };

            const albumCover = document.createElement('img');
            albumCover.classList.add("albumCover")
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
                songSpan.addEventListener("contextmenu", (e) => { contextmenu(e, songSpan.getAttribute("data-menu")); });

                songSpan.ondblclick = function(){ addToQueue([song]) };
                songSpan.dataset.song = JSON.stringify(song);

                albumDetails.appendChild(songSpan);
            });

            artistDetails.appendChild(albumDetails);
        });

        artistDetails.addEventListener('toggle', function() {
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

function openTab(evt, tabName) {
    
    Array.from(document.getElementsByClassName("tab-content")).forEach(content => {
        content.style.display = "none";
    });

    Array.from(document.getElementsByClassName("tab-button")).forEach(button => {
        button.className = button.className.replace(" active", "");
    });

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    if(tabName === "Search") {
        document.getElementById("searchBox").value = "";
        document.getElementById("searchResults").innerText = "";
    } else if(tabName === "Library") {
        document.querySelectorAll("#Library .artist").forEach(artist => {
            artist.open = false;
        });
    } else if(tabName === "Playlists") {
        document.querySelectorAll("#Playlists .playlist").forEach(playlist => {
            playlist.open = false;
        });
    }
}

function search(query) {
    if(!query) {
        document.getElementById("searchResults").innerHTML = '';
        return;
    };

    query = query.toLowerCase();
    let filteredLibrary = {};

    for (let artist in library) {
        let filteredAlbums = {};

        for (let album in library[artist]) {
            let filteredSongs = library[artist][album].filter(song => 
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

    if(Object.keys(filteredLibrary).length !== 0)
        renderLibrary(document.getElementById("searchResults"), filteredLibrary);
    else 
        document.getElementById("searchResults").innerText = "No songs matching query";

    document.querySelectorAll("#searchResults .selectable").forEach(span => {
        span.addEventListener("mousedown", (event) => {
            document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected")); 
            event.target.classList.add("selected");
        });
    });


    if(document.querySelectorAll("#searchResults .artist").length > 3) return;

    document.querySelectorAll("#searchResults .artist").forEach(artist => {
        artist.open = true;
        artist.querySelectorAll('.album').forEach(album => {
            if (album.querySelectorAll('.song').length < 4) {
                album.open = true;
            }
        });
    });
}



function startUpdatingTime() {
    nowPlaying.audio.addEventListener('timeupdate', function () {
        if(nowPlaying.blank) return;

        const progress = document.getElementById("progress");
        progress.value = (nowPlaying.audio.currentTime / nowPlaying.audio.duration) * 100;
        progress.style.background = `linear-gradient(to right, #fff ${progress.value}%, var(--accent2) ${progress.value}%)`;
        document.getElementById("progressTime").textContent = formatTime(nowPlaying.audio.currentTime);
    });
}

function updateTime() {
    const progress = document.getElementById("progress");

    if(nowPlaying.blank) {
        progress.value = 0;
        return;
    };

    progress.style.background = `linear-gradient(to right, #fff ${progress.value}%, var(--accent2) ${progress.value}%)`;
    nowPlaying.audio.currentTime = (progress.value/100) * nowPlaying.audio.duration;
    document.getElementById("progressTime").textContent = formatTime(nowPlaying.audio.currentTime);
}

function updateVolume() {
    var slider = document.getElementById("volumeRange");

    volume = slider.value / 100;

    slider.style.background = `linear-gradient(to right, #fff ${slider.value}%, var(--accent2) ${slider.value}%)`;

    if (!nowPlaying.blank) nowPlaying.audio.volume = volume;

    if(volume == 0) {
        document.getElementById("mute").src = "assets/icons/mute.png";
    } else {
        document.getElementById("mute").src = "assets/icons/sound.png";
    }
}

function mute() {
    document.getElementById("volumeRange").value = (volume ? "0" : "1") * 100;
    updateVolume();
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}



function showLoader() {
    document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
    document.getElementById("loader").style.display = "none";
}

function contextmenu(e, id, x, y) {
    e.preventDefault();

    document.querySelectorAll(".context-menu").forEach(m => {
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
        rightClickedObject = JSON.parse(e.target.closest('tr').getAttribute("data-song"));
        rightClickedObject.element = e.target.closest('tr');
    } catch {
        try {
            rightClickedObject = { artist: e.target.closest('summary').innerText, target: e.target.closest('summary') };
        } catch {
            rightClickedObject = { name: e.target.closest('span').innerText, target: e.target.closest('span'), artist: e.target.closest('span').parentNode.parentNode.querySelectorAll("summary")[0].innerText };
        }
    }
}

async function getArtistDetails(artist = rightClickedObject.artist, dirArtist = rightClickedObject.dirArtist) {
    showLoader();

    async function fetchArtistDetails(baseUrls) {
        var result = [];

        for (const url of baseUrls) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;

                const data = await response.json();
                if (data.extract) {
                    const bio = data.extract;
                    const image = data.originalimage ? data.originalimage.source : null;
                    result.push({bio: bio, img: image});
                }
            } catch (error) {}
        }

        if (result.length === 0) return null;

        return result.reduce((max, artist) => artist.bio.length > max.bio.length ? artist : max, result[0]);
    }

    async function fetchImage(url) {
        if (!url) return null;

        try {
            const response = await fetch(url);
            if (!response.ok) return null;

            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            return null;
        }
    }

    var artistDetails = await fetchArtistDetails([
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist)}_(band)`,
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(dirArtist)}_(band)`,
        `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist)}_(zespół_muzyczny)`,
        `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(dirArtist)}_(zespół_muzyczny)`
    ]);

    if (!artistDetails) {
        artistDetails = await fetchArtistDetails([
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist)}`,
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(dirArtist)}`,
            `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist)}`,
            `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(dirArtist)}`
        ]);
    }

    if (!artistDetails) {
        hideLoader();
        document.querySelector("#artistDetailsDialog").showModal();
        document.querySelector("#artistDetailsDialog img").src = "/assets/empty.svg";
        document.querySelector("#artistDetailsDialog p").innerText = "Couldn't find info on that artist.";
        return;
    }

    var imgElement = document.querySelector("#artistDetailsDialog img");
    var imgSrc = await fetchImage(artistDetails.img) || "/assets/empty.svg";

    imgElement.onload = () => {
        hideLoader();
        document.querySelector("#artistDetailsDialog").showModal();
    };

    document.querySelector("#artistDetailsDialog p").innerText = artistDetails.bio || "Couldn't find info on that artist.";
    imgElement.src = imgSrc;
}

async function getSongLyrics(artist = rightClickedObject.artist, name = rightClickedObject.name) {
    showLoader();

    async function fetchSongLyrics(artist, song) {
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
        
        try {
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error('Song not found');
          }
          
          const data = await response.json();
          return data.lyrics.replace(/\r/g, "<br>").replace(/\n/g, "<br>").replace(/<br><br>/g, '<br>');
        } catch (error) {
          return null;
        }
    }


    lyrics = await fetchSongLyrics(artist, name);

    document.querySelector("#songLyricsDialog p").innerHTML = lyrics || "Couldn't find lyrics to that song.";
    document.querySelector("#songLyricsDialog h1").innerText = name;
    hideLoader();
    document.querySelector("#songLyricsDialog").showModal();
}

function dbClickThis(element) {
    const event = new MouseEvent("dblclick", { bubbles: true });
    element.dispatchEvent(event);
}

function goToArtist(query = rightClickedObject.artist) {
    document.getElementById('SearchButton').click();
    document.getElementById('searchBox').value = query;
    search(query);
}

function goToAlbum(query = rightClickedObject.album) {
    document.getElementById('SearchButton').click();
    document.getElementById('searchBox').value = query;
    search(query);
}

function addToQueue(songs) {
    songs = songs.filter(e => e.track);

    songs.forEach(song => {
        var c, span;
        var row = document.getElementById("queue-tbody").insertRow(-1);

        row.draggable = true;

        row.insertCell(0).innerHTML = "<img></img>" + song.track;

        c = row.insertCell(1);
        c.innerHTML = song.name;
        c.title = song.name;

        c = row.insertCell(2);
        span = document.createElement("span");
        span.innerHTML = song.artist;
        span.addEventListener("click", () => goToArtist(song.artist));
        span.classList.add("link");
        span.title = song.artist;
        c.append(span);

        c = row.insertCell(3);
        span = document.createElement("span");
        span.innerHTML = song.album;
        span.addEventListener("click", () => goToArtist(song.album));
        span.classList.add("link");
        span.title = song.album;
        c.append(span);

        row.insertCell(4).innerHTML = formatTime(song.length);

        let songClone = { ...song };

        songClone.element = row;
        songClone.queueId = queue.length;

        queue.push(songClone);

        row.ondblclick = function(){ newSong(songClone); };

        row.classList.add('selectable');
        row.classList.add("custom-context");
        row.dataset.menu = "queueSongMenu";
        row.dataset.song = JSON.stringify(songClone);

        row.addEventListener("mousedown", (event) => {
            document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected"));
            const e = event.target.parentElement;
            if(e.nodeName === "TD") {
                e.parentElement.classList.add("selected");
            } else {
                e.classList.add("selected");
            }
        });

        row.addEventListener("contextmenu", (e) => { contextmenu(e, row.getAttribute("data-menu")); });

        let btn = document.createElement("span");
        btn.innerText = "⋮";
        btn.classList.add("contextbtn");
        btn.addEventListener("click", (e) => { contextmenu(e, "queueSongMenu", btn.getBoundingClientRect().left, btn.getBoundingClientRect().top); });
        row.appendChild(btn);
    });

    if(nowPlaying.blank || !document.getElementById("play").classList.contains("playing")) {
        newSong(queue[queue.length - songs.length]);
    }

    initializeDragula();
}

function initializeDragula() {
    if (window.drake) {
        window.drake.destroy();
    }
    
    window.drake = dragula([document.getElementById('queue-tbody')], {
        mirrorContainer: document.body,
        moves: function (el, container, handle) {
            return handle.nodeName !== 'SPAN' || !handle.classList.contains('contextbtn');
        }
    });

    window.drake.on('drag', function (el) {
        el.classList.add('grabbing');
    });

    window.drake.on('dragend', function (el) {
        el.classList.remove('grabbing');
    });

    window.drake.on('cloned', function (mirror, original, type) {
        if (type === 'mirror') {
            mirror.classList.add('gu-mirror');
            mirror.style.width = original.offsetWidth + 'px';
            mirror.style.height = original.offsetHeight + 'px';

            const originalStyles = window.getComputedStyle(original);
            for (let style of originalStyles) {
                mirror.style[style] = originalStyles.getPropertyValue(style);
            }
        }
    });

    window.drake.on('drop', function (el, target, source, sibling) {
        const isPlaying = !nowPlaying.blank;
        const currentPlayingPath = isPlaying ? nowPlaying.path : null;
        const rows = Array.from(target.children);
        const newQueue = [];
        
        rows.forEach((row, index) => {
            try {
                const songData = JSON.parse(row.getAttribute('data-song'));
                const song = {
                    name: songData.name,
                    artist: songData.artist,
                    dirArtist: songData.dirArtist,
                    album: songData.album,
                    track: songData.track,
                    path: songData.path,
                    cover: songData.cover,
                    length: songData.length,
                    queueId: index,
                    element: row
                };
                
                if (isPlaying && song.path === currentPlayingPath) {
                    song.audio = nowPlaying.audio;
                    nowPlaying = song;
                }
                
                row.dataset.song = JSON.stringify(song);
                row.ondblclick = function() { newSong(song); };
                newQueue.push(song);
            } catch (error) {
                console.error('Error rebuilding queue item:', error);
            }
        });
        
        queue = newQueue;
    });
}




function removeFromQueue() {
    if (nowPlaying.queueId === rightClickedObject.queueId) audioStop();

    const index = queue.findIndex(item => item.queueId === rightClickedObject.queueId);

    if (index === -1) return;

    queue.splice(index, 1);

    queue.forEach((item, i) => {
        item.queueId = i;
        item.element.dataset.song = JSON.stringify(item);
    });

    rightClickedObject.element.remove();
}

function newSong(song) {
    try {
        nowPlaying.element.querySelector("img").src = "";   
        nowPlaying.audio.pause();
    } catch {}

    nowPlaying = song;

    nowPlaying.audio = new Audio(nowPlaying.path.split('/').map(encodeURIComponent).join('/'));
    nowPlaying.audio.volume = volume;

    document.querySelectorAll(".cover").forEach(element => { element.style.width = "auto"; });

    if(nowPlaying.cover)
        document.querySelectorAll(".cover").forEach(element => { element.src = nowPlaying.cover; });
    else
        document.querySelectorAll(".cover").forEach(element => { element.src = "/assets/empty.svg"; });

    document.title = nowPlaying.name + " - " + nowPlaying.artist;

    document.getElementById("title").innerText = nowPlaying.name;
    document.getElementById("artist").innerText = nowPlaying.artist;
    document.getElementById("play").style.opacity = "100%";
    document.getElementById("play").classList.add("playing");
    document.getElementById("progressTotal").innerText = formatTime(nowPlaying.length);
    document.getElementById("progress").classList.remove('disabledRange');
    startUpdatingTime();

    nowPlaying.audio.addEventListener("ended", nextSong);

    audioPlay();
}

function nextSong() {
    if(nowPlaying.blank) return;
    
    audioPause();

    if(queue[nowPlaying.queueId + 1]) 
        newSong(queue[nowPlaying.queueId + 1]);
    else 
        audioStop();
}

function previousSong() {
    if(nowPlaying.blank) return;

    audioPause();

    if(nowPlaying.audio.currentTime > 3 || !queue[nowPlaying.queueId - 1]) {
        nowPlaying.audio.currentTime = 0;
        audioPlay();
    } else {
        newSong(queue[nowPlaying.queueId - 1]);
    }
}

function shuffleQueue() {
    queue.sort(() => Math.random() - 0.5);

    const tbody = document.getElementById("queue-tbody");
    tbody.innerHTML = '';

    queue.forEach((song, index) => {
        song.queueId = index;
        song.element.dataset.song = JSON.stringify(song);
        tbody.appendChild(song.element);
    });
}

function clearQueue() {
    queue = [];
    document.getElementById("queue-tbody").innerHTML = '';
    audioStop();
}



function audioStop() {
    if(nowPlaying.blank) return;

    audioPause();
    nowPlaying.element.querySelector("img").src = "";
    nowPlaying = { blank: true };

    document.title = "Mp3 Player";

    document.getElementById("title").innerText = "";
    document.getElementById("artist").innerText = "";
    document.getElementById("progressTotal").innerText = "0:00";
    document.getElementById("progressTime").innerText = "0:00";
    document.getElementById("progress").value = 0;
    document.getElementById("progress").style.background = "linear-gradient(to right, var(--accent2) 50%, var(--accent2) 50%)";
    document.getElementById("progress").classList.add('disabledRange');

    document.getElementById("miniCover").style.width = "0";
}

function audioPlay() {
    if(nowPlaying.blank) return;
    
    nowPlaying.audio.play();

    nowPlaying.element.querySelector("img").src = "/assets/icons/play.png";
    document.getElementById("play").src = "/assets/icons/pause.png";
}

function audioPause() {
    if(nowPlaying.blank) return;

    nowPlaying.audio.pause();

    nowPlaying.element.querySelector("img").src = "/assets/icons/pause.png";
    document.getElementById("play").src = "/assets/icons/play.png";
}

function toggleAudio() {
    if(nowPlaying.blank) return;

    document.getElementById("play").classList.toggle("playing");

    document.getElementById("play").classList.contains("playing") ? audioPlay() : audioPause();
}





async function init() {
    await loadLibrary();
    await loadPlaylists();
    addListeners();
}