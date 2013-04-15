/**
 * @fileoverview This file provides a limeJS animation of a Sprite within a
 *   restricted area, along with parallax scrolling.
 * @author Christine Talbot
 */

//set main namespace
goog.provide('mymain');

//get requirements
goog.require('lime');
goog.require('lime.Director');
goog.require('lime.Layer');
goog.require('lime.Sprite');
goog.require('lime.fill.Frame');
goog.require('lime.animation.KeyframeAnimation');
goog.require('lime.animation.MoveBy');
goog.require('lime.SpriteSheet');
goog.require('lime.parser.JSON');
goog.require('lime.ASSETS.sprite.json');
goog.require('lime.animation.Loop');
goog.require('goog.events.KeyEvent');
goog.require('lime.fill.Image');
goog.require('goog.math.Vec2');
goog.require('lime.RoundedRect');

// global variables for window & location of sprite - just default them
mymain.WIDTH = 1024;
mymain.HEIGHT = 768;
mymain.PARALLAX_HEIGHT = 500;
mymain.INIT_POSITION_X = 0;
mymain.INIT_POSITION_Y = 0;

// number of frames for the sprite animations
mymain.NUM_FRAMES_ANIMATION = 8;

// how far to move per loop when key is down or scroll button pressed
mymain.KEY_PRESS_MOVE_DIST = 8;
mymain.CUR_DIR = -1; // current direction: -1 moves sprite to the right

// speed & delay settings for the different sprite movements
mymain.WALK_SPEED = 4;
mymain.RUN_SPEED = 1;
mymain.WALK_DELAY_ANIMATION = 1/10;
mymain.RUN_DELAY_ANIMATION = 1/20;

// these are the directions & motions for each direction of movement
// and helps to pick the right sprite image(s)
mymain.DIRS = ['right-none','right-back','none-back','left-back','left-none',
			   'left-front','none-front','right-front'];
mymain.MOTIONS = ['run', 'walk', 'run', 'walk', 'run', 'walk', 'run', 'walk'];

// these are the background image files
mymain.BKGRD_FILES = ['assets/clouds.png', 'assets/mountains.png', 
					  'assets/field.png', 'assets/grass.png'];
// default settings for each background - includes offset that is updated as activities happen
// constants are from image file sizes
mymain.BKGRD_PARAMS = [ {width: mymain.WIDTH, height: mymain.PARALLAX_HEIGHT, 
							positionx:mymain.WIDTH/2, 
							positiony:mymain.PARALLAX_HEIGHT/2,  
							offsetx:0,  delay:0, moveOffsetBy:0},
						{width: mymain.WIDTH, height: 220, 
							positionx:mymain.WIDTH/2, 
							positiony:mymain.PARALLAX_HEIGHT - 220,  
							offsetx:0,  delay:.75, moveOffsetBy:1},
						{width: mymain.WIDTH, height:157, 
							positionx:mymain.WIDTH/2, 
							positiony:mymain.PARALLAX_HEIGHT - 78,  
							offsetx:0,  delay:.3, moveOffsetBy:5},
						{width: mymain.WIDTH, height: 30, 
							positionx:mymain.WIDTH/2, 
							positiony:mymain.PARALLAX_HEIGHT - 15,  
							offsetx:0, delay:1/1000, moveOffsetBy:10}];

// a few more constants for settings
mymain.SCROLL_WIDTHS = 192;
mymain.MVMT_AREA_POSTNX = 512;
mymain.MVMT_AREA_POSTNY = 632;

// global variables to help with cross-function activities & interruptions
mymain.bkgrdSprites = [];
mymain.bkgrdAnims = [];
mymain.sprite = null;
mymain.spriteMove = null;
mymain.spriteAnim = null;
mymain.mvmtArea = null;
mymain.gamescene = null;
mymain.keyDone = true;
mymain.keyDown = null;
mymain.buttonDone = true;
mymain.buttonDown = null;


/**
 * This adds a new background layer to the scene, using the constants above
 * @param {Number} num layer number to create - for saving
 */
mymain.createBackground = function(num) {
	
	// create the layer for the background
	var background = new lime.Layer().setPosition(
										mymain.BKGRD_PARAMS[num].positionx, 
										mymain.BKGRD_PARAMS[num].positiony); 
	// add layer to scene
	mymain.gamescene.appendChild(background); 

	// add the background image to the layer & initialize its position
	var fillImg = new lime.fill.Image(mymain.BKGRD_FILES[num]);
	mymain.bkgrdSprites[num] = new lime.Sprite();
	mymain.bkgrdSprites[num].setFill(fillImg)
							.setSize(mymain.BKGRD_PARAMS[num].width, 
									 mymain.BKGRD_PARAMS[num].height);
	mymain.bkgrdSprites[num].getFill().setOffset(0,0);
	background.appendChild(mymain.bkgrdSprites[num]);

};

