// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import env from './env';

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);




/*
 * ScrollShooter
 * ------------------
 * iio.js version 1.4
 */
var ScrollShooter = function( app, s ){

  // Arrays for holding references to objects created
  var meteors = [];
  var stars = [];
  var lasers = [];

  // The player object
  var player;

  // Number of space objects
  var numSmallStars = 50;
  var numBigStars = 26;
  var numSmallMeteors = 20;
  var numBigMeteors = 10;

  // But cut back if it's only a preview version
  if( s && s.preview ){
    numSmallMeteors /= 2;
    numBigStars /= 2;
    numSmallMeteors /= 2;
    numBigMeteors /= 2;
  } else
    app.set({ color:'black' });

  // callback function for bringing and object up to top of screen
  // once its scrolled off the bottom
  function bringToTop(o){
    o.pos.y = -100;
    o.pos.x = iio.random( 0, app.width );
  }

  // Callback function for creating space objects, scrolling in a random down angle
  // On reaching the bottom, bring it back to the top with bringToTop
  function createScrollObjects(num, arr, props){
    for ( var i=0; i<num; i++ )
      arr.push( app.add( new iio.Quad({
        z: props.z,
        img: props.img,
        health: props.health,
        rotation: iio.random( props.rotation.min,
                    props.rotation.max ),
        pos: [
          iio.random( 0, app.width ),
          iio.random( -100, app.height )
        ],
        vel:[
          iio.random( props.vel.x.min,
                props.vel.x.max ),
          iio.random( props.vel.y.min,
                props.vel.y.max )
        ],
        rVel: iio.random( props.rVel.min,
                  props.rVel.max ),
        bounds: {
          bottom: {
            bound: app.height + 100,
            callback: bringToTop
          }
        }
      })));
  }

  // Create a loader with a base path at ".assets"
  var loader = new iio.Loader('assets');

  // Define assets in a hash, with each asset associated with a asset ID.
  // in the form:
  //   assetId: 'path/to/asset'
  var assets = {
    starSmall: 'images/starSmall.png',
    starBig: 'images/starBig.png',
    meteorBig: 'images/meteorBig.png',
    meteorSmall: 'images/meteorSmall.png',
    laserSound: 'sounds/laser.wav',
    explode: 'sounds/explode.wav',
    player: 'images/player.png',
    playerLeft: 'images/playerleft.png',
    playerRight: 'images/playerRight.png',
    laser: 'images/laserRed.png',
    laserFlash: 'images/laserRedShot.png',
    theme: 'sounds/theme.mp3',
  }

  // The main body of this app
  // This will be the callback function to the loader
  // which will be called once all assets are completely loaded (or failed)
  var main = function(assets) {
    // Play the theme if not preview
    if(assets.theme && !( s && s.preview ))
      assets.theme.play(0, {loop: true});

    // Create a bunch of small stars
    createScrollObjects( numSmallStars, stars, {
      img: assets.starSmall,
      rotation: { min: 0, max: 0 },
      rVel: { min: 0, max: 0 },
      vel: {
        x: { min: 0, max: 0 },
        y: { min: 1, max: 2 }
      }
    });

    // Create a bunch of big stars
    createScrollObjects( numBigStars, stars, {
      z: 10,
      img: assets.starBig,
      rotation: { min: 0, max: 0 },
      rVel: { min: 0, max: 0 },
      vel: {
        x: { min: 0, max: 0 },
        y: { min: 2, max: 3 }
      }
    });

    // Shared by both big and small meteors
    var meteorProps = {
      z: 25,
      rotation: { min: -7, max: 7 },
      rVel: { min: -.04, max: .04 },
      vel: {
        x: { min: -3, max: 3 },
        y: { min: 4, max: 6 }
      }
    }

    // Create a bunch of big meteors
    createScrollObjects( numBigMeteors, meteors, iio.merge({
      img: assets.meteorBig,
      health: 5
    }, meteorProps));

    // Create a bunch of small meteors
    createScrollObjects( numSmallMeteors, meteors, iio.merge({
      img: assets.meteorSmall,
      z: 25
    }, meteorProps));

    // Define references to the sounds for laser firing
    if(!( s && s.preview )) {
      if (assets.laserSound){
        var laserSound = assets.laserSound;
        laserSound.set({gain: 0.125});
      }
      if (assets.explode){
        var explode = assets.explode;
        explode.set({gain: 0.25});
      }
    }

    // Laser functions. Add a new object showing the laser firing
    var laser = assets.laser;
    var laserFlash = assets.laserFlash;
    var fireLaser = function(x,y,s){
      lasers.push(app.add(new iio.Quad({
        pos: [ x, y ],
        z: 50,
        img: laser,
        vel: [ 0, -s ],
        bounds: { top: -100 }
      })));
      // Play laser sound if not preview
      if(laserSound && !( s && s.preview ))
        laserSound.play();
    }

    // Set up controller
    var controller = {
      LEFT: 0,
      RIGHT: 0,
      UP: 0,
      DOWN: 0,
      SPACE: 0
    }
    var updateController=function(k,bool){
      if( k === 'left arrow' || k === 'a' )
        controller.LEFT = bool;
      else if( k === 'right arrow' || k === 'd' )
        controller.RIGHT = bool;
      else if( k === 'up arrow' || k === 'w' )
        controller.UP = bool;
      else if( k === 'down arrow' || k === 's' )
        controller.DOWN = bool;
      else if( k === 'space' || k === 'ctrl' )
        controller.SPACE = bool;
    }

    // Create player object, and hook it up to the controller
    var player = assets.player;
    var playerLeft = assets.playerLeft;
    var playerRight = assets.playerRight;
    var playerObj = app.add(new iio.Quad({
      pos: [
        app.center.x,
        app.height-100
      ],
      z:100,
      vel: [0,0],
      img: player,
      xSpeed:8,
      fSpeed:9,
      bSpeed:5,
      laserCooldown:20,
      laserTimer:20,
      laserSpeed:20,
      onUpdate:function(){

        if( controller.RIGHT && this.right() < app.width ){
          this.vel.x = this.xSpeed;
          this.img = playerRight;
        }
        else if( controller.LEFT && this.left() > 0 ){
          this.vel.x = -this.xSpeed;
          this.img = playerLeft;
        }
        else {
          this.vel.x = 0;
          this.img = player;
        }

        if( controller.UP && this.top() > 0 )
          this.vel.y = -this.fSpeed;
        else if( controller.DOWN && this.bottom() < app.height )
          this.vel.y = this.bSpeed;
        else this.vel.y = 0;

        if( controller.SPACE && this.laserTimer === 20 ){
          fireLaser( this.pos.x - this.width/3,
            this.pos.y + 10, this.laserSpeed );
          fireLaser( this.pos.x + this.width/3,
            this.pos.y + 10, this.laserSpeed );
          this.laserTimer--;
        }
        else if( this.laserTimer < 20 ){
          if( !controller.SPACE )
            this.laserTimer -= 2;
          else this.laserTimer--;
          if( this.laserTimer < 0 )
            this.laserTimer = this.laserCooldown;
        }
      }
    }));

    // For updating direction on key presses
    app.onKeyDown = function(e,k){
      updateController(k,true)
    }
    app.onKeyUp = function(e,k){
      updateController(k,false)
    }

    app.onResize=function(){
      if(playerObj.right > app.width)
        playerObj.pos.x = app.width - playerObj.width/2
    }

    // Set up collisions on laser hit
    app.collision( lasers, meteors, function( laser, meteor ){
      // Large meteors have health
      if( typeof( meteor.health ) !== 'undefined' ){
        // Decrement meteor health on hit if not completely depleted
        if( meteor.health > 0 ) meteor.health--;
        else {
          // Break it for 5 small meteors
          for ( var i=0; i<5; i++ )
            meteors.push( app.add( new iio.Quad({
              pos: [
                iio.random( meteor.pos.x-30, meteor.pos.x+30 ),
                iio.random( meteor.pos.y-30, meteor.pos.y+30 )
              ],
              img: assets.meteorSmall,
              z: 25,
              vel: [
                iio.random( -1, 2 ),
                iio.random( 4, 6 )
              ],
              rVel: iio.random( -.2, .2 ),
              rot: iio.random( -7, 7 ),
              bounds: {
                bottom: {
                  bound: app.height + 100,
                  callback: bringToTop
                }
              }
            })));
          app.rmv(meteor);
        }
      } else {
        // Otherwise is small meteor, so just remove it
        app.rmv(meteor)
      }

      // Add in flashes on contact with a meteor
      app.add(new iio.Quad({
        z: 75,
        pos: [
          laser.pos.x,
          laser.pos.y-20
        ],
        img: assets.laserFlash,
        vel: meteor.vel,
        shrink: .2
      }));
      // Play the explosion sound if not preview
      if(explode && !( s && s.preview ))
        explode.play();

      app.rmv(laser);
    });
  }

  // Load the assets, and run the main body of ScrollShooter
  loader.load(assets, main);
};

// start the app full screen



document.addEventListener('DOMContentLoaded', function () {
    iio.start( ScrollShooter );
});

