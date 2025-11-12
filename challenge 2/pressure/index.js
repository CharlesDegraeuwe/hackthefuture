// final variables
const TEAM_KEY = "cf955da6-0abf-4b01-bce4-892dc1ab28fb";
const BASE_URL = "https://exs-htf-2025.azurewebsites.net";
const URL_POEP = "/api/challenges/reparations";

//static variables
const ATMOSFEER = 101325;
const ZEEWATER = 1025;
const ZK = 9.81;

// header
const headers = {
	Authorization: `Team ${TEAM_KEY}`,
	"Content-Type": "application/json",
};

async function oplossing() {
	const isTest = false;
	const data = await getData(isTest);

	const pressure = berkenDruk(data);
	const tanks = berekenTank(data);
	if (!tanks || !pressure) {
		throw new Error('data niet gevonden');
	}
	const result = {
		pressure: pressure,
		tankVolumes: tanks
	}
	console.log(result, isTest);
	Submitten(result, isTest)
}

//hulp functies
async function getData(isTest) {
	const url = `${BASE_URL}${URL_POEP}?isTest=${isTest ? "true" : "false"}`;

	try {
		const ans = await fetch(url, { headers });

		if (!ans.ok) {
			throw new Error("ni gevonden")
		}

		const data = await ans.json();
		return data;

	} catch (err) {
		console.error("Fout:", err.message || err);
	}
}

function berkenDruk(data) {
	const diepte = data.pressure.depth;

	const waterdruk =  ZEEWATER * ZK * diepte;
	const totale_druk = waterdruk + ATMOSFEER;


	return Math.round(totale_druk * 100) / 100;

}


//water verdelen over drie tanks
function berekenTank(data) {
	//wth bro
	console.log(data)
	const GEWICHT = data.buoyancy.submarineMass;
	const CENTER = data.buoyancy.centerOfMassOffset;
	const DISTANCE = data.buoyancy.tankDistance;

	const totaalWatervolume = GEWICHT / ZEEWATER;
	const basis = totaalWatervolume / 3; 	//delen dr 3 voor 3 tanks

	//duiker drijft als evenveel water verplaatst als massa
	let front, middle, back;
	middle = basis;

	//zwaartepunt nie verschoven
	if (CENTER === 0) {
		front = back = baseVolume;

	} else {
		const momentToCompensate = CENTER * GEWICHT;
		const volumeDifference =
			momentToCompensate / (DISTANCE * ZEEWATER);

		front = basis - volumeDifference / 2;
		back = basis + volumeDifference / 2;
	}

	return [
		Math.round(back * 100) / 100,
		Math.round(middle * 100) / 100,
		Math.round(front * 100) / 100,
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

	console.log("Response status:", response.status);
}

oplossing();
