<?php
if ($_REQUEST["ppath"]) { $config_pictureDir = "".$_REQUEST["ppath"];} else {$config_pictureDir = "/California/laoverview.stream";}
$config_dayStartHour = 7;
$config_dayendHour = 21;
// ignore days of the week numeric ISO-8601 1 Monday 7 Sunday 
//$config_ignoreDays = [6,7]; //ignore Saturday and Sunday
$config_videoDir ="/tilacam/video";
$config_videoMaxLength = 20; //in seconds this results in limit the Pictures 
//image pattern (php date format not complemtly implemented) $y=year 2 digits, %Y=year 4 digits, m=month 2 digits, d=day 2 digits,H=hour 2 digits,i=minute 2 digits
//all not numeric char are removed
$config_pictureNamePattern = '%U';

//show informations for debuging reasons default false;
$config_debug = false;

//ffmpeg if not set no video Creation available
$config_pathToFFmpeg = '/usr/bin/ffmpeg';

 ?>
