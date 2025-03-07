export default class Utils {
    constructor(Player) {
        this.Player = Player;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }

    dbClickThis(element) {
        const event = new MouseEvent("dblclick", { bubbles: true });
        element.dispatchEvent(event);
    }

    async openPath(path = JSON.parse(this.Player.rightClickedObject.target.dataset.song).path) {
        path = "public".concat(path);
    
        try {
            await fetch("/api/open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path })
            });
        } catch (error) {
            this.Player.notificationManager.show("Error opening path: " + error.message, true);
        }
    }
}