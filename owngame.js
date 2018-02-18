var player;
var keys = {};
var playerSprite = "player.png";
var score = 0;
var wave = 1;
var bullets = [];
var enemiesleft;
var enemies = [];


function startGame(){
	document.getElementById("start").blur();
	document.getElementById("save").style.visibility = 'hidden';
	document.getElementById("load").style.visibility = 'hidden';
	document.getElementById("start").style.display = 'none';
	gameArea.start();
	player = new component(50,50,250,250);
}

var gameArea = {
	canvas : document.getElementById("gamecanvas"),
	start : function() {
		enemiesleft = wave * 3;
		this.context = this.canvas.getContext("2d");
		document.body.insertBefore(this.canvas, document.body.childNodes[0]);
		this.interval = setInterval(updateGameArea, 20);
		this.shootinterval = setInterval(updateBullets, 200); //add separate interval to reduce fire rate of the weapon NOTE: you have to hold space for 200ms before character starts to shoot
		this.enemyinterval = setInterval(spawnEnemy, 1000);
        window.addEventListener('keydown', function (e) {
            keys[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            keys[e.keyCode] = false;
        })
    }, 
    stop : function() {
        clearInterval(this.interval);
        clearInterval(this.shootinterval);
        clearInterval(this.enemyinterval);
        submithighscore();
    },    
    nextwave : function() {
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
    for (var enemy of enemies){
    	if (collision(player, enemy)){
    		gameArea.stop();
    	}
    	enemy.update();
    	enemy.draw();
    }
    ctx = gameArea.context;
    ctx.font = "18px Arial";
    ctx.fillText("Score: " + score, 380,20);
    ctx.fillText("Wave: " + wave, 380, 40);
	player.updatePos();
	player.update();
}


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

function spawnEnemy(){
	if (enemiesleft > 0){
		enemies.push(Enemy());
		enemiesleft -= 1;
	}
}


function Bullet(bullet){
	bullet.active = true;
	bullet.width = 3;
	bullet.height = 3;
	bullet.angle = player.angle;
	bullet.inBounds = function(){
		return bullet.x >= 0 && bullet.x <= gameArea.canvas.width && bullet.y >= 0 && bullet.y <= gameArea.canvas.height;
	};
	bullet.draw = function(){
		ctx = gameArea.context;
		ctx.fillRect(this.x, this.y, this.width, this.height);
	};
	bullet.update = function(){
		bullet.x = bullet.x + (bullet.speed * Math.sin(bullet.angle));
		bullet.y = bullet.y - (bullet.speed * Math.cos(bullet.angle));
		bullet.active = bullet.active && bullet.inBounds();
	};
	return bullet;
}

function shoot(){
	var bulletx = player.x;
	var bullety = player.y;
	bullets.push(Bullet({
		speed: 5,
		x: bulletx,
		y: bullety
	}));
}


function Enemy(enemy){
	enemy = enemy || {};
	enemy.x = 0;
	enemy.y = 0;
	var edge = Math.floor(Math.random() * 4);//radnom number from 0-3
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

function collision(player, enemy){
	return player.x < enemy.x + 75 && player.x + 25 > enemy.x && player.y < enemy.y + 75 && player.y +25 > enemy.y;
}

function bulletCollision(bullet, enemy){
	return bullet.x < enemy.x + 50 && bullet.x > enemy.x && bullet.y < enemy.y + 50 && bullet.y > enemy.y	
}


//game-service communication below
/*function save(){
	var msg = {
		"messageType": "SAVE",
		"gameState": {
			"score": parseFloat(score.text()),
			"wave": parseFloat(wave.text())
		}
	};
	window.parent.postMessage(msg, "*");
}

function load(){
	var msg = {
		"messageType": "LOAD_REQUEST",
	};
	window.parent.postMessage(msg, "*");
}

function submithighscore(){
	var msg = {
		"messageType": "SCORE",
		"score": parseFloat(score.text())
	};
	window.parent.postMessage(msg, "*");
}

function settings(){
	var msg = {
		"messageType": "SETTING",
		"options": {
			"width": 500,
			"height": 500
		}
	};
	window.parent.postMessage(msg, "*");
}

window.addEventListener("message", function(evt){
	if (evt.data.messageType == "LOAD"){
		score = evt.data.gameState.score;
		wave = evt.data.gameState.wave;
	    ctx = gameArea.context;
	    ctx.font = "18px Arial";
    	ctx.fillText("Score: " + score, 380,20);
    	ctx.fillText("Wave: " + wave, 380, 40);
	}
	else if (evt.data.messageType == "ERROR"){
		alert(evt.data.info);
	}
})*/