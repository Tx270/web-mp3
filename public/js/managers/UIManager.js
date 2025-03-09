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
    }
}
