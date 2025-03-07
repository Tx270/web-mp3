export default class AudioManager {
    constructor(Player) {
        this.Player = Player;
    }

    play() {
        if (this.Player.nowPlaying.blank) return;
        
        this.Player.nowPlaying.audio.play();
    
        this.Player.nowPlaying.element.querySelector("img").src = "/assets/icons/play.png";
        document.getElementById("play").src = "/assets/icons/pause.png";
    }

    pause() {
        if (this.Player.nowPlaying.blank) return;

        this.Player.nowPlaying.audio.pause();

        this.Player.nowPlaying.element.querySelector("img").src = "/assets/icons/pause.png";
        document.getElementById("play").src = "/assets/icons/play.png";
    }
    
    stop() {
        if (this.Player.nowPlaying.blank) return;
    
        this.pause();
        this.Player.nowPlaying.element.querySelector("img").src = "";
        this.Player.nowPlaying = { blank: true };
    
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

    next() {
        if (this.Player.nowPlaying.blank) return;
        
        this.pause();

        if (this.Player.queue[this.Player.nowPlaying.queueId + 1]) 
            this.newSong(this.Player.queue[this.Player.nowPlaying.queueId + 1]);
        else 
            this.stop();
    }

    previous() {
        if (this.Player.nowPlaying.blank) return;
    
        this.pause();
    
        if (this.Player.nowPlaying.audio.currentTime > 3 || !this.Player.queue[this.Player.nowPlaying.queueId - 1]) {
            this.Player.nowPlaying.audio.currentTime = 0;
            this.play();
        } else {
            this.newSong(this.Player.queue[this.Player.nowPlaying.queueId - 1]);
        }
    }

    volume() {
        var slider = document.getElementById("volumeRange");

        this.Player.volume = slider.value / 100;

        slider.style.background = `linear-gradient(to right, #fff ${slider.value}%, var(--accent2) ${slider.value}%)`;

        if (!this.Player.nowPlaying.blank) this.Player.nowPlaying.audio.volume = this.Player.volume;

        if (this.Player.volume == 0)
            document.getElementById("mute").src = "assets/icons/mute.png";
        else
            document.getElementById("mute").src = "assets/icons/sound.png";
    }

    mute() {
        document.getElementById("volumeRange").value = (volume ? "0" : "1") * 100;
        this.volume();
    }

    toggle() {
        if(this.Player.nowPlaying.blank) return;
    
        document.getElementById("play").classList.toggle("playing");
    
        document.getElementById("play").classList.contains("playing") ? this.play() : this.pause();
    }

    newSong(song) {
        try {
            this.Player.nowPlaying.element.querySelector("img").src = "";   
            this.Player.nowPlaying.audio.pause();
        } catch {}
    
        this.Player.nowPlaying = song;
    
        this.Player.nowPlaying.audio = new Audio(this.Player.nowPlaying.path.split('/').map(encodeURIComponent).join('/'));
        this.Player.nowPlaying.audio.volume = this.Player.volume;
    
        document.querySelectorAll(".cover").forEach(element => { element.style.width = "auto"; });
    
        if (this.Player.nowPlaying.cover)
            document.querySelectorAll(".cover").forEach(element => { element.src = this.Player.nowPlaying.cover; });
        else
            document.querySelectorAll(".cover").forEach(element => { element.src = "/assets/empty.svg"; });
    
        document.title = `${this.Player.nowPlaying.name} - ${this.Player.nowPlaying.artist}`;
    
        document.getElementById("title").innerText = this.Player.nowPlaying.name;
        document.getElementById("artist").innerText = this.Player.nowPlaying.artist;
        document.getElementById("play").style.opacity = "100%";
        document.getElementById("play").classList.add("playing");
        document.getElementById("progressTotal").innerText = this.Player.utils.formatTime(this.Player.nowPlaying.length);
        document.getElementById("progress").classList.remove('disabledRange');
        this.startTime();
    
        this.Player.nowPlaying.audio.addEventListener("ended", () => this.next());
    
        this.play();
    }
    
    startTime() {
        this.Player.nowPlaying.audio.addEventListener('timeupdate', () => {
            if (this.Player.nowPlaying.blank) return;
    
            const progress = document.getElementById("progress");
            progress.value = (this.Player.nowPlaying.audio.currentTime / this.Player.nowPlaying.audio.duration) * 100;
            progress.style.background = `linear-gradient(to right, #fff ${progress.value}%, var(--accent2) ${progress.value}%)`;
            document.getElementById("progressTime").textContent = this.Player.utils.formatTime(this.Player.nowPlaying.audio.currentTime);
        });
    }
    
    time() {
        const progress = document.getElementById("progress");
    
        if (this.Player.nowPlaying.blank) {
            progress.value = 0;
            return;
        }
    
        progress.style.background = `linear-gradient(to right, #fff ${progress.value}%, var(--accent2) ${progress.value}%)`;
        this.Player.nowPlaying.audio.currentTime = (progress.value / 100) * this.Player.nowPlaying.audio.duration;
        document.getElementById("progressTime").textContent = this.Player.utils.formatTime(this.Player.nowPlaying.audio.currentTime);
    }
}
