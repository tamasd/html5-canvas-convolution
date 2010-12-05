<?php

function filter($str) {
  return preg_replace('/[^a-zA-Z0-9_-]*/', '', $str);
}

if (!empty($_POST['name']) && !empty($_POST['data'])) {
  header('Content-type: application/octet-stream');
  header('Expires: 0');
  header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
  header('Content-Transfer-Encoding: binary');
  header('Accept-Ranges: bytes');
  header('Content-Disposition: attachment; filename=' . filter($_POST['name']) . '.png');

  print base64_decode($_POST['data']);
}
else {
  header('400 Bad Request');
}
