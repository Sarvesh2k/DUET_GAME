var Duet = function() {
	var STATE = { START: 0, PLAY: 1, HIT: 2, OVER:3, LVLCLR:4 };
	var KEY = { LEFT:97, RIGHT:100, ESC:27, SPACE:32 };
	var GAMESTATE;
	var PAUSE = false;
	var that = this;
	var gameLoop;
	var canvas = document.getElementById('canvas');
	var canvasContainer = document.getElementById('canvas-container');
	var screenOverlay,
		gameTitle,
		gameSubtitle,
		btnContinue,
		btnPause,
		screenMsg,
		levelTitle,
		levelMsg;
	var MSG = {
		LOADING: "LOADING...",
		START: "HIT SPACE TO START",
		PAUSE: "GAME PAUSED",
		OVER: "GAME OVER!",
		LVLCLR: "LEVEL CLEARED!",
		CHAPTERCLR: "A NEW CHAPTER",
		CONTINUE: "PRESS SPACE TO CONTINUE",
		NEWHS: "NEW HIGHSCORE: ",
		NOMORELVL : "GREAT JOB AT BRINGING THEM TOGETHER!",
		BTNCONTINUE: "CONTINUE",
		BTNRESTART: "RESTART",
		BTNRESUME: "RESUME",
		BTNSTART: "START",
		GAMETITLE: "DUET",
	  GAMESUBTITLE: "A DUET MAKEOVER"};

	var orbitCx = canvas.width/2;
	var orbitCy = canvas.height/1.3;
	var angleInterval = 15;
  var angle = 0;
  var angleIncr = 0.9;
  var keyPressInterval;
  var orbit, phoebe, rishav;
	var obstacles = [];
	var collisionDetector;
	var scoreCounter = 0;
	var levelCounter = 0;
	var currentLevel = level[levelCounter];
	var playerData = {life: 15, score: 0, highScore: 0, level: 0};
	var obsFactory = new ObstacleFactory();
	var backgroundAudio;
	var checkAudioInterval;
	var rect = canvas.getBoundingClientRect();


	var loadLevel = function() {
			//loading obstacles
		obstacles.splice(0,obstacles.length);
		for(var i = 0; i<currentLevel.OBS.length; i++) {
		obstacles[i] = obsFactory.getObstacle(currentLevel.OBS[i].code, currentLevel.SPD, currentLevel.OBS[i].IY);
		}
		playerData.level += 1;
		levelTitle.innerHTML = currentLevel.TITLE;
		levelMsg.innerHTML = currentLevel.MSG;
		var levelMsgTimeout = currentLevel.TIMEOUT;
		canvasContainer.appendChild(levelTitle);
		canvasContainer.appendChild(levelMsg);
		if(document.getElementById('level-title'))setTimeout(function(){
			canvasContainer.removeChild(levelTitle);
		}, 3000);
		if(document.getElementById('level-msg'))setTimeout(function(){
			canvasContainer.removeChild(levelMsg);
		}, levelMsgTimeout);
	}

	var reset = function() {
		obstacles.splice(0,obstacles.length);
		levelCounter = 0;
		currentLevel = level[levelCounter];
		playerData.life = 5;
		playerData.score = 0;
		playerData.level = 0;
		backgroundAudio.src = "song.mp3";
		screenMsg.innerHTML = MSG.LOADING;
		canvasContainer.appendChild(screenOverlay);
		checkAudioInterval = setInterval(function(){
			if(checkAudioLoad()){
				clearInterval(checkAudioInterval);
				screenMsg.innerHTML = MSG.CONTINUE;
				btnContinue.innerHTML = MSG.BTNSTART;
				canvasContainer.appendChild(btnContinue);
			}
		}, 1000);
	}


	this.load = function() {
		//Set Listeners
		document.addEventListener('keypress', onKeyPress);
		document.addEventListener('keyup', onKeyUp);
		document.addEventListener('keydown', onKeyDown);

		//Set Touch event listeners
		canvas.addEventListener('touchstart', onTouchStart, false);
		canvas.addEventListener('touchend', onTouchEnd, false);

		//Create the player
		orbit = new Orbit(orbitCx, orbitCy, 100, null, 'gray');
		phoebe = new Phoebe(orbitCx-100, orbitCy, 10, '#ff2b2b');
		rishav = new Rishav(orbitCx+100, orbitCy, 10, '#0066ff');

		//initial call to canvas draw function
		var drawer = new Drawer(canvas, orbit, phoebe, rishav, obstacles, playerData);
		window.requestAnimationFrame(drawer.redraw);


		//create start, pause and gameover screens
		screenOverlay = document.createElement('div');
		screenOverlay.id = 'screen-overlay';

		btnContinue = document.createElement('div');
		btnContinue.id = 'btn-continue';

		btnPause = document.createElement('div');
		btnPause.id = 'btn-pause';
		btnPause.addEventListener('click', onPause);

		gameTitle = document.createElement('p');
		gameTitle.id = 'game-title';
		gameTitle.innerHTML = MSG.GAMETITLE;

		gameSubtitle = document.createElement('p');
		gameSubtitle.id = 'game-subtitle';
		gameSubtitle.innerHTML = MSG.GAMESUBTITLE;

		levelTitle = document.createElement('p');
		levelTitle.id = 'level-title';

		levelMsg = document.createElement('p');
		levelMsg.id = 'level-msg';

		screenMsg = document.createElement('p');
		screenOverlay.appendChild(screenMsg);
		screenOverlay.appendChild(gameTitle);
		btnContinue.innerHTML = MSG.BTNSTART;
		btnContinue.addEventListener('click', onContinue);

		screenMsg.innerHTML = MSG.LOADING;
		canvasContainer.appendChild(screenOverlay);
		canvasContainer.appendChild(gameSubtitle);
		canvasContainer.appendChild(btnPause);

		collisionDetector = new CollisionDetector();

		//loading background audio
		backgroundAudio = new Audio("song.mp3");
		backgroundAudio.loop = true;
		backgroundAudio.volume = .40;
		backgroundAudio.load();

		checkAudioInterval = setInterval(function(){
			if(checkAudioLoad()){
				clearInterval(checkAudioInterval);
				screenMsg.innerHTML = MSG.START;
				canvasContainer.appendChild(btnContinue);
				GAMESTATE = STATE.START;
			}
		}, 1000);

		document.body.appendChild(canvasContainer);
	}

	var checkAudioLoad = function()	{
		if (backgroundAudio.readyState === 4) {
			return true;
		}
	}

	var changeState = function() {
		window.cancelAnimationFrame(gameLoop);
		gameLoop = window.requestAnimationFrame(that.game);
	}

	this.game = function() {
		switch(GAMESTATE) {
			case STATE.PLAY:
			gameLoop = window.requestAnimationFrame(that.game);
			scoreCounter++;
			if(scoreCounter%100 == 0){
				playerData.score++;
				if(obstacles[obstacles.length-1].crossedFinish()) {
					GAMESTATE = STATE.LVLCLR;
				}
			}

			for(var i = 0; i < obstacles.length; i++) {
		    obstacles[i].updatePos();
		    if(collisionDetector.detectCollision(phoebe, obstacles[i])) {
		    	playerData.life--;
		    	GAMESTATE = STATE.HIT;
		    	obstacles[i].changeColor('#ff2b2b');
		    }
		    if(collisionDetector.detectCollision(rishav, obstacles[i])) {
		    	playerData.life--;
		    	GAMESTATE = STATE.HIT;
		    	obstacles[i].changeColor('#0066ff');
		    }
	  	}
	  	break;

	  	case STATE.HIT:
  		changeState();
  		for(var i = 0; i < obstacles.length; i++) {
  			phoebe.revolveAround(orbitCx, orbitCy, 2);
  			rishav.revolveAround(orbitCx, orbitCy, 2);
  			if(playerData.life == 0) GAMESTATE = STATE.OVER;
		   if(obstacles[i].reversePos()) GAMESTATE = STATE.PLAY;
	  	}
  		break;

	    case STATE.START:
	    if(level[levelCounter])loadLevel();
    	changeState();
    	backgroundAudio.play();
    	GAMESTATE = STATE.PLAY;
    	break;

	    case STATE.OVER:
	    if(gameLoop)window.cancelAnimationFrame(gameLoop);
	    screenOverlay.appendChild(gameTitle);
	    btnContinue.innerHTML = MSG.BTNRESTART;
	    canvasContainer.appendChild(btnContinue);
	    if(playerData.score > playerData.highScore) {
	    	playerData.highScore = playerData.score;
	    	screenMsg.innerHTML = '<p id = "game-over">' + MSG.OVER + '</p>'+ ' <p id = "high-score">' + MSG.NEWHS+ playerData.highScore + '</p>';
	    }
	    else screenMsg.innerHTML = '<p id = "game-over">' + MSG.OVER + '</p>';
			canvasContainer.appendChild(screenOverlay);
			break;


    	case STATE.LVLCLR:
    	currentLevel = level[++levelCounter];
    	screenMsg.innerHTML = MSG.LVLCLR;
    	canvasContainer.appendChild(screenOverlay);
    	if(currentLevel == undefined) {
    		screenMsg.innerHTML = MSG.NOMORELVL;
    		screenOverlay.appendChild(gameTitle);
		    btnContinue.innerHTML = MSG.BTNRESTART;
		    canvasContainer.appendChild(btnContinue);
    		break;
    	}
    	if(currentLevel.AUDIO) {
    		screenMsg.innerHTML = MSG.CHAPTERCLR + '<p>' + MSG.LOADING + '</p>';
    		backgroundAudio.src = currentLevel.AUDIO;
    		checkAudioInterval = setInterval(function(){
					if(checkAudioLoad()){
						clearInterval(checkAudioInterval);
						screenMsg.innerHTML = MSG.CONTINUE;
						btnContinue.innerHTML = MSG.BTNCONTINUE;
						canvasContainer.appendChild(btnContinue);
						GAMESTATE = STATE.START;
					}
				}, 1000);
    	}
    	else {
    				canvasContainer.appendChild(screenOverlay);
    				btnContinue.innerHTML = MSG.BTNCONTINUE;
    				canvasContainer.appendChild(btnContinue);}
    	window.cancelAnimationFrame(gameLoop);
    	GAMESTATE = STATE.START;
    	break;
		}
	}

	//EVENT LISTENING
  var onKeyPress = function(ev) {

    if (!keyPressInterval) {
        switch(ev.keyCode){
            case KEY.LEFT:
                keyPressInterval = setInterval(function() {
                if(angle < 5)
                angle += angleIncr;
                phoebe.revolveAround(orbitCx, orbitCy, angle);
                rishav.revolveAround(orbitCx, orbitCy, angle);
                }, angleInterval);
            break;

            case KEY.RIGHT:
                keyPressInterval = setInterval(function() {
                if(angle > -5)
                angle -= angleIncr;
                phoebe.revolveAround(orbitCx, orbitCy, angle);
                rishav.revolveAround(orbitCx, orbitCy, angle);
                }, angleInterval);
            break;
        }
    }
  }

  var onKeyUp = function(ev) {
    if(angle>0) angle -= angleIncr*3;
    else angle += angleIncr*3;
    clearInterval(keyPressInterval);
    keyPressInterval = undefined;
  }

  var onKeyDown = function(ev) {
    switch(ev.keyCode){
      case KEY.ESC:
      if(GAMESTATE == STATE.PLAY || GAMESTATE == STATE.HIT){
	      if(!PAUSE){
	      	btnPause.style.backgroundImage = "url('images/play.png')";
	        if(gameLoop)window.cancelAnimationFrame(gameLoop);
	        backgroundAudio.pause();
	        document.removeEventListener('keypress', onKeyPress);
	        document.removeEventListener('keyup', onKeyUp);
	        canvas.removeEventListener('touchstart', onTouchStart);
	        canvas.removeEventListener('touchend', onTouchEnd);
	        screenMsg.innerHTML = MSG.PAUSE;
	        btnContinue.innerHTML = 'RESUME';
	        canvasContainer.appendChild(screenOverlay);
	        canvasContainer.appendChild(btnContinue);
	        PAUSE = !PAUSE;
	      }
	      else {
	      	btnPause.style.backgroundImage = "url('images/pause.png')";
	      	backgroundAudio.play();
	      	if(document.getElementById('screen-overlay'))canvasContainer.removeChild(screenOverlay);
  	 			if(document.getElementById('btn-continue'))canvasContainer.removeChild(btnContinue);
	        gameLoop = window.requestAnimationFrame(that.game);
	        document.addEventListener('keypress', onKeyPress);
	        document.addEventListener('keyup', onKeyUp);
	        canvas.addEventListener('touchstart', onTouchStart);
	        canvas.addEventListener('touchend', onTouchEnd);
	        PAUSE = !PAUSE;
	      }
    	}
      break;

      case KEY.SPACE:
      if(!PAUSE && GAMESTATE == STATE.START){
	      if(document.getElementById('game-title'))screenOverlay.removeChild(gameTitle);
	      if(document.getElementById('game-subtitle'))canvasContainer.removeChild(gameSubtitle);
	      if(document.getElementById('screen-overlay'))canvasContainer.removeChild(screenOverlay);
	      if(document.getElementById('btn-continue'))canvasContainer.removeChild(btnContinue);
	    }
      if(GAMESTATE == STATE.START)that.game();
      if(GAMESTATE == STATE.OVER){
      	if(document.getElementById('screen-overlay'))canvasContainer.removeChild(screenOverlay);
	      if(document.getElementById('btn-continue'))canvasContainer.removeChild(btnContinue);
      	reset();
      	GAMESTATE = STATE.START;
      	changeState();
      }
      break;
    }
  }

  var onTouchStart = function(ev) {
  	ev.preventDefault();
  	console.log('canvas touch start', ev.touches[0].clientX - rect.left );
  	var x = ev.touches[0].clientX - rect.left;
	  	if(x<200) {
	  		 ev.keyCode = 97;
	  		 onKeyPress(ev);
  	  	}
  	  	else {
  	  		ev.keyCode = 100;
  	  		onKeyPress(ev);
	  		}
  }

  var onTouchEnd = function(ev) {
  	ev.preventDefault();
  	onKeyUp(ev);
  }

  var onContinue = function(ev) {
		if(document.getElementById('game-title'))screenOverlay.removeChild(gameTitle);
		if(document.getElementById('screen-overlay'))canvasContainer.removeChild(screenOverlay);
		if(document.getElementById('game-subtitle'))canvasContainer.removeChild(gameSubtitle);
		if(document.getElementById('btn-continue'))canvasContainer.removeChild(btnContinue);

      if(GAMESTATE == STATE.START)that.game();
      if(GAMESTATE == STATE.OVER || GAMESTATE == STATE.LVLCLR){
      	if(document.getElementById('btn-continue'))canvasContainer.removeChild(btnContinue);
      	screenMsg.innerHTML = MSG.LOADING;
      	reset();
      	GAMESTATE = STATE.START;
      }

      if(PAUSE){
      		btnPause.style.backgroundImage = "url('images/icon-pause.png')";
      		backgroundAudio.play();
	        gameLoop = window.requestAnimationFrame(that.game);
	        document.addEventListener('keypress', onKeyPress);
	        document.addEventListener('keyup', onKeyUp);
	        PAUSE = !PAUSE;
	      }
  }

  var onPause = function(ev) {
  	ev.keyCode = KEY.ESC;
  	onKeyDown(ev);
  }
}

