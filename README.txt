README
======

To Run:
-------
Open the index.html file in this directory
Keyboard input is:

Q W E
A   D
Z X C

like a compass, with W being up, A being left, to move the sprite around.

To Deploy/Migrate:
------------------
For portability, can copy just these files:

index.html => index.html
compiled/mymain.js => compiled/mymain.js

Copy these into the assets/ folder as well:
assets/sprite.png
assets/clouds.png
assets/field.png
assets/grass.png
assets/mountains.png
assets/scrollright.png
assets/scrollrightclicked.png
assets/scrollleft.png
assets/scrollleftclicked.png

For reviewing code, use the mymain.js from the root directory as it is not
compiled or compressed and is formatted using the Javascript coding
guidelines.

Image Source(s):
----------------
Clouds - trimmed from:
http://www.wallpaperbang.com/wallpaper/sky-wallpaper-18.jpg

Mountains - flipped & trimmed and concatenated from:
http://1.bp.blogspot.com/-pI5QbQQaq0w/Ta_sdI6cQ8I/AAAAAAAABfU/AeUfl3pYrB4/
	s1600/Mountains+18.jpg

Fields - flipped & trimmed and concatenated from:
http://columbiariverimages.com/Images05/
	blue_mountains_from_outside_pasco_2005.jpg

Grass - trimmed and concatenated from:
http://grassrootsnaturalhealthandwellness.com/images/grass.jpg

Scroll - flipped from:
http://aux.iconpedia.net/uploads/1736577092459395349.png

SpriteSheet Source(s):
----------------------
SpriteSheet downloaded from:
http://i48.photobucket.com/albums/f232/axelmax/sprite%20sheets/001.png

Downloaded Sprite-Clipper from:
http://fluffynukeit.com/software/sprite-clipper

and used Sprite-Clipper to choose the 5 standing positions AND 
all of the walking/running frames in the given directions.  Then,
flipped the image and added the many of the same frames (mirrored).  All frames
were resized to align the bottom center of each sprite to ensure similar
sizes.  Saved all these frames as individual png images.

Downloaded Texture-Packer from:
http://code-and-web.de/downloads/texturepacker/2.3.5/
	TexturePacker-2.3.5.2907.dmg

and used Texture-Packer to take all the individual png images from Sprite-
Clipper to create a final sprite sheet of 36 sprites and its corresponding
JSON file.

From there, ran the lime.js method of generating the js file for the sprite
sheet:

../../My_Homework-5/Talbot-Christine-ITCS5230-Hwk5/bin/lime.py gensoy 
	sprite.json

Files were then included in the assets directory & appropriate JS files
for use by the program.

Code was inspired by the example provided in the lime.js demos for "frame4.js".

Compiled code using:

../My_Homework-5/Talbot-Christine-ITCS5230-Hwk5/bin/lime.py build mymain -o 
	compiled/mymain.js