/**
 * This handles the keyboard events when they occur - verifies it is a valid
 *   key and starts the animations if it is: (clockwise starting at up: 
 *   W,E,D,C,X,Z,A,Q)
 * @param {goog.event} e Keyboard event
 */
mymain.handleKeyboard = function(e) {
	// initialize everything
	var moveByCoord = new goog.math.Coordinate(0,0);
	var dir = 'none-none';
	var motion = 'stand';
	// check which key was pressed & update the vars 
	switch (e.keyCode ) {
		case goog.events.KeyCodes.Q:
			moveByCoord = new goog.math.Coordinate(
											-1*mymain.KEY_PRESS_MOVE_DIST, 
											-1*mymain.KEY_PRESS_MOVE_DIST);
			dir = mymain.DIRS[3];
			motion = mymain.MOTIONS[3];
			break;
		case goog.events.KeyCodes.W:
			moveByCoord = new goog.math.Coordinate(0, 
											-1*mymain.KEY_PRESS_MOVE_DIST);
			dir = mymain.DIRS[2];
			motion = mymain.MOTIONS[2];
			break;
		case goog.events.KeyCodes.E:
			moveByCoord = new goog.math.Coordinate(
											mymain.KEY_PRESS_MOVE_DIST, 
											-1*mymain.KEY_PRESS_MOVE_DIST);
			dir = mymain.DIRS[1];
			motion = mymain.MOTIONS[1];
			break;
		case goog.events.KeyCodes.D:
			moveByCoord = new goog.math.Coordinate(
											mymain.KEY_PRESS_MOVE_DIST, 0);
			dir = mymain.DIRS[0];
			motion = mymain.MOTIONS[0];
			break;
		case goog.events.KeyCodes.C:
			moveByCoord = new goog.math.Coordinate(
											mymain.KEY_PRESS_MOVE_DIST, 
											mymain.KEY_PRESS_MOVE_DIST);
			dir = mymain.DIRS[7];
			motion = mymain.MOTIONS[7];
			break;
		case goog.events.KeyCodes.X:
			moveByCoord = new goog.math.Coordinate(0, 
											mymain.KEY_PRESS_MOVE_DIST);
			dir = mymain.DIRS[6];
			motion = mymain.MOTIONS[6];
			break;
		case goog.events.KeyCodes.Z:
			moveByCoord = new goog.math.Coordinate(
											-1*mymain.KEY_PRESS_MOVE_DIST, 
											mymain.KEY_PRESS_MOVE_DIST);
			dir = mymain.DIRS[5];
			motion = mymain.MOTIONS[5];
			break;
		case goog.events.KeyCodes.A:
			moveByCoord = new goog.math.Coordinate(
											-1*mymain.KEY_PRESS_MOVE_DIST, 0);
			dir = mymain.DIRS[4];
			motion = mymain.MOTIONS[4];
			break;
		default:
			// do nothing
			break;
	}

	// loop animation sequence until hear keyup event as long as it's a good key
	if (dir !== 'none-none') {
		mymain.startKeyLoop(e, moveByCoord, dir, motion);
	}

};

/**
 * This clears the button & key parameters to get ready for next event
 * @param {boolean} btns Whether to clear the button parameters
 * @param {boolean} keys Whether to clear the key parameters
 */
mymain.clearParams = function(btns, keys) {
	// if clear button params, reset them to "unused"
	if (btns) {
		mymain.buttonDone = true;
		mymain.buttonDown = null;
	}
	// if clear key params, reset them to "unused"
	if (keys) {
		mymain.keyDone = true;
		mymain.keyDown = null;
	}
};

/**
 * This is the starting point from the program and is called in the html page.
 *   It creates the scene, adds the background layers, sprite, and listens
 *   for events.
 */
