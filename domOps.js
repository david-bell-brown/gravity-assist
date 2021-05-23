const gameRoot = document.getElementById('root');
let input = {
}


function addObjectToDOM(obj) {
	// TODO
	// build sprite and hold ref in obj.domRef
}

function removeObjectFromDOM(obj) {
	// TODO
}

const getSize = (mass, type) => ({
	ship: 50,
	well: mass
})[type]

function renderObject({domRef, physics, sprite}) {
	const size = getSize(physics.mass, sprite)
	const attributes = {
		x: physics.position[0] - (size / 2),
		y: physics.position[1] - (size / 2),
		width: size,
		height: size,
	}
	Object.keys(attributes).forEach(k => {
		domRef.setAttributeNS("http://www.w3.org/2000/svg", k, attributes[k])
	})
}

function renderScore(score) {
	document.getElementById("hud-score").innerHTML = score
}

const mouseToMass = x => x / 50

const clampMass = x => Math.max(Math.min(x, MASS_MAX), MASS_MIN)

gameRoot.addEventListener('mousedown', e => {
	input.mouseDown = true

	if(e.target && e.target.dataset.type === 'well') {
		game.paused = true
		input.target = e.target.dataset.id
		input.targetMass = objects[input.target].physics.mass
		// input.targetMass = 50
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
		objects[target].physics.mass = clampMass(magnitude + input.targetMass)
		// document.getElementById("hud-score").innerHTML = clampMass(magnitude + input.targetMass)
	}
})

gameRoot.addEventListener('mouseup', e => {
	input = {}
	game.paused = false
})
