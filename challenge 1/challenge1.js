// Configuratie
const API_BASE = "https://exs-htf-2025.azurewebsites.net";
const TEAM_KEY = "cf955da6-0abf-4b01-bce4-892dc1ab28fb"; // Vervang dit met jouw team key!

// Headers voor authenticatie
const headers = {
  Authorization: `Team ${TEAM_KEY}`,
  "Content-Type": "application/json",
};

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

// Functie om alle mogelijke shifts te proberen
function bruteForceDecrypt(encryptedText) {
  console.log("🔍 Proberen alle shifts...\n");

  for (let shift = 0; shift < 26; shift++) {
    let decrypted = decryptCaesar(encryptedText, shift);
    console.log(`Shift ${shift}: ${decrypted}`);
  }
}

// Hoofdfunctie om de challenge op te lossen
async function solveChallenge1() {
  try {
    console.log("🌊 Starting Challenge 1 - Het Signaal\n");

    // Stap 1: Haal het versleutelde signaal op
    console.log("📡 Fetching encrypted signal...");
    const response = await fetch(`${API_BASE}/api/challenge1`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📨 Received data:", data);

    // Zoek het versleutelde bericht in de response
    const encryptedMessage = data.signal || data.message || data.encrypted;
    console.log("\n🔒 Encrypted message:", encryptedMessage);

    // Stap 2: Probeer alle shifts
    bruteForceDecrypt(encryptedMessage);

    // Bepaal de juiste shift (dit moet je handmatig doen door de output te bekijken)
    console.log(
      "\n👆 Kijk naar de output hierboven en bepaal welke shift de juiste tekst geeft!"
    );
    console.log(
      "Bijvoorbeeld: als shift 13 leesbare tekst geeft, gebruik dan:"
    );
    console.log("const correctShift = 13;");
    console.log(
      "const decryptedMessage = decryptCaesar(encryptedMessage, correctShift);"
    );

    // Als je de juiste shift hebt gevonden (bijvoorbeeld 13):
    // const correctShift = 13;
    // const decryptedMessage = decryptCaesar(encryptedMessage, correctShift);

    // Stap 3: Verstuur het antwoord
    // const submitResponse = await fetch(`${API_BASE}/api/challenge1/submit`, {
    //     method: 'POST',
    //     headers: headers,
    //     body: JSON.stringify({
    //         answer: decryptedMessage
    //     })
    // });

    // const result = await submitResponse.json();
    // console.log('✅ Result:', result);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Start de challenge!
solveChallenge1();