mymain.start = function() {

	// create new director for the game
	mymain.director = new lime.Director(document.body,
										   mymain.WIDTH,
										   mymain.HEIGHT);
	mymain.director.makeMobileWebAppCapable();
	// turn off the frames per second image
	mymain.director.setDisplayFPS(false);

	// create new scene
	mymain.gamescene = new lime.Scene;

	// create new layer mymain.HEIGHT - (mymain.PARALLAX_HEIGHT/2)
 	layer = new lime.Layer().setPosition(0, 0)
 							.setSize(mymain.WIDTH, mymain.HEIGHT);

	for (var i = 0; i < mymain.BKGRD_FILES.length;i++) {
		mymain.createBackground(i);
	}
	
    // add layer to the scene
	mymain.gamescene.appendChild(layer);

	// check device so can show text
	var isIPad = navigator.userAgent.indexOf("iPad") != -1 ;
	var deviceName = 'iPad';
	if (isIPad) {
	 	deviceName = 'iPad';
	} else {
	 	deviceName = 'Web';
	}

	// create text for compatibility and which device is being used
	var text1 = new lime.Label().setText('Christine Talbot 2011')
								.setPosition(60, mymain.HEIGHT-30)
								.setFontSize(10);
	var text2 = new lime.Label().setText('[Web, iPad Capable] : Running on ' +
										 deviceName)
								.setPosition(102, mymain.HEIGHT-20)
								.setFontSize(10);

	// add rectangle for sprite movement area
	mymain.mvmtArea = new lime.RoundedRect()
							  .setSize(mymain.WIDTH-mymain.SCROLL_WIDTHS, 
							  		   mymain.HEIGHT-mymain.PARALLAX_HEIGHT);
	mymain.mvmtArea.setPosition(mymain.MVMT_AREA_POSTNX, 
								mymain.MVMT_AREA_POSTNY)
				   .setFill("#0c0")
				   .setStroke(2, "#000");
	layer.appendChild(mymain.mvmtArea);

	// add text to screen
	layer.appendChild(text1);
	layer.appendChild(text2);
	
	// load the spritesheet
	mymain.ss = new lime.SpriteSheet('assets/sprite.png',
										lime.ASSETS.sprite.json,
										lime.parser.JSON);

	// create the initial sprite image and place him on screen
	mymain.sprite = mymain.makeSprite().setPosition(mymain.INIT_POSITION_X,
												   mymain.INIT_POSITION_Y);
	mymain.mvmtArea.appendChild(mymain.sprite);
	
	// add the scroll buttons (left & right)
	var leftsprite = new lime.Sprite()
						 .setPosition(50,
						 			  (mymain.PARALLAX_HEIGHT+125))
						 .setFill(new lime.fill.Image('assets/scrollleft.png'))
						 .setSize(64,64);
	layer.appendChild(leftsprite);
	
	var rightsprite = new lime.Sprite()
						 .setPosition(mymain.WIDTH-50, 
						 			  mymain.PARALLAX_HEIGHT+125)
						 .setFill(new lime.fill.Image('assets/scrollright.png'))
						 .setSize(64,64);
	layer.appendChild(rightsprite);
	
	// set active scene
	mymain.director.replaceScene(mymain.gamescene);
	
	// from frame4.js in lime.js demos - listen for mouse clicks
	goog.events.listen(mymain.mvmtArea,['mousedown','touchstart'],function(e){
		// stop whatever was doing, and start handling the new mouse event
		mymain.clearParams(true, true);
		mymain.stopMoving();
	   	mymain.moveToPosition(mymain.gamescene.localToNode(e.position,
	   													   mymain.mvmtArea));

	});

	// listen for keyboard input
	goog.events.listen(document, ['keydown'], function(e) {
		if (mymain.keyDown === e.keyCode) {
			// do nothing - key is already down & being handled
		} else {
			// stop whatever was doing, and start handling the keyboard event
			mymain.clearParams(true, false);
			mymain.stopMoving();
			mymain.handleKeyboard(e);
		}
	});
	
	goog.events.listen(rightsprite, ['mousedown', 'touchstart'], function(e) {
		// listen for clicking the right scroll button
		// show that user clicked button by making orange
		rightsprite.setFill(new lime.fill
									.Image('assets/scrollrightclicked.png'));
		// stop whatever was doing
		mymain.clearParams(false, true);
		mymain.stopMoving();
		// initialize the button variables
		mymain.buttonDone = false;
		mymain.buttonDown = 'right';
		// move sprite
		mymain.moveSprite('right-none');
		
		// listen for when the button is released
		goog.events.listen(rightsprite, ['mouseup', 'touchend'], function(e) {
			// clear button variables
			mymain.buttonDone = true;
			mymain.buttonDown = null;
			// stop everything
			mymain.stopMoving();
			// reset the sprite's position & the scroll button back to normal
			mymain.sprite.setFill(mymain.ss.getFrame('stand-right-none-1.png'));
			rightsprite.setFill(new lime.fill.Image('assets/scrollright.png'));
			
		}); // end mouseup event function
	}); // end mousedown event function - rightsprite
	
	goog.events.listen(leftsprite, ['mousedown', 'touchstart'], function(e) {
		// listen for clicking the right scroll button
		// show that user clicked button by making orange
		leftsprite.setFill(new lime.fill.Image('assets/scrollleftclicked.png'));
		// stop whatever was doing
		mymain.clearParams(false, true);
		mymain.stopMoving();
		// initialize the button variables
		mymain.buttonDone = false;
		mymain.buttonDown = 'left';
		// move sprite
		mymain.moveSprite('left-none');
		
		// listen for when the button is released
		goog.events.listen(leftsprite, ['mouseup', 'touchend'], function(e) {
			// clear the button variables
			mymain.buttonDone = true;
			mymain.buttonDown = null;
			// stop everything
			mymain.stopMoving();
			// reset the sprite's position & the scroll button back to normal
			mymain.sprite.setFill(mymain.ss.getFrame('stand-left-none-1.png'));
			leftsprite.setFill(new lime.fill.Image('assets/scrollleft.png'));
			
		}); // end mouseup event function
	}); // end mousedown event function - leftsprite
	

}; // end start function

