<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/vendor/james-heinrich/getid3/getid3/getid3.php';


function getLibrary($directory) {
    $library = [];

    foreach (scandir($directory) as $artist) {
        if ($artist === '.' || $artist === '..') continue;
        $artistPath = $directory . DIRECTORY_SEPARATOR . $artist;

        $library[str_replace('_', '/', $artist)] = [];

        foreach (scandir($artistPath) as $album) {
            if ($album === '.' || $album === '..') continue;
            $albumPath = $artistPath . DIRECTORY_SEPARATOR . $album;

            $library[str_replace('_', '/', $artist)][str_replace('_', '/', $album)] = [];

            $songs = scandir($albumPath);
            natsort($songs);

            foreach ($songs as $song) {
                if (pathinfo($song, PATHINFO_EXTENSION) !== 'mp3') continue;

                $getID3 = new getID3();
                $fileInfo = $getID3->analyze($albumPath . DIRECTORY_SEPARATOR . $song);

                $title = null;
                if (!empty($fileInfo['tags'])) {
                    if (!empty($fileInfo['tags']['id3v2']['title'][0])) {
                        $title = $fileInfo['tags']['id3v2']['title'][0];
                    } elseif (!empty($fileInfo['tags']['id3v1']['title'][0])) {
                        $title = $fileInfo['tags']['id3v1']['title'][0];
                    } elseif (!empty($fileInfo['comments']['title'][0])) {
                        $title = $fileInfo['comments']['title'][0];
                    }
                }

                $l = isset($fileInfo['playtime_seconds']) ? $fileInfo['playtime_seconds'] : "0";

                $n = ($song[1] == " ") ? "0$song" : $song;
                $t = substr($n, 0, 2);

                if($n[3] == "-") $n = substr($n, 5); else $n = substr($n, 2);
                $n = substr(str_replace('_', '/', $n), 0, -4);

                $a = isset($fileInfo['tags']['id3v2']['artist'][0]) ? $fileInfo['tags']['id3v2']['artist'][0] : str_replace('_', '/', $artist);

                $library[str_replace('_', '/', $artist)][str_replace('_', '/', $album)][] = array(
                    "name" => $title ?? $n,
                    "path" => "/mp3/$artist/$album/$song",
                    "artist" => $a,
                    "dirArtist" => str_replace('_', '/', $artist),
                    "album" => str_replace('_', '/', $album),
                    "track" => $t,
                    "length" => $l
                );
            }
        }
    }

    return $library;
}


function echoLibrary($library) {
    foreach ($library as $artist => $albums) {
        echo "<details class='artist'><summary class='selectable'>$artist</summary>";
    
        foreach ($albums as $album => $songs) {
            echo "<details class='album'><summary class='selectable'>$album</summary>";
    
            foreach ($songs as $key => $song) {
                echo "<span class='song selectable'>".$song['length']."</span>";
            }
    
            echo "</details>";
        }
    
        echo "</details>";
    }
}





$library = getLibrary($_SERVER['DOCUMENT_ROOT'] . '/mp3');

$jsonData = json_encode($library, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
file_put_contents($_SERVER['DOCUMENT_ROOT']."/library.json", $jsonData);

echo "Library info saved in library.json";
