var nowPlaying = { blank: true }, rightClickedObject = {}, queue = [];




function addListeners() {
    document.querySelectorAll(".selectable").forEach(span => {
        span.addEventListener("mousedown", (event) => {
            document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected")); 
            event.target.classList.add("selected");
        });
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
        const response = await fetch('library.json');
        const library = await response.json();
        var letter = "`";

        const container = document.getElementById('Library');
        container.innerHTML = '';

        first = true;

        Object.entries(library).forEach(([artist, albums]) => {
            if(artist[0].toLowerCase() != letter) {
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
            artistSummary.setAttribute("data-menu", "libraryArtistMenu");
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
                albumSummary.setAttribute("data-menu", "libraryAlbumMenu");
                albumSummary.classList.add("custom-context");
                albumSummary.addEventListener("contextmenu", (e) => { contextmenu(e, albumSummary.getAttribute("data-menu")); });
                albumSummary.ondblclick = function(){ addToQueue(songs) };

                albumDetails.appendChild(albumSummary);

                songs.forEach(song => {
                    const songSpan = document.createElement('span');
                    songSpan.classList.add('song', 'selectable');
                    songSpan.textContent = song.name;
                    songSpan.title = song.name;
                    songSpan.setAttribute("data-menu", "librarySongMenu");
                    songSpan.classList.add("custom-context");
                    songSpan.addEventListener("contextmenu", (e) => { contextmenu(e, songSpan.getAttribute("data-menu")); });

                    songSpan.ondblclick = function(){ addToQueue([song]) };

                    albumDetails.appendChild(songSpan);
                });

                artistDetails.appendChild(albumDetails);
            });

            container.appendChild(artistDetails);
        });

    } catch (error) {
        console.error('Błąd wczytywania pliku JSON:', error);
        document.getElementById('sidebar').innerHTML = "Error loading mp3 library. <br> Try to use library refresh.";
    }

    addListeners();
}

async function fetchAlbumCover(mp3Path) {
    document.querySelectorAll(".cover").forEach(element => { element.style.width = "auto"; });

    const response = await fetch(`/php/cover.php?file=${encodeURIComponent(mp3Path)}`);
    
    if (!response.ok) {
        document.querySelectorAll(".cover").forEach(element => { element.src = "/assets/empty.png"; });
        return;
    }

    const blob = await response.blob();
    const imgUrl = URL.createObjectURL(blob);
    
    document.querySelectorAll(".cover").forEach(element => { element.src = imgUrl; });
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
}



function startUpdatingTime() {
    if (!nowPlaying.interval) {
        nowPlaying.interval = setInterval(function () {
            const progress = document.getElementById("progress");
            progress.value = (nowPlaying.audio.currentTime / nowPlaying.audio.duration) * 100;
            progress.style.background = `linear-gradient(to right, #fff ${progress.value}%, var(--accent2) ${progress.value}%)`;
            document.getElementById("progressTime").textContent = formatTime(nowPlaying.audio.currentTime);
        }, 1000);
    }
}

function stopUpdatingTime() {
    if (nowPlaying.interval) {
        clearInterval(nowPlaying.interval);
        nowPlaying.interval = null;
    }
}

function updateTime() {
    var progress = document.getElementById("progress");

    if(nowPlaying.blank) {
        progress.value = 0;
        return;
    };

    progress.style.background = `linear-gradient(to right, #fff ${progress.value}%, var(--accent2) ${progress.value}%)`;
    nowPlaying.audio.currentTime = (progress.value/100) * nowPlaying.audio.duration;
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
            rightClickedObject = { name: e.target.closest('span').innerText, target: e.target.closest('span') };
        }
    }
}

async function getArtistDetails() {
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
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rightClickedObject.artist)}_(band)`,
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rightClickedObject.dirArtist)}_(band)`,
        `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rightClickedObject.artist)}_(zespół_muzyczny)`,
        `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rightClickedObject.dirArtist)}_(zespół_muzyczny)`
    ]);

    if (!artistDetails) {
        artistDetails = await fetchArtistDetails([
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rightClickedObject.artist)}`,
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rightClickedObject.dirArtist)}`,
            `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rightClickedObject.artist)}`,
            `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rightClickedObject.dirArtist)}`
        ]);
    }

    if (!artistDetails) {
        hideLoader();
        document.querySelector("#artistDetailsDialog").showModal();
        document.querySelector("#artistDetailsDialog img").src = "/assets/empty.png";
        document.querySelector("#artistDetailsDialog p").innerText = "Couldn't find info on that artist.";
        return;
    }

    var imgElement = document.querySelector("#artistDetailsDialog img");
    var imgSrc = await fetchImage(artistDetails.img) || "/assets/empty.png";

    imgElement.onload = () => {
        hideLoader();
        document.querySelector("#artistDetailsDialog").showModal();
    };

    document.querySelector("#artistDetailsDialog p").innerText = artistDetails.bio || "Couldn't find info on that artist.";
    imgElement.src = imgSrc;
}

