var nowPlaying = { blank: true };
var queue = [];


async function loadLibrary() {
    try {
        const response = await fetch('library.json');
        const library = await response.json();

        const container = document.getElementById('sidebar');
        container.innerHTML = '';

        Object.entries(library).forEach(([artist, albums]) => {
            const artistDetails = document.createElement('details');
            artistDetails.classList.add('artist');

            const artistSummary = document.createElement('summary');
            artistSummary.classList.add('selectable');
            artistSummary.textContent = artist;
            artistSummary.ondblclick = function(){ addToQueue(Object.entries(albums).flat(Infinity)) };

            artistDetails.appendChild(artistSummary);

            Object.entries(albums).forEach(([album, songs]) => {
                const albumDetails = document.createElement('details');
                albumDetails.classList.add('album');

                const albumSummary = document.createElement('summary');
                albumSummary.classList.add('selectable');
                albumSummary.textContent = album;
                albumSummary.ondblclick = function(){ addToQueue(songs) };

                albumDetails.appendChild(albumSummary);

                songs.forEach(song => {
                    const songSpan = document.createElement('span');
                    songSpan.classList.add('song', 'selectable');
                    songSpan.textContent = song.name;

                    songSpan.ondblclick = function(){ addToQueue([song]) };

                    albumDetails.appendChild(songSpan);
                });

                artistDetails.appendChild(albumDetails);
            });

            container.appendChild(artistDetails);
        });

    } catch (error) {
        console.error('Błąd wczytywania pliku JSON:', error);
        document.getElementById('music-library').textContent = "Błąd wczytywania danych.";
    }


    document.querySelectorAll(".selectable").forEach(span => {
        span.addEventListener("mousedown", (event) => {
            document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected")); 
            event.target.classList.add("selected");
        });
    });

    document.addEventListener("click", (event) => {
        if (!event.target.classList.contains("selectable") && event.target.nodeName !== "TD") {
            document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected"));
        }
    });
}


loadLibrary();



function addToQueue(songs) {
    songs.forEach(song => {
        if(song.track) {
            let table = document.getElementById("queue-tbody");
            var row = table.insertRow(-1);
            row.insertCell(0).innerHTML = "<img></img>" + song.track;
            row.insertCell(1).innerHTML = song.name;
            row.insertCell(2).innerHTML = song.artist;
            row.insertCell(3).innerHTML = song.album;
            row.insertCell(4).innerHTML = formatTime(song.length);
            song.element = row;

            row.ondblclick = function(){ newSong(song); };

            row.classList.add('selectable');

            row.addEventListener("mousedown", (event) => {
                document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected")); 
                event.target.parentElement.classList.add("selected");
            });
        }
    });
}


function newSong(song) {
    // song.element.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--highlight-heavy');
    try {
        nowPlaying.element.querySelector("img").src = "";   
        nowPlaying.audio.pause();
    } catch {}

    nowPlaying = song;

    nowPlaying.audio = new Audio(decodeURI(nowPlaying.path));

    fetchAlbumCover(nowPlaying.path);

    document.getElementById("title").innerText = nowPlaying.name;
    document.getElementById("artist").innerText = nowPlaying.artist;
    document.getElementById("play").style.opacity = "100%";
    document.getElementById("play").classList.add("playing");
    document.getElementById("progressTotal").innerText = formatTime(nowPlaying.length);

    audioPlay();
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
    if(nowPlaying.blank) return;

    var progress = document.getElementById("progress");
    progress.style.background = `linear-gradient(to right, #fff ${progress.value}%, var(--accent2) ${progress.value}%)`;
    nowPlaying.audio.currentTime = (progress.value/100) * nowPlaying.audio.duration;
}


async function fetchAlbumCover(mp3Path) {
    const response = await fetch(`/php/cover.php?file=${encodeURIComponent(mp3Path)}`);
    
    if (!response.ok) {
        console.error("Nie znaleziono okładki");
        return;
    }

    const blob = await response.blob();
    const imgUrl = URL.createObjectURL(blob);
    
    document.querySelectorAll(".cover").forEach(element => {
        element.src = imgUrl;
    })
}


function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}