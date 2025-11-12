const TEAM_KEY = "cf955da6-0abf-4b01-bce4-892dc1ab28fb";
const BASE_URL = "https://exs-htf-2025.azurewebsites.net";

async function getSonarData(test = true) {
  const url = `${BASE_URL}/api/challenges/sonar?isTest=${test}`;
  const response = await fetch(url, {
    headers: { Authorization: `Team ${TEAM_KEY}` },
  });
  return response.json();
}

async function submitSolution(path, test = true) {
  const url = `${BASE_URL}/api/challenges/sonar`;

  // Try different formats
  const formats = [
    { answer: path }, // Array of arrays
    { answer: path.map((p) => p.join(",")) }, // Array of strings (current)
    { path: path }, // Different key name
    { coordinates: path }, // Different key name
  ];

  for (let i = 0; i < formats.length; i++) {
    console.log(`  Trying format ${i + 1}:`, Object.keys(formats[i])[0]);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Team ${TEAM_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formats[i]),
    });

    const text = await response.text();

    try {
      const result = JSON.parse(text);

      if (!result.errorCode) {
        console.log(`  ✅ SUCCESS with format ${i + 1}!`);
        return result;
      } else if (result.errorCode === "NO_ACTIVE_ATTEMPT") {
        console.log(`  ⏰ Challenge expired`);
        return result;
      } else if (result.errorCode !== "WRONG_ANSWER") {
        console.log(`  Different error: ${result.errorCode}`);
        return result;
      } else {
        console.log(`  ❌ Wrong answer with format ${i + 1}`);
      }
    } catch (e) {
      console.log(`  Parse error:`, text.substring(0, 100));
    }
  }

  return { errorCode: "ALL_FORMATS_FAILED" };
}

function generatePath(start, end) {
  const [sx, sy, sz] = start;
  const [ex, ey, ez] = end;

  const path = [[sx, sy, sz]];
  let pos = [sx, sy, sz];

  while (pos[2] !== ez) {
    pos = [pos[0], pos[1], pos[2] + (ez > pos[2] ? 1 : -1)];
    path.push([...pos]);
  }

  while (pos[1] !== ey) {
    pos = [pos[0], pos[1] + (ey > pos[1] ? 1 : -1), pos[2]];
    path.push([...pos]);
  }

  while (pos[0] !== ex) {
    pos = [pos[0] + (ex > pos[0] ? 1 : -1), pos[1], pos[2]];
    path.push([...pos]);
  }

  return path;
}

async function solve(isTest = true) {
  const mode = isTest ? "TEST" : "REAL";
  console.log(`\n${"=".repeat(60)}`);
  console.log(mode);
  console.log("=".repeat(60));

  const data = await getSonarData(isTest);
  console.log(`Start: [${data.startPoint}]`);
  console.log(`End:   [${data.endPoint}]`);

  const path = generatePath(data.startPoint, data.endPoint);
  console.log(`Path: ${path.length - 1} steps\n`);

  const result = await submitSolution(path, isTest);

  return !result.errorCode || result.errorCode === "NO_ACTIVE_ATTEMPT";
}

async function main() {
  console.log("🚢 TESTING DIFFERENT FORMATS");
  await solve(true);
  await solve(false);
}

main();