var level = [

	{"OBS": [{"code": "RUL", "IY": -500},
					{"code": "RUR", "IY": -800},
					{"code": "RHL", "IY": -1100},
					{"code": "RUL", "IY": -1500},
					{"code": "RUR", "IY": -1900},
					{"code": "RHL", "IY": -2300}
					],
		"SPD" : 3,
		"TITLE"	: "THE START",
		"MSG" : "'A' TO ROTATE LEFT AND 'D' TO ROTATE RIGHT",
		"TIMEOUT" : 13000
	},

	{"OBS": [ {"code": "SC", "IY": -100},
					{"code": "RUL", "IY": -500},
					{"code": "RUR", "IY": -800},
					{"code": "RHL", "IY": -1200},
					{"code": "RHL", "IY": -1500},
					{"code": "RHL", "IY": -1900},
					{"code": "RHR", "IY": -2200},
					{"code": "RHL", "IY": -2500},
					{"code": "RHR", "IY": -2900},
					{"code": "RHL", "IY": -3300},
					{"code": "RHR", "IY": -3600},
					{"code": "RHC", "IY": -3900}
					],
		"SPD" : 3.1,
		"TITLE"	: "LEVEL 2",
		"MSG" : "ONE SIDED",
		"TIMEOUT" : 4000
	},


	{"OBS": [ {"code": "SC", "IY": -100},
					{"code": "RUL", "IY": -400},
					{"code": "RUR", "IY": -600},
					{"code": "RHL", "IY": -800},
					{"code": "RHL", "IY": -1000},
					{"code": "RHL", "IY": -1200},
					{"code": "RHR", "IY": -1400},
					{"code": "RHL", "IY": -1600},
					{"code": "RHR", "IY": -1800},
					{"code": "RHL", "IY": -2000},
					{"code": "RHR", "IY": -2200},
					{"code": "RHC", "IY": -2400},
					{"code": "SC", "IY": -2600},
					{"code": "RUL", "IY": -3000},
					{"code": "RUR", "IY": -3200},
					{"code": "RHR", "IY": -3400},
					{"code": "RHR", "IY": -3600},
					{"code": "RHR", "IY": -3800},
					{"code": "RHR", "IY": -4000},
					{"code": "RHL", "IY": -4200},
					{"code": "RHR", "IY": -4400},
					{"code": "RHL", "IY": -4600},
					{"code": "RHR", "IY": -4800},
					{"code": "RHC", "IY": -5000}
					],
		"SPD" : 3.1,
		"TITLE"	: "LEVEL 3",
		"MSG" : "TRUE FEELINGS",
		"TIMEOUT" : 5000
	},


	{"OBS": [ {"code": "SC", "IY": -100},
					{"code": "RUL", "IY": -400},
					{"code": "RUR", "IY": -600},
					{"code": "RHL", "IY": -800},
					{"code": "RHL", "IY": -1000},
					{"code": "RHL", "IY": -1200},
					{"code": "RHR", "IY": -1400},
					{"code": "RHL", "IY": -1600},
					{"code": "RHR", "IY": -1800},
					{"code": "RHL", "IY": -2000},
					{"code": "RHR", "IY": -2200},
					{"code": "RHC", "IY": -2400},
					{"code": "SC", "IY": -2600},
					{"code": "RUL", "IY": -3000},
					{"code": "RUR", "IY": -3200},
					{"code": "RHR", "IY": -3400},
					{"code": "RHR", "IY": -3600},
					{"code": "RHR", "IY": -3800},
					{"code": "RHR", "IY": -4000},
					{"code": "RHL", "IY": -4200},
					{"code": "RHR", "IY": -4400},
					{"code": "RHL", "IY": -4600},
					{"code": "RHR", "IY": -4800},
					{"code": "RHC", "IY": -5000}
		],
		"SPD" : 3.2,
		"TITLE"	: "LEVEL 4",
		"MSG" : "THE ACCEPTANCE"
	},

	{
		"OBS": [
		{"code": "RUL" , "IY": -300},
						{"code": "RUR", "IY": -300},
						{"code": "RHCR", "IY": -600},
						{"code": "RHCL", "IY": -900},
						{"code": "RHCL", "IY": -1100},
						{"code": "RHR", "IY": -1300},
						{"code": "RHR", "IY": -1600},
						{"code": "RHR", "IY": -1900},
						{"code": "RHR", "IY": -2200},
						{"code": "SC", "IY": -2600},
						{"code": "SCR", "IY": -2950},
						{"code": "SCL", "IY": -2950},
						{"code": "SC", "IY": -3300},
						{"code": "RHL", "IY": -3500},
						{"code": "RHR", "IY": -3750},
						{"code": "RHL", "IY": -4000},
						{"code": "RHR", "IY": -4200},
						{"code": "RHL", "IY": -4400},
						{"code": "RHR", "IY": -4600},
						{"code": "RHL", "IY": -4800},
						{"code": "RHL", "IY": -5000},
						{"code": "RHL", "IY": -5200},
						{"code": "RHL", "IY": -5400},
						{"code": "RHL", "IY": -5600},
						{"code": "RHL", "IY": -5800},
						{"code": "RHR", "IY": -6000},
						{"code": "RHR", "IY": -6200},
						{"code": "RHR", "IY": -6400},
						{"code": "RHR", "IY": -6600},
						{"code": "RHR", "IY": -6800},
						{"code": "RHRL", "IY": -7000},
						{"code": "RHLR", "IY": -7300},
						{"code": "RHRL", "IY": -7500},
						{"code": "RHLR", "IY": -7900},
						{"code": "RHLR", "IY": -8100}
		],
		"SPD" : 3.3,
		"TITLE"	: "LEVEL 5",
		"MSG" : "THE PROPOSAL",
		"TIMEOUT" : 5000
	},




]
