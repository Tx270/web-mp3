export default class QueueManager {
    constructor(Player) {
        this.Player = Player;
    }

    addSong(songs, play = true) {
        if(Object.keys(songs).length === 0) return;
        songs = songs.filter(e => e.track);

        songs.forEach(song => {
            let c, span;
            let row = document.getElementById("queue-tbody").insertRow(-1);

            row.draggable = true;

            row.insertCell(0).innerHTML = "<img></img>" + song.track;

            c = row.insertCell(1);
            c.innerHTML = song.name;
            c.title = song.name;

            c = row.insertCell(2);
            span = document.createElement("span");
            span.innerHTML = song.artist;
            span.addEventListener("click", () => this.Player.uiManager.goToArtist(song.artist));
            span.classList.add("link");
            span.title = song.artist;
            c.append(span);

            c = row.insertCell(3);
            span = document.createElement("span");
            span.innerHTML = song.album;
            span.addEventListener("click", () => this.Player.uiManager.goToAlbum(song.album));
            span.classList.add("link");
            span.title = song.album;
            c.append(span);

            row.insertCell(4).innerHTML = this.Player.utils.formatTime(song.length);

            let songClone = { ...song };
            songClone.element = row;
            songClone.queueId = this.Player.queue.length;

            this.Player.queue.push(songClone);

            row.ondblclick = () => this.Player.audioManager.newSong(songClone);

            row.classList.add("selectable", "custom-context");
            row.dataset.menu = "queueSongMenu";
            row.dataset.song = JSON.stringify(songClone);

            row.addEventListener("mousedown", (event) => {
                document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected"));
                const e = event.target.parentElement;
                if (e.nodeName === "TD") {
                    e.parentElement.classList.add("selected");
                } else {
                    e.classList.add("selected");
                }
            });

            row.addEventListener("contextmenu", (e) => { 
                this.Player.uiManager.contextmenu(e, row.getAttribute("data-menu")); 
            });

            let btn = document.createElement("span");
            btn.innerText = "⋮";
            btn.classList.add("contextbtn");
            btn.addEventListener("click", (e) => { 
                this.Player.uiManager.contextmenu(e, "queueSongMenu", btn.getBoundingClientRect().left, btn.getBoundingClientRect().top);
            });
            row.appendChild(btn);
        });

        if ((this.Player.nowPlaying.blank || !document.getElementById("play").classList.contains("playing")) && play) {
            this.Player.audioManager.newSong(this.Player.queue[this.Player.queue.length - songs.length]);
        }

        this.initializeDragula();
        this.save();
    }

    async load() {
        try {
            const response = await fetch("/api/queue");
            if (!response.ok) throw new Error("Failed to load queue");
            const savedQueue = await response.json();
            this.addSong(savedQueue, false);
        } catch (error) {
            this.Player.notificationManager.show("Error loading queue: " + error.message, true);
        }
    }

    async save() {
        try {
            await fetch("/api/queue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.Player.queue)
            });
        } catch (error) {
            this.Player.notificationManager.show("Error saving queue: " + error.message, true);
        }
    }

    removeSong() {
        if (this.Player.nowPlaying.queueId === this.Player.rightClickedObject.queueId) {
            this.Player.audioManager.stop();
        }

        const index = this.Player.queue.findIndex(item => item.queueId === this.Player.rightClickedObject.queueId);

        if (index === -1) return;

        this.Player.queue.splice(index, 1);

        this.Player.queue.forEach((item, i) => {
            item.queueId = i;
            item.element.dataset.song = JSON.stringify(item);
        });

        this.Player.rightClickedObject.element.remove();
        this.save();
    }

    shuffle() {
        this.Player.queue.sort(() => Math.random() - 0.5);

        const tbody = document.getElementById("queue-tbody");
        tbody.innerHTML = '';

        this.Player.queue.forEach((song, index) => {
            song.queueId = index;
            song.element.dataset.song = JSON.stringify(song);
            tbody.appendChild(song.element);
        });

        this.Player.notificationManager.show("Queue shuffled");
        this.save();
    }

    clear() {
        this.Player.queue = [];
        document.getElementById("queue-tbody").innerHTML = '';
        this.Player.audioManager.stop();
        this.Player.notificationManager.show("Queue cleared");
        this.save();
    }

    initializeDragula() {
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

        window.drake.on('drop', (el, target, source, sibling) => {
            const isPlaying = !this.Player.nowPlaying.blank;
            const currentPlayingPath = isPlaying ? this.Player.nowPlaying.path : null;
            const rows = Array.from(target.children);
            const newQueue = [];

            rows.forEach((row, index) => {
                try {
                    const songData = JSON.parse(row.getAttribute('data-song'));
                    const song = {
                        ...songData,
                        queueId: index,
                        element: row
                    };

                    if (isPlaying && song.path === currentPlayingPath) {
                        song.audio = this.Player.nowPlaying.audio;
                        this.Player.nowPlaying = song;
                    }

                    row.dataset.song = JSON.stringify(song);
                    row.ondblclick = () => this.Player.audioManager.newSong(song);
                    newQueue.push(song);
                } catch (error) {
                    this.Player.notificationManager.show('Error rebuilding queue item: ' + error.message, true);
                }
            });

            this.Player.queue = newQueue;
            this.save();
        });
    }
}
