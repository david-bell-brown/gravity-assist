const gameRoot = document.getElementById('root');

let gameStart = null; // Date
let objects = [];
let paused = false;
let input = {
}

const HEALTH_DECAY_PER_SEC = 1;
const HEALTH_ACCEL_FACTOR = 1;
const MAX_HEALTH = 100;
const MIN_HEALTH = 0;
const FIELD_SIZE = 1000;
const MASS_MIN = 3;
const MASS_MAX = 100;
const SHIP_MASS = 1;
const G = 1;

// ship start
objects[0] = {
	physics: {
		position: [0, FIELD_SIZE / 3],
		velocity: [1, 0, 1], // [x, y, h^2]
		acceleration: [0, 0, 0], // [x, y, h^2]
		mass: 1,
	},
	sprite: "ship" , // DOM ID ref
};
// first mass
objects[1] = {
	physics: {
		position: [FIELD_SIZE/2, FIELD_SIZE/2],
		velocity: [0, 0, 0],
		acceleration: [0, 0, 0],
		mass: MASS_MIN,
	},
	sprite: "well",
};

function fixSquares(obj) {
	let v = obj.physics.velocity;
	v[2] = v[0]*v[0] + v[1]*v[1];
	let a = obj.physics.acceleration;
	a[2] = a[0]*a[0] + a[1]*a[1];
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

const mouseToMass = x => x / 20

const clampMass = x => Math.max(Math.min(x, MASS_MAX), MASS_MIN)

gameRoot.addEventListener('mousedown', e => {
	input.mouseDown = true

	if(e.target && e.target.dataset.type === 'well') {
		input.target = e.target.dataset.id
		// input.targetMass = objects[input.target].physics.mass
		input.targetMass = 10
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
			magnitude = mouseDelta[1]
		}
		// objects[target].physics.mass = clampMass(magnitude + input.targetMass)
		console.log(clampMass(magnitude + input.targetMass))
	}
})

gameRoot.addEventListener('mouseup', e => {
	input = {}
})