function getSongLyrics() {
    // Za trudno mi znaleźć dobre api do tego :(
}

function dbClickThis(element) {
    const event = new MouseEvent("dblclick", { bubbles: true });
    element.dispatchEvent(event);
}



function addToQueue(songs) {
    songs = songs.filter(e => e.track);

    songs.forEach(song => {
        var c;
        var row = document.getElementById("queue-tbody").insertRow(-1);

        row.insertCell(0).innerHTML = "<img></img>" + song.track;
        c = row.insertCell(1);
        c.innerHTML = song.name;
        c.title = song.name;
        c = row.insertCell(2);
        c.innerHTML = song.artist;
        c.title = song.artist;
        c = row.insertCell(3);
        c.innerHTML = song.album;
        c.title = song.album;
        row.insertCell(4).innerHTML = formatTime(song.length);

        song.element = row;
        song.queueId = queue.length;

        queue.push(song);

        row.ondblclick = function(){ newSong(song); };

        row.classList.add('selectable');
        row.classList.add("custom-context");
        row.setAttribute("data-menu", "queueSongMenu");
        row.setAttribute("data-song", JSON.stringify(song));

        row.addEventListener("mousedown", (event) => {
            document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected")); 
            event.target.parentElement.classList.add("selected");
        });

        row.addEventListener("contextmenu", (e) => { contextmenu(e, row.getAttribute("data-menu")); });

        
        let btn = document.createElement("span");
        btn.innerText = "⋮";
        btn.classList.add("contextbtn");
        btn.addEventListener("click", (e) => { contextmenu(e, "queueSongMenu", btn.getBoundingClientRect().left, btn.getBoundingClientRect().top); });
        row.appendChild(btn);
    });

    if(nowPlaying.blank || !document.getElementById("play").classList.contains("playing")) newSong(songs[0]);
}

function removeFromQueue() {
    if (nowPlaying.queueId === rightClickedObject.queueId) audioStop();

    const index = queue.findIndex(item => item.queueId === rightClickedObject.queueId);

    if (index === -1) return;

    queue.splice(index, 1);

    queue.forEach((item, i) => {
        item.queueId = i;
        item.element.setAttribute("data-song", JSON.stringify(item));
    });

    rightClickedObject.element.remove();
}

function newSong(song) {
    // song.element.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--highlight-heavy');
    try {
        nowPlaying.element.querySelector("img").src = "";   
        nowPlaying.audio.pause();
        stopUpdatingTime();
    } catch {}

    nowPlaying = song;

    nowPlaying.audio = new Audio(nowPlaying.path.split('/').map(encodeURIComponent).join('/'));

    fetchAlbumCover(nowPlaying.path);

    document.title = nowPlaying.name + " - " + nowPlaying.artist;

    document.getElementById("title").innerText = nowPlaying.name;
    document.getElementById("artist").innerText = nowPlaying.artist;
    document.getElementById("play").style.opacity = "100%";
    document.getElementById("play").classList.add("playing");
    document.getElementById("progressTotal").innerText = formatTime(nowPlaying.length);
    document.getElementById("progress").classList.remove('disabledRange');

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
        song.element.setAttribute("data-song", JSON.stringify(song));
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

    startUpdatingTime();

    nowPlaying.element.querySelector("img").src = "/assets/icons/play.png";
    document.getElementById("play").src = "/assets/icons/pause.png";
}

function audioPause() {
    if(nowPlaying.blank) return;

    nowPlaying.audio.pause();

    stopUpdatingTime();

    nowPlaying.element.querySelector("img").src = "/assets/icons/pause.png";
    document.getElementById("play").src = "/assets/icons/play.png";
}

function toggleAudio() {
    if(nowPlaying.blank) return;

    document.getElementById("play").classList.toggle("playing");

    if (document.getElementById("play").classList.contains("playing")) {
        audioPlay();
    } else {
        audioPause();
    }
}