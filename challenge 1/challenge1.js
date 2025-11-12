// Configuratie
const API_BASE = "https://exs-htf-2025.azurewebsites.net";
const TEAM_KEY = "cf955da6-0abf-4b01-bce4-892dc1ab28fb";

// Headers voor authenticatie
const headers = {
  Authorization: `Team ${TEAM_KEY}`,
  "Content-Type": "application/json",
};

// Helper functie voor fetch (werkt in alle Node.js versies)
async function makeRequest(url, options = {}) {
  const https = require("https");
  const urlParsed = new URL(url);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: urlParsed.hostname,
        port: 443,
        path: urlParsed.pathname + urlParsed.search,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(data),
            text: async () => data,
          });
        });
      }
    );

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Functie om Caesar cipher te ontcijferen
function decryptCaesar(text, shift) {
  let result = "";

  for (let i = 0; i < text.length; i++) {
    let char = text[i];

    // Hoofdletters
    if (char >= "A" && char <= "Z") {
      let code = char.charCodeAt(0);
      code = ((code - 65 - shift + 26) % 26) + 65;
      result += String.fromCharCode(code);
    }
    // Kleine letters
    else if (char >= "a" && char <= "z") {
      let code = char.charCodeAt(0);
      code = ((code - 97 - shift + 26) % 26) + 97;
      result += String.fromCharCode(code);
    }
    // Andere tekens (spaties, leestekens, etc.)
    else {
      result += char;
    }
  }

  return result;
}

// Functie om automatisch de beste shift te vinden
function findBestShift(encryptedText) {
  const commonWords = [
    "de",
    "het",
    "een",
    "als",
    "jullie",
    "atlantis",
    "tijd",
    "dringt",
  ];
  let bestShift = -1;
  let maxMatches = 0;

  for (let shift = 0; shift < 26; shift++) {
    let decrypted = decryptCaesar(encryptedText, shift).toLowerCase();

    // Tel hoeveel common words er voorkomen
    let matches = 0;
    for (let word of commonWords) {
      if (decrypted.includes(word)) {
        matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestShift = shift;
    }
  }

  return bestShift;
}

// Functie om alle shifts te tonen (voor debugging)
function showAllShifts(encryptedText) {
  console.log("Alle mogelijke ontcijferingen:\n");
  for (let shift = 0; shift < 26; shift++) {
    let decrypted = decryptCaesar(encryptedText, shift);
    console.log(`Shift ${shift.toString().padStart(2, "0")}: ${decrypted}`);
  }
}

// Hoofdfunctie om de challenge op te lossen
async function solveChallenge1(useTest = true) {
  try {
    console.log("Starting Challenge 1 - Het Signaal\n");

    // Stap 1: Haal het versleutelde signaal op
    console.log(`Fetching encrypted signal (test mode: ${useTest})...`);
    const getUrl = `${API_BASE}/api/challenges/signal?isTest=${useTest}`;

    const response = await makeRequest(getUrl, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Received data:", JSON.stringify(data, null, 2));

    // Zoek het versleutelde bericht
    const encryptedMessage =
      data.cipherText || data.signal || data.message || data.encrypted;

    if (!encryptedMessage) {
      console.error("Geen versleuteld bericht gevonden in response!");
      console.log("Response keys:", Object.keys(data));
      return;
    }

    // Als de API een shift hint geeft, toon deze
    if (data.shift !== undefined) {
      console.log(`Hint: shift = ${data.shift}`);
    }

    console.log("Encrypted message:", encryptedMessage);

    // Stap 2: Toon alle shifts
    showAllShifts(encryptedMessage);

    // Stap 3: Vind automatisch de beste shift
    const bestShift = findBestShift(encryptedMessage);
    console.log(`Best match found at shift: ${bestShift}`);

    const decryptedMessage = decryptCaesar(encryptedMessage, bestShift);
    console.log(`Decrypted message: ${decryptedMessage}`);

    // Stap 4: Verstuur het antwoord
    console.log("Submitting answer...");
    const submitResponse = await makeRequest(
      `${API_BASE}/api/challenges/signal`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          answer: decryptedMessage,
        }),
      }
    );

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(
        `Submit failed! status: ${submitResponse.status}, body: ${errorText}`
      );
    }

    const resultText = await submitResponse.text();
    console.log("Raw response:", resultText);

    // Probeer JSON te parsen, maar handle lege responses
    let result;
    if (resultText && resultText.trim().length > 0) {
      try {
        result = JSON.parse(resultText);
        console.log("Result:", JSON.stringify(result, null, 2));
      } catch (e) {
        console.log("Response (not JSON):", resultText);
        result = { message: resultText };
      }
    } else {
      console.log("✅ Empty response - likely successful!");
      result = { success: true };
    }

    if (result.success || result.correct || submitResponse.status === 200) {
      console.log("GELUKT! Challenge 1 voltooid!");
    } else {
      console.log("Answer submitted but may need verification");
    }
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Full error:", error);
  }
}

// Start met test mode
console.log("Starting in TEST mode first...\n");
solveChallenge1(true).then(() => {
  console.log("\n" + "=".repeat(60));
  console.log("Als test mode werkt, run dan: solveChallenge1(false)");
  console.log("Om de echte challenge te doen, uncomment de regel hieronder:");
  console.log("=".repeat(60));
});

//solveChallenge1(false);
