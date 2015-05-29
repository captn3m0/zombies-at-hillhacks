/*
*	
*	Description Zombies at HillHacks
*
*/

// UI STUFF

ui.toolbar.title("Zombies at HillHacks");
ui.toolbar.bgColor(0,0,0,255);
ui.toolbar.show(true);

ui.backgroundColor(0, 200, 0);


/**
 * Zombie Stuff
 * 1. GAMESTART = 3 zombies in 20-30 m around you
 * 
 * 2. RED/GREEN color for closeness to zombies
 * 
 * Modes
 * * Simple Chase Mode (Zombie spawns at last position) (EASY)
 * * 3 mode (Track Last Positions and use them to spawn hotspots)
 * * Supply Mode
 * 
 * 4. (ADVANCED): Fighting
 * 
 * Stats at end:
 *   time you ran
 *   distance
 *   zombies spawned
 *   final health
 */

function Zombie(obj){
	this.health = 100;
	this.lat = obj.position.lat;
	this.lon = obj.position.lon;
}

// Switch endpoints on current distance from them (later)

var endpoint = {lat:32.24143061, lon: 76.32969317};

ZOMBIES = [];

//Zombie.prototype.

var player = {};
player.health = 100;
player.lastPosition = null;
player.position = null;
player.disFromEnd = null;
player.nearZombieDistance = 1000;

var healthBox, latBox, lonBox, zombieBox, disBox;

function uiSetup(){
    var y = 10;
    var lb = 150;
    
    healthBox = ui.addText("Health: "+player.health, 10, 10, ui.sw, ui.sh - 50);
    healthBox.textSize(80);
    healthBox.color("#ffffff")
    
    y+=lb
    latBox = ui.addText("Lat: ", 10, y);
    latBox.textSize(40);
    latBox.color("#ffffff")
    y+=lb
    
    lonBox = ui.addText("Lon: ", 10, y);
    lonBox.textSize(40);
    lonBox.color("#ffffff")
    
    y+=lb
    
    zombieBox = ui.addText("#Zombies: 0", 10, y);
    zombieBox.textSize(40);
    zombieBox.color("#ffffff")
    
    y+=lb
    
    disBox = ui.addText("Distance: ", 10, y);
    disBox.textSize(30);
    disBox.color("#ffffff");
}


sensors.gps.start();

function zombieTick(){

	if(player.lastPosition !== null){
		zombie = new Zombie({position: player.lastPosition});
		ZOMBIES.push (zombie);
		console.log("Created new Zombie");
	}

	//console.log("zombie tick");
	if(player.position!==null){
		player.lastPosition = player.position;
	}
	
	updateUI();

}

function updateUI(){
    
    if(player.position!==null){
	    latBox.setText("Latitude : " + player.position.lat);
	    lonBox.setText("Longitude : " + player.position.lon);
    }
    
	healthBox.setText("Health: "+Math.floor(player.health));
	zombieBox.setText("#Zombies: "+ZOMBIES.length);
	
	if(player.disFromEnd !==null)
	    disBox.setText("Distance: "+player.disFromEnd.toFixed(2));
    
    var t = player.nearZombieDistance/25; // 1=safe/green, 0 = unsafe/red
    
    if(t>1) t=1;
    
    ui.backgroundColor(200 * (1-t), 200 * t, 0);
}

sensors.gps.onChange(function (lat, lon, alt, speed, bearing) {
    
    //console.log("gps tick");
	player.position = {lat: lat, lon:lon};
    
    
    player.disFromEnd = sensors.gps.getDistance(endpoint.lat, endpoint.lon, player.position.lat, player.position.lon);
    
    console.log(player.disFromEnd);
    
    updateUI();
    
});

function eatTick(){
    // EAT BRAINS!!!
	for(var i in ZOMBIES){
		var distance = sensors.gps.getDistance(ZOMBIES[i].lat, ZOMBIES[i].lon, player.position.lat, player.position.lon);
		if(distance>5){
			continue;
		}
		else{
			healthDecay = 20 - ((17/5)*distance);
			console.log("Decaying health by "+healthDecay);
			player.health -= healthDecay;
		}
	}
}

function gameTick(){
    //console.log("game tick");
    if(player.disFromEnd && player.disFromEnd < 2){
        zombieLoop.stop();
        eatLoop.stop();
        ZOMBIES = [];
        console.log("Congrats!");
    }
    
    if(player.health === 0){
        zombieLoop.stop();
        eatLoop.stop();
        updateUI();
        return;
    }
	
	if(player.health <= 0){
	    player.health = 0
	    console.log("you died");
	    // DEATH!!
	}
	
	for(var i in ZOMBIES){
	    var dis = sensors.gps.getDistance(ZOMBIES[i].lat, ZOMBIES[i].lon, player.position.lat, player.position.lon);
	    if(dis< player.nearZombieDistance){
    		player.nearZombieDistance = dis;
    	}
    }
	
	updateUI();
}

uiSetup();

// This spawns zombies every 5s
var zombieLoop = util.loop(5000, zombieTick);

// Update UI every 100ms
var uiLoop = util.loop(100, gameTick).start();

// Eat Brains every 3s
var eatLoop = util.loop(3000, eatTick);