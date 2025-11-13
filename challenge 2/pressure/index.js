// Final variables
const TEAM_KEY = "cf955da6-0abf-4b01-bce4-892dc1ab28fb";
const BASE_URL = "https://exs-htf-2025.azurewebsites.net";
const URL_POEP = "/api/challenges/reparations";

// Static variables
const ATMOSFEER = 101325;     // Pascaleken (luchtdruk op zeeniveau)
const ZEEWATER = 1025;        // kg/m³ (dichtheid zeewater)
const ZK = 9.81;              // m/s² (zwaartekrachtversnelling)

// Headers
const headers = {
	Authorization: `Team ${TEAM_KEY}`,
	"Content-Type": "application/json",
};

async function oplossing() {
	const isTest = false;
	const data = await getData(isTest);

	const pressure = berekenDruk(data);
	const tanks = berekenTank(data);

	if (!tanks || !pressure) {
		throw new Error('Data niet gevonden');
	}

	const result = {
		pressure: pressure,
		tankVolumes: tanks
	};

	await Submitten(result, isTest);
}

// Hulp functies
async function getData(isTest) {
	const url = `${BASE_URL}${URL_POEP}?isTest=${isTest ? "true" : "false"}`;

	try {
		const ans = await fetch(url, { headers });
		if (!ans.ok) {
			throw new Error("Niet gevonden");
		}
		const data = await ans.json();
		return data;
	} catch (err) {
		return null;
	}
}

function berekenDruk(data) {
	const diepte = data.pressure.depth;
	const waterdruk = ZEEWATER * ZK * diepte;
	const totale_druk = waterdruk + ATMOSFEER;
	return Math.round(totale_druk * 100) / 100;
}

// Water verdelen over drie tanks
function berekenTank(data) {
	//bro wth
	const GEWICHT = data.buoyancy.submarineMass;
	const CENTER = data.buoyancy.centerOfMassOffset;
	const DISTANCE = data.buoyancy.tankDistance;

	const totaalWatervolume = GEWICHT / ZEEWATER;
	const basis = totaalWatervolume / 3; // Gelijkmatig verdelen over 3 tanks enz

	let front, middle, back;
	middle = basis;

	if (CENTER === 0) { //<-- wrm tk doen wij dit dan
		front = basis;
		back = basis;

	} else {
		const momentToCompensate = CENTER * GEWICHT;
		const volumeDifference = momentToCompensate / (DISTANCE * ZEEWATER);
		front = basis - volumeDifference / 2;
		back = basis + volumeDifference / 2;
	}

	return [
		Math.round(back * 100) / 100,
		Math.round(middle * 100) / 100,
		Math.round(front * 100) / 100
	];
}

async function Submitten(result, isTest) {
	const url = `${BASE_URL}${URL_POEP}?isTest=${isTest ? "true" : "false"}`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Team ${TEAM_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ answer: result }),
	});

}

// Start de oplossing
oplossing();