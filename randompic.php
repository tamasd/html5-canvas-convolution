<?php
// $Id$

header('Content-type: image/jpeg');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Content-Transfer-Encoding: binary');
header('Accept-Ranges: bytes');

$jsonp = file_get_contents('http://api.flickr.com/services/feeds/photos_public.gne?tags=bunny&tagmode=any&format=json&jsoncallback=?');

$matches = array();
$res = preg_match_all('#http:\/\/farm[0-9]+\.static\.flickr\.com\/[0-9]+\/[0-9]+_[0-9a-f]+_m.jpg#i', $jsonp, $matches);

$url = $matches[0][mt_rand(0, 39)];

$url = str_replace('_m.', '_b.', $url);

readfile($url);