/**
 * This gets the motion run/walk, direction, and move coordinates for a 
 *   direction
 * @param {String} dir Direction want to move in string like: left-back
 * @return {Object} Returns an object with moveByCoord (how much to move as a 
 *   goog.math.Coordinate), dir (direction to move like 'left-back'), and 
 *   motion (stand, walk, or run)
 */
mymain.getMoveInfo = function(dir) {
	// initialize the return values
	var result = {moveByCoord:new goog.math.Coordinate(0,0), motion:'stand', 
				  dir:'front-none'};
	// check which direction is given, then update values for that direction
	switch (dir) {
		case 'left-back':
			result.moveByCoord = new goog.math.Coordinate(
												-1*mymain.KEY_PRESS_MOVE_DIST, 
												-1*mymain.KEY_PRESS_MOVE_DIST);
			result.dir = mymain.DIRS[3];
			result.motion = mymain.MOTIONS[3];
			break;
		case 'none-back':
			result.moveByCoord = new goog.math.Coordinate(0, 
												-1*mymain.KEY_PRESS_MOVE_DIST);
			result.dir = mymain.DIRS[2];
			result.motion = mymain.MOTIONS[2];
			break;
		case 'right-back':
			result.moveByCoord = new goog.math.Coordinate(
												mymain.KEY_PRESS_MOVE_DIST, 
												-1*mymain.KEY_PRESS_MOVE_DIST);
			result.dir = mymain.DIRS[1];
			result.motion = mymain.MOTIONS[1];
			break;
		case 'right-none':
			result.moveByCoord = new goog.math.Coordinate(
												mymain.KEY_PRESS_MOVE_DIST, 0);
			result.dir = mymain.DIRS[0];
			result.motion = mymain.MOTIONS[0];
			break;
		case 'right-front':
			result.moveByCoord = new goog.math.Coordinate(
												mymain.KEY_PRESS_MOVE_DIST, 
												mymain.KEY_PRESS_MOVE_DIST);
			result.dir = mymain.DIRS[7];
			result.motion = mymain.MOTIONS[7];
			break;
		case 'none-front':
			result.moveByCoord = new goog.math.Coordinate(0, 
												mymain.KEY_PRESS_MOVE_DIST);
			result.dir = mymain.DIRS[6];
			result.motion = mymain.MOTIONS[6];
			break;
		case 'left-front':
			result.moveByCoord = new goog.math.Coordinate(
												-1*mymain.KEY_PRESS_MOVE_DIST, 
												mymain.KEY_PRESS_MOVE_DIST);
			result.dir = mymain.DIRS[5];
			result.motion = mymain.MOTIONS[5];
			break;
		case 'left-none':
			result.moveByCoord = new goog.math.Coordinate(
												-1*mymain.KEY_PRESS_MOVE_DIST, 
												0);
			result.dir = mymain.DIRS[4];
			result.motion = mymain.MOTIONS[4];
			break;
		default:
			// do nothing - keep defaults
			break;
	}
	return result;
};

/**
 * This moves the sprite in the specified direction - mainly for scroll 
 *   left/right buttons
 * @param {String} dir Direction want to move in string like: left-back
 */
