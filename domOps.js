const gameRoot = document.getElementById('root');
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
let input = {
}

function addObjectToDOM(obj, index) {
	if (obj.sprite == "well") {
		// eg. <use href="#well" data-type="well" data-id="3" />
		let sprite = document.createElementNS("http://www.w3.org/2000/svg", "use");
		// const debugVelocity = document.createElementNS("http://www.w3.org/2000/svg", "line");
		// const debugAcc = document.createElementNS("http://www.w3.org/2000/svg", "line");
		sprite.setAttribute('href', "#well");
		document.getElementById("space").appendChild(sprite);
		// document.getElementById("space").appendChild(debugVelocity);
		// document.getElementById("space").appendChild(debugAcc);
		sprite.dataset.type = "well";
		sprite.dataset.id = index;
		obj.domRef = sprite;
		// obj.debugVelocityRef = debugVelocity
		// obj.debugAccRef = debugAcc
		renderObject(obj);
	} else if (obj.sprite == "ship") {
		// eg. <use href="#ship" data-type="ship" data-id="0" />
		const sprite = document.createElementNS("http://www.w3.org/2000/svg", "use");
		// const debugVelocity = document.createElementNS("http://www.w3.org/2000/svg", "line");
		// const debugAcc = document.createElementNS("http://www.w3.org/2000/svg", "line");
		sprite.setAttribute('href', "#ship");
		document.getElementById("player").appendChild(sprite);
		// document.getElementById("player").appendChild(debugVelocity);
		// document.getElementById("player").appendChild(debugAcc);
		sprite.dataset.type = "ship";
		sprite.dataset.id = index;
		obj.domRef = sprite;
		// obj.debugVelocityRef = debugVelocity
		// obj.debugAccRef = debugAcc
		renderObject(obj);
	} else {
		throw "unrecognized object type";
	}
}

function removeObjectFromDOM(obj) {
	obj.domRef.parentElement.removeChild(obj.domRef);
}

const getSize = (mass, type) => ({
	ship: 50,
	well: mass / (MASS_MAX - MASS_MIN) * 120  + 20
})[type]

function renderObject({domRef, physics, sprite, debugVelocityRef, debugAccRef}) {
	const size = getSize(physics.mass, sprite)
	const attributes = {
		x: physics.position[0] - (size / 2),
		y: physics.position[1] - (size / 2),
		width: size,
		height: size,
	}
	Object.keys(attributes).forEach(k => {
		domRef.setAttribute(k, attributes[k])
	})
	if (debugVelocityRef) {
		const debugAttributes = {
			x1: physics.position[0],
			y1: physics.position[1],
			x2: physics.position[0] + (physics.velocity[0] * 50),
			y2: physics.position[1] + (physics.velocity[1] * 50),
			stroke: "red",
			'stroke-width': 5
		}
		Object.keys(debugAttributes).forEach(k => {
			debugVelocityRef.setAttribute(k, debugAttributes[k])
		})
	}
	if (debugAccRef) {
		const debugAttributes = {
			x1: physics.position[0],
			y1: physics.position[1],
			x2: physics.position[0] + (physics.acceleration[0] * 1000),
			y2: physics.position[1] + (physics.acceleration[1] * 1000),
			stroke: "blue",
			'stroke-width': 5
		}
		Object.keys(debugAttributes).forEach(k => {
			debugAccRef.setAttribute(k, debugAttributes[k])
		})
	}
}

function renderEndScreen(score) {
	endScreen.style.display = null;
	document.getElementById("end-screen-score").textContent = Math.floor(score / 1000)
}

function renderScore(score) {
	document.getElementById("hud-score").innerHTML = Math.floor(score / 1000)
}

function renderHealth(health) {
	document.getElementById("hud-health").setAttribute('width', (health / MAX_HEALTH) * FIELD_SIZE)
}

const mouseToMass = x => x / 50

const clampMass = x => Math.max(Math.min(x, MASS_MAX), MASS_MIN)

gameRoot.addEventListener('click', e => {
	if(e.target && e.target.id == 'start-button') {
		gameRoot.removeChild(startScreen)
		start()
	}
	if(e.target && e.target.id == 'restart-button') {
		endScreen.style.display = 'none';
		start()
	}
})

function mouseDownHandler(e) {
	input.mouseDown = true

	if(e.target && e.target.dataset.type === 'well') {
		pause()
		input.target = e.target.dataset.id
		input.targetMass = objects[input.target].physics.mass
		// input.targetMass = 50
		input.mouseStart = [e.clientX, e.clientY]
		console.log(input.target)
	}
}

function mouseMoveHandler(e) {
	if(input.mouseDown && input.target) {
		let mouseDelta = [e.clientX - input.mouseStart[0], e.clientY - input.mouseStart[1]]
		let magnitude = 0
		if(Math.abs(mouseDelta[0]) > Math.abs(mouseDelta[1])) {
			magnitude = mouseDelta[0]
		} else {
			magnitude = mouseDelta[1] * -1
		}
		objects[input.target].physics.mass = clampMass(magnitude + input.targetMass)
	}
}

function mouseUpHandler(e) {
	input = {}
	unpause()
}
