<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/vendor/james-heinrich/getid3/getid3/getid3.php';

if (!isset($_GET['file'])) {
    http_response_code(400);
    die("Brak ścieżki do pliku MP3.");
}

$filename = $_SERVER['DOCUMENT_ROOT'] . $_GET['file'];

if (!file_exists($filename)) {
    http_response_code(404);
    die("Plik nie istnieje.");
}

$getID3 = new getID3();
$file = $getID3->analyze($filename);

if (isset($file['id3v2']['APIC'][0]['data'])) {
    $cover_data = $file['id3v2']['APIC'][0]['data'];
    $cover_mime = $file['id3v2']['APIC'][0]['image_mime'];

    header("Content-Type: $cover_mime");
    echo $cover_data;
} else {
    http_response_code(404);
    die("Brak okładki.");
}
?>
