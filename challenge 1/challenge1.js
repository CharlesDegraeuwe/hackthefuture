const API_BASE = "https://exs-htf-2025.azurewebsites.net";
const TEAM_KEY = "cf955da6-0abf-4b01-bce4-892dc1ab28fb";

const headers = {
  Authorization: `Team ${TEAM_KEY}`,
  "Content-Type": "application/json",
};

function makeRequest(url, options = {}) {
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
    if (options.body) req.write(options.body);
    req.end();
  });
}

function decrypt(text, shift) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (char >= "A" && char <= "Z") {
      result += String.fromCharCode(
        ((char.charCodeAt(0) - 65 - shift + 26) % 26) + 65
      );
    } else if (char >= "a" && char <= "z") {
      result += String.fromCharCode(
        ((char.charCodeAt(0) - 97 - shift + 26) % 26) + 97
      );
    } else {
      result += char;
    }
  }
  return result;
}

function findShift(txt) {
  const words = ["de", "het", "een", "als", "jullie", "is", "we"];
  let best = 0,
    maxcount = 0;

  for (let s = 0; s < 26; s++) {
    let dec = decrypt(txt, s).toLowerCase();
    let cnt = 0;
    words.forEach((w) => {
      if (dec.includes(w)) cnt++;
    });
    if (cnt > maxcount) {
      maxcount = cnt;
      best = s;
    }
  }
  return best;
}

async function solve(test = true) {
  try {
    console.log("Fetching signal...");

    const res = await makeRequest(
      `${API_BASE}/api/challenges/signal?isTest=${test}`,
      {
        method: "GET",
        headers: headers,
      }
    );

    const data = await res.json();
    console.log("Got:", data);

    const encrypted = data.cipherText;
    if (!encrypted) {
      console.log("No cipher text found");
      return;
    }

    // try all shifts
    console.log("\nTrying shifts:");
    for (let i = 0; i < 26; i++) {
      console.log(`${i}: ${decrypt(encrypted, i)}`);
    }

    const shift = findShift(encrypted);
    const answer = decrypt(encrypted, shift).trim();

    console.log(`\nBest: shift ${shift}`);
    console.log(`Answer: ${answer}`);

    // submit
    console.log("\nSubmitting...");
    const subRes = await makeRequest(`${API_BASE}/api/challenges/signal`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ answer: answer }),
    });

    if (!subRes.ok) {
      const err = await subRes.text();
      console.log("Failed:", subRes.status, err);
      return;
    }

    const txt = await subRes.text();
    if (txt) {
      try {
        console.log("Result:", JSON.parse(txt));
      } catch (e) {
        console.log("Result:", txt);
      }
    } else {
      console.log("Success!");
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

// run test first
solve(true).then(() => {
  console.log("\n---\nTest done. Uncomment below for real attempt:\n");
  solve(false);
});
