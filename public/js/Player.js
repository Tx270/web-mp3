import AudioManager from "./managers/AudioManager.js";
import LibraryManager from "./managers/LibraryManager.js";
import PlaylistManager from "./managers/PlaylistManager.js";
import QueueManager from "./managers/QueueManager.js";
import UIManager from "./managers/UIManager.js";
import NotificationManager from "./managers/NotificationManager.js";
import ApiManager from "./managers/ApiManager.js";
import Utils from "./utils/Utils.js";


export default class Player {
    constructor() {
        this.nowPlaying = { blank: true };
        this.queue = [];
        this.volume = "1";
        this.library = null;
        this.playlists = {};
        this.rightClickedObject = {};

        this.audioManager = new AudioManager(this);
        this.libraryManager = new LibraryManager(this);
        this.playlistManager = new PlaylistManager(this);
        this.queueManager = new QueueManager(this);
        this.uiManager = new UIManager(this);
        this.notificationManager = new NotificationManager();
        this.apiManager = new ApiManager(this);
        this.utils = new Utils(this);

        this.init();
    }

    async init() {
        await this.libraryManager.load();
        await this.playlistManager.load();
        await this.queueManager.load();
        
        this.playlistManager.updateContext();
        this.uiManager.addListeners();
    }
}
