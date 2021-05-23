const gameRoot = document.getElementById('root');

let gameStart = null; // Date
let objects = []; // [{ ship }, { well }, { well }...]
let paused = false;
let input = {
}


const game = {
	score: 0,
	paused: true,
	lastTick: null,
	over: false,
};

const HEALTH_DECAY_FACTOR = 0.1;
const HEALTH_ACCEL_FACTOR = 1;
const MAX_HEALTH = 100;
const MIN_HEALTH = 0;
const FIELD_SIZE = 1000;
const MASS_MIN = 3;
const MASS_MAX = 100;
const SHIP_MASS = 1;
const G = 1;
const NEW_WELL_EVERY = 5000; // 5 sec
const NEW_WELL_SPEED = FIELD_SIZE / 3000; // cross the field in ~3s

const entryPoints = [
	[-FIELD_SIZE, -FIELD_SIZE],
	[FIELD_SIZE/2, -FIELD_SIZE],
	[FIELD_SIZE*2, -FIELD_SIZE],
	[FIELD_SIZE*2, FIELD_SIZE/2],
	[FIELD_SIZE*2, FIELD_SIZE*2],
	[FIELD_SIZE/2, FIELD_SIZE*2],
	[-FIELD_SIZE, FIELD_SIZE*2],
	[-FIELD_SIZE, FIELD_SIZE/2],
];
const entryVelocities = [
	[NEW_WELL_SPEED, NEW_WELL_SPEED],
	[0, NEW_WELL_SPEED],
	[-NEW_WELL_SPEED, NEW_WELL_SPEED],
	[-NEW_WELL_SPEED, 0],
	[-NEW_WELL_SPEED, -NEW_WELL_SPEED],
	[0, -NEW_WELL_SPEED],
	[NEW_WELL_SPEED, -NEW_WELL_SPEED],
	[NEW_WELL_SPEED, 0],
];


function start() {
	for (let oldObject of objects) {
		removeObjectFromDOM(oldObject);
	}
	objects = [];
	game.paused = false;
	// ship start
	objects[0] = {
		physics: {
			position: [0, FIELD_SIZE / 3],
			velocity: [1, 0], // [x, y]
			acceleration: [0, 0], // [x, y]
			mass: SHIP_MASS,
		},
		sprite: "ship" , // DOM ID ref
		health: MAX_HEALTH,
	};
	addObjectToDOM(objects[0]);
	// first mass
	objects[1] = {
		physics: {
			position: [FIELD_SIZE/2, FIELD_SIZE/2],
			velocity: [0, 0],
			acceleration: [0, 0],
			mass: MASS_MIN,
		},
		sprite: "well",
	};
	addObjectToDOM(objects[1]);

	game.lastTick = Date.now();
	requestAnimationFrame(gameTick);
}

function gameTick() {
	if (!game.over) {
		if (!game.paused) {
			const now = Date.now();
			const delta = now - game.lastTick;
			const deltaSq = Math.pow(delta, 2);
			// score increases with time!
			game.score += delta;
			game.lastTick = now;
			requestAnimationFrame(gameTick);
			// assume constant acceleration over delta and update physics
			for (let object of objects) {
				const p = object.physics.position;
				const v = object.physics.velocity;
				const a = object.physics.acceleration;
				object.physics.position = [
					p[0] + (v[0] * delta) + (0.5 * a[0] * deltaSq),
					p[1] + (v[1] * delta) + (0.5 * a[1] * deltaSq),
				];
				object.physics.velocity = [
					v[0] + a[0] * delta,
					v[1] + a[1] * delta,
				];
			}
			// update ship health
			const ship = object[0];
			ship.health += (
				HEALTH_ACCEL_FACTOR * Math.sqrt(
					Math.pow(ship.physics.acceleration[0], 2)
					+
					Math.pow(ship.physics.acceleration[1], 2)
				)
			);
			ship.health -= (
				HEALTH_DECAY_FACTOR * delta
			);
			if (ship.health > MAX_HEALTH) {
				ship.health = MAX_HEALTH;
			}

			// check for game end
			// TODO - ship.health < 0, out of bounds
			// game.over = true

			// check for lost wells to destroy
			// TODO - minimal accel, out of bounds
			// removeObjectFromDOM(...)

			// add new wells
			if ((game.score / NEW_WELL_EVERY) > (objects.length - 1)) {
				const entryIndex = objects.length % entryPoints.length;
				const newWell = {
					physics: {
						position: entryPoints[entryIndex].slice(),
						velocity: entryVelocities[entryIndex].slice(),
						acceleration: [0, 0],
						mass: (MASS_MIN + MASS_MAX) / 2,
					},
					sprite: "well",
				};
				objects.push(newWell);
				addObjectToDOM(newWell);
			}

			// recalculate accelerations for next tick
			for (let object of objects) {
				object.physics.acceleration = [0, 0, 0];
			}
			for (let i = 0; i < objects.length; i++) {
				for (let j = i + 1; j < objects.length; j++) {
					acceleration(objects[i], objects[j]);
				}
			}

			// update sprites

		}
	}
}

function addObjectToDOM(obj) {
	// TODO
	// build sprite and hold ref in obj.domRef
}

function removeObjectFromDOM(obj) {
	// TODO
}


// F = ma
// F = mMG/d^2
// a = F / m = MG/d^2
function acceleration(obj1, obj2) {
	let diffX = obj1.physics.position[0] - obj2.physics.position[0];
	let diffY = obj1.physics.position[1] - obj2.physics.position[1];
	let masslessAccel = G / (Math.pow(diffX, 2) + Math.pow(diffY, 2));
	let angle = Math.atan(diffY / diffX);
	let xAccel = masslessAccel * Math.cos(angle);
	let yAccel = masslessAccel * Math.sin(angle);
	obj2.physics.acceleration[0] += obj1.physics.mass * xAccel;
	obj2.physics.acceleration[1] += obj1.physics.mass * yAccel;
	obj1.physics.acceleration[0] += -1 * obj2.physics.mass * xAccel;
	obj1.physics.acceleration[1] += -1 * obj2.physics.mass * yAccel;
}

const mouseToMass = x => x / 50

const clampMass = x => Math.max(Math.min(x, MASS_MAX), MASS_MIN)

gameRoot.addEventListener('mousedown', e => {
	input.mouseDown = true

	if(e.target && e.target.dataset.type === 'well') {
		input.target = e.target.dataset.id
		// input.targetMass = objects[input.target].physics.mass
		input.targetMass = 50
		input.mouseStart = [e.clientX, e.clientY]
		console.log(input.target)
	}
})

gameRoot.addEventListener('mousemove', e => {
	if(input.mouseDown && input.target) {
		let mouseDelta = [e.clientX - input.mouseStart[0], e.clientY - input.mouseStart[1]]
		let magnitude = 0
		if(Math.abs(mouseDelta[0]) > Math.abs(mouseDelta[1])) {
			magnitude = mouseDelta[0]
		} else {
			magnitude = mouseDelta[1] * -1
		}
		// objects[target].physics.mass = clampMass(magnitude + input.targetMass)
		document.getElementById("hud-debug").innerHTML = clampMass(magnitude + input.targetMass)
	}
})

gameRoot.addEventListener('mouseup', e => {
	input = {}
})
