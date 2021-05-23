let objects = []; // [{ ship }, { well }, { well }...]

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
const G = 6;
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
	game.over = false;
	game.score = 0;
	// ship start
	objects[0] = {
		physics: {
			position: [0, FIELD_SIZE / 3],
			velocity: [1, 0], // [x, y]
			acceleration: [0, 0], // [x, y]
			mass: SHIP_MASS,
		},
		sprite: "ship" , // DOM ID ref
		domRef: null, // will be set by addObjectToDOM
		health: MAX_HEALTH,
	};
	addObjectToDOM(objects[0], 0);
	// first mass
	objects[1] = {
		physics: {
			position: [FIELD_SIZE/2, FIELD_SIZE/2],
			velocity: [0, 0],
			acceleration: [0, 0],
			mass: (MASS_MIN + MASS_MAX)/2,
		},
		sprite: "well",
		domRef: null,
	};
	addObjectToDOM(objects[1], 1);

	game.lastTick = Date.now();

	gameRoot.addEventListener('mousedown', mouseDownHandler)
	gameRoot.addEventListener('mousemove', mouseMoveHandler)
	gameRoot.addEventListener('mouseup', mouseUpHandler)

	requestAnimationFrame(gameTick);
}

function gameTick() {
	if (!game.over) {
		if (!game.paused) {
			const now = Date.now();
			const delta = (now - game.lastTick) / 10;
			const deltaSq = Math.pow(delta, 2);
			// score increases with time!
			game.score += delta;
			game.lastTick = now;
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
			const ship = objects[0];
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

			// end the game if ship health goes to zero or out of bounds
			if (
				ship.health < 0
				|| ship.physics.position[0] < 0
				|| ship.physics.position[0] > FIELD_SIZE
				|| ship.physics.position[1] < 0
				|| ship.physics.position[1] > FIELD_SIZE
			) {
				game.over = true;
				return;
			}

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
				addObjectToDOM(newWell, objects.length - 1);
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

			// update score
			renderScore(game.score)
			renderHealth(ship.health)

		}
		// update sprites, whether paused or not
		for (let object of objects) {
			renderObject(object);
		}
		requestAnimationFrame(gameTick);
	}
}

function pause() {
	game.paused = true;
}

function unpause() {
	game.lastTick = Date.now();
	game.paused = false;
	requestAnimationFrame(gameTick);
}

// F = ma
// F = mMG/d^2
// a = F / m = MG/d^2
function acceleration(obj1, obj2) {
	let diffX = obj2.physics.position[0] - obj1.physics.position[0];
	let diffY = obj2.physics.position[1] - obj1.physics.position[1];
	let masslessAccel = G / (Math.pow(diffX, 2) + Math.pow(diffY, 2));
	let angle = Math.atan(diffY / diffX);
	if (diffX < 0) {
		angle += Math.PI;
	}
	let xAccel = masslessAccel * Math.cos(angle);
	let yAccel = masslessAccel * Math.sin(angle);
	obj2.physics.acceleration[0] += -1 * obj1.physics.mass * xAccel;
	obj2.physics.acceleration[1] += -1 * obj1.physics.mass * yAccel;
	obj1.physics.acceleration[0] += obj2.physics.mass * xAccel;
	obj1.physics.acceleration[1] += obj2.physics.mass * yAccel;
}