mymain.moveSprite = function(dir) {
	// get the parameters for where/how much to move, based on button pressed
	var info = mymain.getMoveInfo(dir);
	var delta = info.moveByCoord;
	var motion = info.motion;
	
	// check where the sprite is now to see if on/near the boundary of mvmtArea
	var initBoundaryTest = mymain.checkBorders(mymain.sprite.getPosition().x, 
											   mymain.sprite.getPosition().y);
	var correctDir = (dir === 'right-none' && mymain.buttonDown === 'right') || 
					 (dir === 'left-none' && mymain.buttonDown === 'left'); 
					 // stop from moving if on brdr & moving towards that brdr
	var onDiffBorder = (initBoundaryTest.left && mymain.buttonDown === 'left') 
					   || (initBoundaryTest.right && 
					   	   mymain.buttonDown === 'right');
	
	// if on one of the x boundaries and moving towards the boundary
	if (initBoundaryTest.x && correctDir && onDiffBorder) {
		// stop moving the sprite & backgrounds
		mymain.buttonDone = true;
		mymain.stopMoving();
		// make sprite face the direction moving
		mymain.sprite.setFill(mymain.ss.getFrame('stand-'+
												 mymain.buttonDown+
												 '-none-1.png'));
		// depending on which direction moving, flip the background offsets
		// to ensure save the right spot when animating the background
		if (dir === 'right-none') {
			if (mymain.CUR_DIR === 1) {
				mymain.flipOffsets();
			}
			mymain.CUR_DIR = -1;
		} else {
			if (mymain.CUR_DIR === -1) {
				mymain.flipOffsets();
			}
			mymain.CUR_DIR = 1;
		}
		// start the background moving
		mymain.startBkgrdAnims();
	
	// if not on an x boundary, go ahead and move the sprite & animate
	} else {
		// make sprite move
		mymain.spriteMove = new lime.animation.MoveBy(delta)
							  .setEasing(lime.animation.Easing.LINEAR)
							  .setSpeed(mymain.getMotion(motion));
		mymain.sprite.runAction(mymain.spriteMove);
		
		// make sprite animated
		mymain.spriteAnim = new lime.animation.KeyframeAnimation();
		mymain.spriteAnim.delay = mymain.getDelay(motion);
		for (var i=1; i<=mymain.NUM_FRAMES_ANIMATION;i++) {
			mymain.spriteAnim.addFrame(mymain.ss.getFrame(motion+'-'+
														  dir+'-'+i+'.png'));
		}
		mymain.sprite.runAction(mymain.spriteAnim);
	}	
	
	// listen for move to stop, then restart it
	goog.events.listen(mymain.spriteMove, lime.animation.Event.STOP, 
					   function() {
		// if button isn't released yet, continue running loop
		if (!mymain.buttonDone) {
			// if hit boundary, force the stop like you do with the keyboard
			var boundaryTest = mymain.checkBorders(
								 mymain.sprite.getPosition().x, 
								 mymain.sprite.getPosition().y);
			var listenOnDiffBorder = (boundaryTest.left && 
									  mymain.buttonDown === 'left') || 
									  (boundaryTest.right && 
									  mymain.buttonDown === 'right');
			
			// if hit one of the x boundaries and walking towards border
			if (boundaryTest.x && correctDir && listenOnDiffBorder) {
				// hit a boundary so stop - only care about x since can only 
				// move left/right with buttons
				mymain.buttonDone = true;
				mymain.stopMoving();
				// make sprite face direction scrolling
				mymain.sprite.setFill(mymain.ss.getFrame('stand-'+
														 mymain.buttonDown+
														 '-none-1.png'));
				// if changing direction of scroll, make sure update offsets 
				// for backgrounds
				if (dir === 'right-none') {
					if (mymain.CUR_DIR === 1) {
						mymain.flipOffsets();
					}
					mymain.CUR_DIR = -1;
				} else {
					if (mymain.CUR_DIR === -1) {
						mymain.flipOffsets();
					}
					mymain.CUR_DIR = 1;
				}
				// make backgrounds scroll
				mymain.startBkgrdAnims();
			} else {
				// no boundary, so keep going
				mymain.sprite.runAction(mymain.spriteMove);	
			}
		} // end if !mymain.buttonDone
	}); // end listen for spriteMove stop event
}; // end moveSprite function

/**
 * This changes the direction of the animation based on the CUR_DIR value
 */
mymain.flipBkgrdFrames = function(i) {
	// make sure we've run at least once, else don't have to flip
	if (mymain.bkgrdAnims.length !== 0) {
		// set the frame sequence 0 to # offsets OR # offsets to 0, depending
		// on direction trying to move 
		if (mymain.CUR_DIR === 1) { // bkgrd moves rt since sprite moving left
			for (var k=0; k<=mymain.BKGRD_PARAMS[i].width;
						  k+=mymain.BKGRD_PARAMS[i].moveOffsetBy) {
				mymain.bkgrdAnims[i].addFrame(
					new lime.fill.Image(mymain.BKGRD_FILES[i])
								 .setOffset(k,0))
								 .setEasing(lime.animation.Easing.LINEAR);
			}
		} else {
			for (var k=mymain.BKGRD_PARAMS[i].width; k>=0;
				    k-=mymain.BKGRD_PARAMS[i].moveOffsetBy) {
				mymain.bkgrdAnims[i].addFrame(
					new lime.fill.Image(mymain.BKGRD_FILES[i])
								 .setOffset(k,0))
								 .setEasing(lime.animation.Easing.LINEAR);
			}
		}
	} // end if bkgrdAnims exist
}; // end function

/**
 * This flips the offsets for the backgrounds whenever we change direction so
 *   the position of the background will start at the current position
 */
