var player;
var keys = {};
var playerSprite = "player.png";
var score = 0;
var wave = 1;
var bullets = [];
var enemiesleft;
var enemies = [];

//hide buttons and call the start function
function startGame(){
	document.getElementById("start").blur();
	document.getElementById("save").style.visibility = 'hidden';
	document.getElementById("load").style.visibility = 'hidden';
	document.getElementById("start").style.display = 'none';
	document.getElementById("restart").style.display = 'none';
	gameArea.start();
	player = new component(50,50,250,250);
}

var gameArea = {
	canvas : document.getElementById("gamecanvas"),
	start : function() {
		enemiesleft = wave * 3;
		this.context = this.canvas.getContext("2d");
		document.body.insertBefore(this.canvas, document.body.childNodes[0]);
		this.interval = setInterval(updateGameArea, 20); //game updates every 20ms
		this.shootinterval = setInterval(updateBullets, 200); //add separate interval to reduce fire rate of the weapon NOTE: you have to hold space for 200ms before character starts to shoot
		this.enemyinterval = setInterval(spawnEnemy, 1000); //enemies spawn every 1000ms
        window.addEventListener('keydown', function (e) {
            keys[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            keys[e.keyCode] = false;
        })
    }, 
    stop : function() {
    	//this gets called when player dies. resets all values to default
        clearInterval(this.interval);
        clearInterval(this.shootinterval);
        clearInterval(this.enemyinterval);
        this.context.font = ("24px Arial");
        this.context.fillText("You died.", 200, 240);
		this.context.fillText("Score: " + score, 200, 260);
        this.context.fillText("Wave: " + wave, 200, 280);
        submithighscore();
        document.getElementById("restart").style.display = 'block';
        document.getElementById("restart").blur();
        enemies = [];
        enemiesleft = 0;
        bullets = [];
        score = 0;
        wave = 1;
        save();
    },    
    nextwave : function() {
    	//this is called when all enemies are dead. Makes buttons visible and clears necessary stuff from previous round
    	clearInterval(this.interval);
    	clearInterval(this.shootinterval);
    	clearInterval(this.enemyinterval);
    	bullets = [];
    	wave += 1;
    	document.getElementById("save").style.visibility = 'visible';
    	document.getElementById("load").style.visibility = 'visible';
    	document.getElementById("start").style.display = 'block';
    },
	clear : function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}

//player model
function component(width, height, x, y){
	this.image = new Image();
	this.image.src = playerSprite;
	this.width = width;
	this.height = height;
	this.angle = 0;
	this.moveAngle = 0;
	this.x = x;
	this.y = y;
	this.speed = 0;
	this.update = function() {
		//draw updated position
		this.image.src = playerSprite;
		model = gameArea.context;
		model.save();
		model.translate(this.x, this.y);
		model.rotate(this.angle);
		model.translate(-this.x, -this.y);
		model.drawImage(this.image, this.x-(this.width/2), this.y-(this.height/2), this.width, this.height);
		model.restore();
	}

	this.updatePos = function() {
		//update player position
        this.angle += this.moveAngle * Math.PI / 180;
        var new_x = this.x + this.speed * Math.sin(this.angle);
        var new_y = this.y - this.speed * Math.cos(this.angle)
        if (new_x >= 0 && new_x <= gameArea.canvas.width){
        	this.x = new_x;
    	}
    	if (new_y >= 0 && new_y <= gameArea.canvas.height){
    		this.y = new_y;
    	}
	}
}

//keeps track of user input and updates depending on it
function updateGameArea(){
	if (enemies.length == 0 && enemiesleft == 0){
		gameArea.nextwave();
	}
	gameArea.clear();
    player.speed = 0;
    player.moveAngle = 0;    
    if (keys[37]){
    	player.moveAngle = -3;
    }
    if (keys[39]){
    	player.moveAngle = 3;
    }
    if (keys[38]){
    	player.speed = 3;
    }
    if (keys[40]){
    	player.speed = -3;
    }
    //update all bullets and check collisions
    for (var bullet of bullets){
    	var i = enemies.length -1;
    	while (i >= 0){
    		if (bulletCollision(bullet, enemies[i])){
    			enemies.splice(i, 1);
    			score += 10;
    		}
    		i -= 1;
    	}
    	bullet.update();
    	bullet.draw();
    }
    //update all enemies and check collisions
    for (var enemy of enemies){
    	if (collision(player, enemy)){
    		gameArea.clear();
    		gameArea.stop();
    	}
    	enemy.update();
    	enemy.draw();
    }
    //draw info about game to upper right corner
    ctx = gameArea.context;
    ctx.font = "18px Arial";
    ctx.fillText("Score: " + score, 380,20);
    ctx.fillText("Wave: " + wave, 380, 40);
	player.updatePos();
	player.update();
}

//add bullets  when user presses space
//also play sound every time user shoots
//also change player image to a shooting one, creating a fancy animation
function updateBullets(){
	var riflesound = new Audio("rifle.ogg");
    if (keys[32]){
   		playerSprite = "player_shoot.png";
    	shoot();
    	riflesound.play();
    }	
    else{
    	playerSprite = "player.png";
    }
}

//if enemies left, spawn one. This is called every 1000ms according to earlier interval
function spawnEnemy(){
	if (enemiesleft > 0){
		enemies.push(Enemy());
		enemiesleft -= 1;
	}
}

//bullet model
function Bullet(bullet){
	bullet.active = true;
	bullet.width = 3;
	bullet.height = 3;
	bullet.angle = player.angle;
	bullet.inBounds = function(){
		//check if bullet is inbounds
		return bullet.x >= 0 && bullet.x <= gameArea.canvas.width && bullet.y >= 0 && bullet.y <= gameArea.canvas.height;
	};
	bullet.draw = function(){
		//draw bullet
		ctx = gameArea.context;
		ctx.fillRect(this.x, this.y, this.width, this.height);
	};
	bullet.update = function(){
		//update bullet position
		bullet.x = bullet.x + (bullet.speed * Math.sin(bullet.angle));
		bullet.y = bullet.y - (bullet.speed * Math.cos(bullet.angle));
		bullet.active = bullet.active && bullet.inBounds();
	};
	return bullet;
}

//this is called everytime player shoots, creating a new bullet
function shoot(){
	var bulletx = player.x;
	var bullety = player.y;
	bullets.push(Bullet({
		speed: 5,
		x: bulletx,
		y: bullety
	}));
}

//enemy model
function Enemy(enemy){
	enemy = enemy || {};
	enemy.x = 0;
	enemy.y = 0;
	//spawn enemies randomly to each side of the map
	var edge = Math.floor(Math.random() * 4);//random number from 0-3
	if (edge == 0){//west edge
		enemy.x = 0;
		enemy.y = Math.random() * (gameArea.canvas.height -50 + 1);
	}
	if (edge == 1){//north edge
		enemy.y = 0;
		enemy.x = Math.random() * (gameArea.canvas.width -50 + 1);
	}
	if (edge == 2){//east edge
		enemy.x = gameArea.canvas.width-50;
		enemy.y = Math.random() * (gameArea.canvas.height -50 + 1);
	}
	if (edge == 3){//south edge
		enemy.y = gameArea.canvas.height-50;
		enemy.x = Math.random() * (gameArea.canvas.width -50 + 1);
	}
	enemy.image = new Image();
	enemy.image.src = "enemy.png";
	enemy.draw = function(){
		gameArea.context.drawImage(this.image, this.x, this.y, 50, 50);
	}
	enemy.update = function(){
		//a simple algorithm to make enemies follow player. Update enemy positions accordingly
		var xdist = -25 + player.x - enemy.x;
		var ydist = -25 + player.y - enemy.y;
		var hyp = Math.sqrt(xdist*xdist + ydist*ydist);
		xdist /= hyp;
		ydist /= hyp;
		enemy.x += xdist;
		enemy.y += ydist;
	}
	return enemy;
}

//check collision between enemies and player
function collision(player, enemy){
	return player.x < enemy.x + 75 && player.x + 25 > enemy.x && player.y < enemy.y + 75 && player.y +25 > enemy.y;
}

//check collisions between bullets and enemies
function bulletCollision(bullet, enemy){
	return bullet.x < enemy.x + 50 && bullet.x > enemy.x && bullet.y < enemy.y + 50 && bullet.y > enemy.y	
}


//game-service communication below
//save game
function save(){
	var msg = {
		"messageType": "SAVE",
		"gameState": {
			"score":score.toString(),
			"wave": wave.toString()
		}
	};
	window.parent.postMessage(msg, "*");
}

//send load request
function load(){
	var msg = {
		"messageType": "LOAD_REQUEST",
	};
	window.parent.postMessage(msg, "*");
}

//this is called automatically when player dies
function submithighscore(){
	var msg = {
		"messageType": "SCORE",
		"score": score.toString()
	};
	window.parent.postMessage(msg, "*");
}

//this is called when the html document loads
function settings(){
	var msg = {
		"messageType": "SETTING",
		"options": {
			"width": 700,
			"height": 600
		}
	};
	window.parent.postMessage(msg, "*");
}

//listen to incoming messages. Load the game if message is LOAD, otherwise show error
window.addEventListener("message", function(evt){
	if (evt.data.messageType == "LOAD"){
		score = parseInt(evt.data.gameState.score);
		wave = parseInt(evt.data.gameState.wave);
	    savemsg = "Gamestate loaded!\nScore: " + score + "\nWave: " + wave;
	    alert(savemsg);
	}
	else if (evt.data.messageType == "ERROR"){
		alert(evt.data.info);
	}
})
