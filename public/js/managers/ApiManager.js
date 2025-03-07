export default class ApiManager {
    constructor(Player) {
        this.Player = Player;
    }

    async getArtistDetails(artist = this.Player.rightClickedObject.artist, dirArtist = this.Player.rightClickedObject.dirArtist) {
        this.Player.showLoader();

        async function fetchArtistDetails(baseUrls) {
            let result = [];

            for (const url of baseUrls) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) continue;

                    const data = await response.json();
                    if (data.extract) {
                        const bio = data.extract;
                        const image = data.originalimage ? data.originalimage.source : null;
                        result.push({ bio: bio, img: image });
                    }
                } catch (error) {}
            }

            if (result.length === 0) return null;

            return result.reduce((max, artist) => (artist.bio.length > max.bio.length ? artist : max), result[0]);
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

        let artistDetails = await fetchArtistDetails([
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
            this.Player.uiManager.hideLoader();
            document.querySelector("#artistDetailsDialog").showModal();
            document.querySelector("#artistDetailsDialog img").src = "/assets/empty.svg";
            document.querySelector("#artistDetailsDialog p").innerText = "Couldn't find info on that artist.";
            return;
        }

        let imgElement = document.querySelector("#artistDetailsDialog img");
        let imgSrc = (await fetchImage(artistDetails.img)) || "/assets/empty.svg";

        imgElement.onload = () => {
            this.Player.uiManager.hideLoader();
            document.querySelector("#artistDetailsDialog").showModal();
        };

        document.querySelector("#artistDetailsDialog p").innerText = artistDetails.bio || "Couldn't find info on that artist.";
        imgElement.src = imgSrc;
    }

    async getSongLyrics(artist = this.Player.rightClickedObject.artist, name = this.Player.rightClickedObject.name) {
        this.Player.uiManager.showLoader();

        async function fetchSongLyrics(artist, song) {
            const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;

            try {
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error("Song not found");
                }

                const data = await response.json();
                return data.lyrics.replace(/\r/g, "<br>").replace(/\n/g, "<br>").replace(/<br><br>/g, "<br>");
            } catch (error) {
                return null;
            }
        }

        let lyrics = await fetchSongLyrics(artist, name);

        document.querySelector("#songLyricsDialog p").innerHTML = lyrics || "Couldn't find lyrics to that song.";
        document.querySelector("#songLyricsDialog h1").innerText = name;
        this.Player.uiManager.hideLoader();
        document.querySelector("#songLyricsDialog").showModal();
    }
}