mymain.flipOffsets = function() {
	// as long as bkgrdAnims has been created
	if (mymain.bkgrdAnims.length !== 0) {
		// flip which end counting the frames from for which one to start with 
		// next time
		for (var i=1; i < mymain.BKGRD_FILES.length;i++) {
			mymain.BKGRD_PARAMS[i].offsetx = 
				mymain.bkgrdAnims[i].frames_.length - 
				mymain.BKGRD_PARAMS[i].offsetx-1;
		}
	}
};

/**
 * This checks if coordinate (x,y) crosses any of the boundaries of the 
 *   mvmtArea on the screen
 * @param {Number} x X-coordinate of point to be checked
 * @param {Number} y Y-coordinate of point to be checked
 */
mymain.checkBorders = function(x,y) {
	// initialize results
	var result = {x:false, y:false, left:false, right:false, top:false, 
				  bottom:false};
	// if hit the right x boundary
	if (x >= 390) {
		result.x = true;
		result.right = true;
	}
	// if hit the left x boundary
	if (x <= -390) {
		result.x = true;
		result.left = true;
	}
	// if hit the bottom y boundary
	if (y >=100) {
		result.y = true;
		result.top = true;
	}
	// if hit the top y boundary
	if (y <= -100) {
		result.y = true;
		result.bottom = true;
	}
	return result;
};

/**
 * This stops all the animations going on currently: sprite & backgrounds
 */
mymain.stopMoving = function() {
	// isPlaying_ never seemed to pick up, so just blindly stop anything that
	// exists at all
	
	// stop sprite from moving & animating
	if (mymain.spriteAnim !== null ) {
		mymain.spriteAnim.stop();
		mymain.spriteMove.stop();
	}
	// stop backgrounds from scrolling & update current position
	if (mymain.bkgrdAnims.length !==0){
		for (var i=1; i < mymain.BKGRD_FILES.length; i++) {
			mymain.bkgrdAnims[i].stop();
			mymain.BKGRD_PARAMS[i].offsetx = mymain.bkgrdAnims[i].currentFrame_;
		}
	}
};

/**
 * This determines which speed should be used for a particular motion
 * @param {String} motion Motion being run - 'run' or 'walk'
 * @return {Number} speed to use for this motion
 */
mymain.getMotion = function(motion) {
	// default the return value
	var speed = mymain.WALK_SPEED;
	
	// return the speed depending on which motion is being done
	if (motion === 'run') {
		speed = mymain.RUN_SPEED;
	} else {
		speed = mymain.WALK_SPEED;
	}
	
	return speed;
};

/**
 * This determines which delay amount should be used for a particular motion
 * @param {String} motion Motion being run - 'run' or 'walk'
 * @return {Number} delay amount to use for this motion
 */
mymain.getDelay = function(motion) {
	// initialize return value
	var delay = mymain.WALK_DELAY_ANIMATION;
	
	// return the delay depending on which motion is being done
	if (motion === 'run') {
		delay = mymain.RUN_DELAY_ANIMATION;
	} else {
		delay = mymain.WALK_DELAY_ANIMATION;
	}
	return delay;
};

/**
 * This moves the sprite to the clicked position - modified from limejs demo
 *   named "frame4.js"
 * @param {goog.math.Coordinate} pos coordinate to move sprite to
 */
mymain.moveToPosition = function(pos){
	// get the distance between click & sprite, along with angle
    var delta = goog.math.Coordinate.difference(pos,
    				mymain.gamescene.localToNode(mymain.sprite.getPosition(), 
    											 mymain.mvmtArea)),
        angle = Math.atan2(-delta.y,delta.x);

    //determine the direction
    var dir = Math.round(angle/(Math.PI*2)*8);
    if(dir<0) dir=8+dir;
    
    // save the string for the motion & direction for sprite frame retrieval
    var motion = mymain.MOTIONS[dir];
    dir = mymain.DIRS[dir];

	// get the right speed for the movement
    var curSpeed = mymain.getMotion(motion);
    // move sprite
    mymain.spriteMove =new lime.animation.MoveBy(delta)
    						.setEasing(lime.animation.Easing.LINEAR)
    						.setSpeed(curSpeed);
    mymain.sprite.runAction(mymain.spriteMove);

	// show animation
	mymain.spriteAnim = new lime.animation.KeyframeAnimation();
	mymain.spriteAnim.delay= mymain.getDelay(motion);
	for(var i=1;i<=mymain.NUM_FRAMES_ANIMATION;i++){
	    mymain.spriteAnim.addFrame(mymain.ss.getFrame(motion+'-'+dir+
	    											  '-'+i+'.png'));
	}
    mymain.sprite.runAction(mymain.spriteAnim);

    // on stop show standing position
    goog.events.listen(mymain.spriteMove,lime.animation.Event.STOP,function(){
    	// stop moving everything & make sprite stand
        mymain.stopMoving();
        mymain.sprite.setFill(mymain.ss.getFrame('stand-'+dir+'-1.png'));
    });

};

