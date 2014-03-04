function main()
{
	// register and instanciate objects
	register("bg", new Image());
	register("pl", new Image());
	register("pr", new Image());
	register("ball", new Image());
	register("canvas", document.getElementById("canvas"));
	register("context", canvas.getContext("2d"));

	// start the game by entering the first state
	preloading();
}

/////////////////////////////////////////////////
// dependency injection
/////////////////////////////////////////////////

var di = new Array();

function register(id, obj)
{
	//console.log("register : " + id);
	di[id] = obj;
}

function instance(id)
{
	//console.log("instance : " + id);
	return di[id];
}

/////////////////////////////////////////////////
// event bus
/////////////////////////////////////////////////

var subscribers = new Array();

function pub(event)
{
	//console.log(event);
	var s = subscribers[event];
	for(i=0 ; i<s.length ; i++)
	{
		s[i]();
	}
}

function sub(event, callback)
{
	//console.log("sub: " + event);
	subscribers[event] = new Array();
	subscribers[event].push(callback);
}

/////////////////////////////////////////////////
// states
/////////////////////////////////////////////////

/*
	preloading -> playing
*/

/*
preloading:
- subscribe to bgready, plready, prready, ballready
- if all events received transition to playing
*/
function preloading()
{
	load("bg", "bgready", "background.png");
	load("pl", "plready", "paddle.png");
	load("pr", "prready", "paddle.png");
	load("ball", "ballready", "ball.png");

	var checkbg = false;
	var checkpl = false;
	var checkpr = false;
	var checkball = false;

	function load(obj, event, file) {
		var o = instance(obj);
		o.onload = function(){
			pub(event);
		};
		o.src = file;
	}

	function check() {
		if(checkbg && checkpl && checkpr && checkball)
		{
			console.log("preloading finished");
			playing();
		}
	};

	sub("bgready", function(){
		//console.log("callback bgready");
		checkbg = true;
		check();
	});

	sub("plready", function(){
		//console.log("callback plready");
		checkpl = true;
		check();
	});

	sub("prready", function(){
		//console.log("callback prready");
		checkpr = true;
		check();
	});

	sub("ballready", function(){
		//console.log("callback ballready");
		checkball = true;
		check();
	});
}



/*
	playing:
	- playing -> stopped (on event 'gameover')
*/

var pry;
var ply;

var ballx;
var bally;

var ballvx;
var ballvy;

var speedmodifier = 1.05;

function playing()
{
	console.log("playing!");

	pry = 215;
	ply = 215;

	bally = 215 + (Math.random() * 50);

	if(Math.random() < 0.5)
	{
		ballx = 20;
		ballvx = 1.5;
	}
	else
	{
		ballx = 610;
		ballvx = -1.5;
	}
	ballvy = 0;

	var interval;

	sub("gameover", function () {
		clearInterval(interval);
		stopped();
	});

	sub("restart", function () {
		clearInterval(interval);
		restart();
	});

	interval = setInterval(frame, 5);
}

window.addEventListener("keydown", keydown, false);
window.addEventListener("keyup", keyup, false);

var rightup = false;
var rightdown = false;
var leftup = false;
var leftdown = false;

function keydown(e)
{
	//console.log("down : " + e.keyCode);
	switch(e.keyCode)
	{
		case 80:
			rightup = true;
			break;
		case 76:
			rightdown = true;
			break;
		case 81:
			leftup = true;
			break;
		case 65:
			leftdown = true;
			break;
		case 32:
			pub("gameover");
			break;
		case 82:
			pub("restart");
			break;
	}
}

function keyup(e)
{
	//console.log("up : " + e.keyCode);
	switch(e.keyCode)
	{
		case 80:
			rightup = false;
			break;
		case 76:
			rightdown = false;
			break;
		case 81:
			leftup = false;
			break;
		case 65:
			leftdown = false;
			break;
	}
}

var framecount = 0;

function frame()
{
	framecount++;

	//console.log("frame");

	//////////////////
	// logic
	//////////////////

	ballx += ballvx;
	bally += ballvy;

	// collide with top?
	if(bally < 0)
	{
		bally = 0;
		ballvy = -ballvy;
	}

	// collide with bottom?
	if(bally > 470)
	{
		bally = 470;
		ballvy = -ballvy;
	}

	var paddlespeed = 1.5;

	if(rightup) pry -= paddlespeed;
	if(rightdown) pry += paddlespeed;
	if(pry < 0) pry = 0;
	if(pry > 430) pry = 430;

	if(leftup) ply -= paddlespeed;
	if(leftdown) ply += paddlespeed;
	if(ply < 0) ply = 0;
	if(ply > 430) ply = 430;

	// collide with right paddle?
	if(ballx > 610 && (pry <= bally+10 && pry+50 >= bally))
	{
		ballx = 610;
		ballvx = -ballvx;
		ballvx *= speedmodifier;
		ballvy *= speedmodifier;
		if(pry <= bally+10 && pry+10 >= bally)
		{
			ballvy = -0.5;
		}
		else if(pry+40 <= bally && pry+50 >= bally)
		{
			ballvy = 0.5;
		}
	}

	// collide with left paddle?
	if(ballx < 20 && (ply <= bally+10 && ply+50 >= bally))
	{
		ballx = 20;
		ballvx = -ballvx;
		ballvx *= speedmodifier;
		ballvy *= speedmodifier;
		if(ply <= bally+10 && ply+10 >= bally)
		{
			ballvy = -0.5;
		}
		else if(ply+40 <= bally && ply+50 >= bally)
		{
			ballvy = 0.5;
		}
	}

	//////////////////
	// drawing
	//////////////////

	var context = instance("context");

	// draw background first
	context.drawImage(instance("bg"), 0, 0);

	// now draw foreground objects
	context.drawImage(instance("pl"), 10, ply);
	context.drawImage(instance("pr"), 620, pry);
	context.drawImage(instance("ball"), ballx, bally);

	// draw score
	context.font = "bold 40pt 'Century Gothic', futura, 'URW Gothic L', Verdana, sans-serif";
	context.fillStyle = "white";
	context.fillText(scorel + ":" + scorer, 290, 50);

	if(ballx >= 630)
	{
		scorel ++;
		pub("gameover");
	}

	if(ballx <= 10)
	{
		scorer ++;
		pub("gameover");
	}
}

var scorel = 0;
var scorer = 0;

/*
	stopped:
*/

function stopped()
{
	console.log("stopped!");
	playing();
}

/*

	restart:
*/

function restart()
{
	console.log("restart!");
	scorel = 0;
	scorer = 0;
	playing();
}