// npm install pathfinding

const PF = require('pathfinding');

// final variables
const TEAM_KEY = "cf955da6-0abf-4b01-bce4-892dc1ab28fb";
const BASE_URL = "https://exs-htf-2025.azurewebsites.net";
const URL_POEP = "/api/challenges/sonar";

// header
const headers = {
	Authorization: `Team ${TEAM_KEY}`,
	"Content-Type": "application/json",
};

// ============= 3D PATHFINDING MET PATHFINDING LIBRARY =============

function findPath3D(start, end, heatmap, maxFuel) {
	const [startX, startY, startZ] = start;
	const [endX, endY, endZ] = end;

	console.log("🔍 Zoeken naar pad van", start, "naar", end);

	// Converteer 3D heatmap naar een walkable grid
	// heatmap[z][y][x] waarbij z van 0-100 (represents -100 tot 0)
	const depth = heatmap.length;        // Z-dimensie (101 lagen)
	const height = heatmap[0].length;    // Y-dimensie
	const width = heatmap[0][0].length;  // X-dimensie

	console.log(`📐 Grid dimensies: ${width}x${height}x${depth}`);

	// Maak een "flat" representatie: elke Z-laag wordt een sectie in de grid
	// Grid wordt [Z * height + Y][X]
	const flatHeight = depth * height;
	const grid = new PF.Grid(width, flatHeight);

	// Vul de grid met walkable/non-walkable cellen
	for (let z = 0; z < depth; z++) {
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const value = heatmap[z][y][x];
				const flatY = z * height + y;

				// 0 = walkable, anders = obstakel
				if (value !== 0) {
					grid.setWalkableAt(x, flatY, false);
				}
			}
		}
	}

	// Converteer 3D coördinaten naar flat grid coördinaten
	const flatStartY = (startZ + 100) * height + startY;
	const flatEndY = (endZ + 100) * height + endY;

	console.log(`🎯 Flat start: [${startX}, ${flatStartY}]`);
	console.log(`🎯 Flat end: [${endX}, ${flatEndY}]`);

	// Check of start en eind walkable zijn
	if (!grid.isWalkableAt(startX, flatStartY)) {
		console.error("❌ Start positie is niet walkable!");
		return null;
	}
	if (!grid.isWalkableAt(endX, flatEndY)) {
		console.error("❌ Eind positie is niet walkable!");
		return null;
	}

	// Gebruik A* pathfinder met diagonale beweging uitgeschakeld
	const finder = new PF.AStarFinder({
		allowDiagonal: false,
		dontCrossCorners: true
	});

	const path2D = finder.findPath(startX, flatStartY, endX, flatEndY, grid);

	if (!path2D || path2D.length === 0) {
		console.log("❌ Geen pad gevonden!");
		return null;
	}

	console.log(`✅ Pad gevonden! Lengte: ${path2D.length - 1} moves`);

	// Converteer 2D pad terug naar 3D bewegingen
	const moves = [];
	for (let i = 1; i < path2D.length; i++) {
		const [prevX, prevFlatY] = path2D[i - 1];
		const [currX, currFlatY] = path2D[i];

		// Bereken 3D coördinaten
		const prevZ = Math.floor(prevFlatY / height) - 100;
		const prevY = prevFlatY % height;
		const currZ = Math.floor(currFlatY / height) - 100;
		const currY = currFlatY % height;

		// Bepaal richting
		const dx = currX - prevX;
		const dy = currY - prevY;
		const dz = currZ - prevZ;

		if (dx === -1) moves.push('L');
		else if (dx === 1) moves.push('R');
		else if (dy === -1) moves.push('B');
		else if (dy === 1) moves.push('F');
		else if (dz === 1) moves.push('U');
		else if (dz === -1) moves.push('D');
	}

	// Check fuel constraint
	if (moves.length > maxFuel) {
		console.log(`⚠️ Pad is te lang (${moves.length} > ${maxFuel})`);
		return null;
	}

	return moves;
}

// ============= MAIN OPLOSSING =============

async function oplossing() {
	const isTest = false;
	const data = await getData(isTest);

	if (!data) {
		console.error("Geen data ontvangen!");
		return;
	}

	console.log("📍 Start:", data.startPoint);
	console.log("🎯 Eind:", data.endPoint);
	console.log("⛽ Fuel:", data.fuelCount);
	console.log("🗺️  Heatmap size:", data.sonarHeatmap.length, "x",
		data.sonarHeatmap[0]?.length, "x",
		data.sonarHeatmap[0]?.[0]?.length);

	// Debug: check heatmap waarden op start en eind
	const [sx, sy, sz] = data.startPoint;
	const [ex, ey, ez] = data.endPoint;
	console.log("🔍 Start positie waarde:", data.sonarHeatmap[sz + 100]?.[sy]?.[sx]);
	console.log("🔍 Eind positie waarde:", data.sonarHeatmap[ez + 100]?.[ey]?.[ex]);

	// Zoek pad met pathfinding library
	const path = findPath3D(
		data.startPoint,
		data.endPoint,
		data.sonarHeatmap,
		data.fuelCount
	);

	if (!path) {
		console.log("⚠️  Geen geldig pad gevonden - submit leeg array");
		await Submitten([], isTest);
		return;
	}

	console.log("📋 Path:", path.join(''));
	console.log("📏 Aantal moves:", path.length);

	// Submit de oplossing
	await Submitten(path, isTest);
}

//hulp functies
async function getData(isTest) {
	const url = `${BASE_URL}${URL_POEP}?isTest=${isTest ? "true" : "false"}`;

	try {
		const ans = await fetch(url, { headers });

		if (!ans.ok) {
			const errorText = await ans.text();
			throw new Error(`HTTP ${ans.status}: ${errorText}`);
		}

		const data = await ans.json();
		return data;

	} catch (err) {
		console.error("Fout bij ophalen data:", err.message || err);
		return null;
	}
}

async function Submitten(result, isTest) {
	const url = `${BASE_URL}${URL_POEP}?isTest=${isTest ? "true" : "false"}`;

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Team ${TEAM_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ answer: result }),
		});

		console.log("\n📤 Response status:", response.status);

		const responseData = await response.json();
		console.log("📥 Response body:", JSON.stringify(responseData, null, 2));

		if (response.ok) {
			console.log("✅ SUCCESVOL INGEDIEND!");
		} else {
			console.log("❌ Foutieve oplossing");
		}

	} catch (err) {
		console.error("Fout bij submitten:", err.message || err);
	}
}

// Start de oplossing
oplossing();