/**
 * This creates and runs the background animations for parallax scrolling
 */
mymain.startBkgrdAnims = function () {
	// skip first one as we know it won't ever move
	for (var i = 1; i < mymain.BKGRD_FILES.length; i++) {
		
		// create new animation & set delay based on which bkgrd it is
		mymain.bkgrdAnims[i] = new lime.animation.KeyframeAnimation();
		mymain.bkgrdAnims[i].delay = mymain.BKGRD_PARAMS[i].delay;
		// add the frames in the right sequence for the direction moving
		mymain.flipBkgrdFrames(i);
		// initialize the start position with where we left off
		mymain.bkgrdAnims[i].currentFrame_ = mymain.BKGRD_PARAMS[i].offsetx;
		// run animation
		mymain.bkgrdSprites[i].runAction(mymain.bkgrdAnims[i]);
	}
	
};

/**
 * This creates the initial sprite and adds it to a layer
 * @return {lime.Sprite} handle to the newly created sprite
 */
mymain.makeSprite = function(){
	// create a sprite
	var sprite = new lime.Sprite()
						 .setPosition(mymain.INIT_POSITION_X,
						 			  mymain.INIT_POSITION_Y)
						 .setFill(mymain.ss.getFrame('stand-none-front-1.png'));
	sprite.setScale(new goog.math.Vec2(1.5,1.5))
	// add to the layer
	layer.appendChild(sprite);

	return sprite; 
};

/**
 * This runs the keyboard input loop for animations
 * @param {goog.event} e Keyboard event
 * @param {goog.math.Coordinate} dirCoord coordinate to loop/move sprite to
 * @param {String} dir direction to move (like 'left-back')
 * @param {String} motion whether the sprite is walking or running
 */
