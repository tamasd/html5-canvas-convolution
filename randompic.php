<?php
// $Id$

/**
 * This proxy script helps to download images form flickr.
 *
 * Without this, an image cannot be edited on the canvas,
 * because of the same origin policy.
 */

// setting header
header('Content-type: image/jpeg');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Content-Transfer-Encoding: binary');
header('Accept-Ranges: bytes');

$tags = 'bunny';

if (isset($_GET['tags']) && preg_match('/^[a-z]*$/i', $_GET['tags'])) {
  $tags = $_GET['tags'];
}

// downloading j
$jsonp = file_get_contents("http://api.flickr.com/services/feeds/photos_public.gne" .
  "?tags={$tags}&tagmode=any&format=json&jsoncallback=?");

// parsing out the image name
$matches = array();
$res = preg_match_all(
  '#http:\/\/farm[0-9]+\.static\.flickr\.com\/[0-9]+\/[0-9]+_[0-9a-f]+_m.jpg#i',
  $jsonp, $matches);

$url = $matches[0][mt_rand(0, 39)];

$url = str_replace('_m.', '_b.', $url);

// loading image
readfile($url);
