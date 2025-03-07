export default class NotificationManager {
    constructor(Player) {
        this.Player = Player;
    }

    show(text, error = false, imageUrl) {
        const container = document.getElementById('alert');
    
        if (container.style.opacity !== "0") {
            container.style.opacity = "0";
            setTimeout(() => {
                this.update(text, error, imageUrl);
            }, 500);
        } else {
            this.update(text, error, imageUrl);
        }
    }
    
    update(text, error, imageUrl) {
        const container = document.getElementById('alert');
        const img = container.querySelector("img");
        const p = container.querySelector("p");
        
        if(!imageUrl) {
            img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
            img.style.width = "0";
            img.style.margin = "0";
        } else {
            img.src = imageUrl;
            img.style.width = "40px";
            img.style.marginRight = "13px";
        }
    
        p.innerText = text;
    
        if(!error) {
            p.style.color = "black";
        } else {
            p.style.color = "red";
        }
    
        container.style.opacity = "1";
    
        setTimeout(() => {
            container.style.opacity = "0";
        }, 4000);
    }
}