mymain.startKeyLoop = function(e, delta, dir, motion) {
	// if no keys are down, capture this one since it's a valid key for mvmt
	if (mymain.keyDown === null) {
		mymain.keyDown = e.keyCode;
	}
	// check the borders and which way we're moving
	var initBorderTest = mymain.checkBorders(mymain.sprite.getPosition().x, 
											 mymain.sprite.getPosition().y);
	var goodDirsRight = (dir === 'right-none' || dir === 'right-back' || 
						 dir === 'right-front');
	var goodDirsLeft = (dir === 'left-none' || dir === 'left-back' || 
						dir === 'left-front');
	var goodDirsDown = (dir === 'right-none' || dir === 'right-front' || 
						dir === 'left-none' || dir === 'left-front' || 
						dir === 'none-front');
	var goodDirsUp = (dir === 'right-none' || dir === 'right-back' || 
					  dir === 'left-none' || dir === 'left-back' || 
					  dir === 'none-back');
	
	// if on the right border and moving right
	if (initBorderTest.right && goodDirsRight) {
		// stop moving the sprite, set to standing
		mymain.keyDone = true;
		mymain.stopMoving();
		mymain.sprite.setFill(mymain.ss.getFrame('stand-right-none-1.png'));
		// update direction to move
		if (mymain.CUR_DIR === 1) {
			mymain.flipOffsets();
			mymain.CUR_DIR = -1;
		}
		// start background animations
		mymain.startBkgrdAnims();
	} else { // not on right border & not moving right
		
		// if on the left border and moving left
		if (initBorderTest.left && goodDirsLeft) {
			// stop moving the sprite, set to standing
			mymain.keyDone = true;
			mymain.stopMoving();
			mymain.sprite.setFill(mymain.ss.getFrame('stand-left-none-1.png'));
			// update direction to move
			if (mymain.CUR_DIR === -1) {
				mymain.flipOffsets();
				mymain.CUR_DIR = 1;
			}
			// start background animations
			mymain.startBkgrdAnims();
		} else { // not on an x border and moving towards the same border
			
			// if on a y border
			if (initBorderTest.y) {
				
				// make sure we're trying to move away from the y border
				if ((goodDirsDown && initBorderTest.bottom) || 
					(goodDirsUp && initBorderTest.top)) {
					// ok to move sprite - set global vars
					mymain.keyDone = false;
					mymain.keyDown = e.keyCode;
					// move sprite
					mymain.spriteMove = new lime.animation.MoveBy(delta)
						.setEasing(lime.animation.Easing.LINEAR)
						.setSpeed(mymain.getMotion(motion));
					mymain.sprite.runAction(mymain.spriteMove);
					
					// animate sprite
					mymain.spriteAnim = new lime.animation.KeyframeAnimation();
					mymain.spriteAnim.delay = mymain.getDelay(motion);
					for (var i=1; i<=mymain.NUM_FRAMES_ANIMATION;i++) {
						mymain.spriteAnim.addFrame(mymain.ss.getFrame(motion+
																	  '-'+dir+
																	  '-'+i+
																	  '.png'));
					}
					mymain.sprite.runAction(mymain.spriteAnim);
				} else { // trying to move towards a y border, so do nothing
					// can't move that direction, so stop everything & stand
					mymain.keyDone = true;
					mymain.stopMoving();
					mymain.sprite.setFill(mymain.ss.getFrame('stand-'+dir+
															 '-1.png'));
				}
			} else { // not on x or y border moving towards border
				// set global vars
				mymain.keyDone = false;
				mymain.keyDown = e.keyCode;
				// move sprite
				mymain.spriteMove = new lime.animation.MoveBy(delta)
					.setEasing(lime.animation.Easing.LINEAR)
					.setSpeed(mymain.getMotion(motion));
				mymain.sprite.runAction(mymain.spriteMove);
				
				// animate sprite
				mymain.spriteAnim = new lime.animation.KeyframeAnimation();
				mymain.spriteAnim.delay = mymain.getDelay(motion);
				for (var i=1; i<=mymain.NUM_FRAMES_ANIMATION;i++) {
					mymain.spriteAnim.addFrame(mymain.ss.getFrame(motion+'-'+
																  dir+'-'+i+
																  '.png'));
				}
				mymain.sprite.runAction(mymain.spriteAnim);
			}
		} // end else not on an x border moving towards the same x border
	} // end else not on right x border moving right
	
	
	// listen for the move animation to stop
	goog.events.listen(mymain.spriteMove, lime.animation.Event.STOP, 
					   function() {
		// as long as we're not done with the key
		if (!mymain.keyDone) {
			// check boundaries
			var boundaryTest = mymain.checkBorders(
								 mymain.sprite.getPosition().x, 
								 mymain.sprite.getPosition().y);
			var goodDirsRight = (dir === 'right-none' || dir === 'right-back' ||
								 dir === 'right-front');
			var goodDirsLeft = (dir === 'left-none' || dir === 'left-back' || 
								dir === 'left-front');

			// if on right boundary and moving right
			if (boundaryTest.right && goodDirsRight) { 
				// stop moving & stand
				mymain.keyDone = true;
				mymain.stopMoving();
				mymain.sprite.setFill(mymain.ss.getFrame(
												  'stand-right-none-1.png'));
				// update direction moving
				if (mymain.CUR_DIR === 1) {
					mymain.flipOffsets();
					mymain.CUR_DIR = -1;
				}
				// start background animations
				mymain.startBkgrdAnims();
				
			} else { // not on right boundary and moving right
				
				// if on left boundary and moving left
				if (boundaryTest.left && goodDirsLeft) {
					// stop moving & stand
					mymain.keyDone = true;
					mymain.stopMoving();
					mymain.sprite.setFill(mymain.ss.getFrame(
												 	  'stand-left-none-1.png'));
					// update direction moving
					if (mymain.CUR_DIR === -1) {
						mymain.flipOffsets();
						mymain.CUR_DIR = 1;
					}
					// start background animations
					mymain.startBkgrdAnims();
				
				// not on x boundary & moving towards it
				} else {
					// if hit y boundary
					if (boundaryTest.y) {
						// if moving away from y boundary
						if ((goodDirsDown && boundaryTest.bottom) || 
							(goodDirsUp && boundaryTest.topw)) {
							// ok to move
							mymain.sprite.runAction(mymain.spriteMove);
						} else { // moving towards y boundary
							// can't move that direction
							// hit y boundary so stop
							mymain.keyDone = true;
							mymain.stopMoving();
							mymain.sprite.setFill(mymain.ss.getFrame('stand-'+
																	 dir+
																	 '-1.png'));
						}
					// haven't hit the y boundary, and not moving towards x bdry
					} else {
						mymain.sprite.runAction(mymain.spriteMove);
					}
				} // end else not on x boundary & moving towards it
			} // end else not on right boundary & moving towards it
		} // end if !keyDone
	}); // end listen for stop moving function
	
	
	// listen for key to be released
	goog.events.listen(document, ['keyup'], function(e) {
	
		// as long as it's the key that's pressed
		if (e.keyCode === mymain.keyDown) {
			// stops the mvmt for the keyboard when the current key is released
			mymain.keyDone = true;
			mymain.keyDown = null;
			mymain.stopMoving();
			mymain.sprite.setFill(mymain.ss.getFrame('stand-'+dir+'-1.png'));
		} else {
			// don't stop anything - that key didn't get released yet, some 
			// other key did
		}
	}); // end listen for key to be released

}; // end startKeyLoop function

//this is required for outside access after code is compiled in
//ADVANCED_COMPILATIONS mode
goog.exportSymbol('mymain.start', mymain.start);
