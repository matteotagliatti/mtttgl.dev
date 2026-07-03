import { createServer } from "node:http";

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPE = "user-top-read";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your environment before running this script.",
  );
  process.exit(1);
}

function waitForAuthorizationCode() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", REDIRECT_URI);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(`Authorization failed: ${error}`);
        server.close();
        reject(new Error(error));
        return;
      }

      if (url.pathname !== "/callback" || !code) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<p>Spotify authorization complete. You can close this tab and return to the terminal.</p>",
      );
      server.close();
      resolve(code);
    });

    server.listen(PORT, "127.0.0.1", () => {
      console.log(`Listening on ${REDIRECT_URI}`);
    });

    server.on("error", reject);
  });
}

const params = new URLSearchParams({
  client_id: clientId,
  response_type: "code",
  redirect_uri: REDIRECT_URI,
  scope: SCOPE,
  show_dialog: "true",
});

const authUrl = `https://accounts.spotify.com/authorize?${params}`;

console.log("\n1. Add this redirect URI in the Spotify Developer Dashboard:\n");
console.log(`   ${REDIRECT_URI}`);
console.log("\n   Use 127.0.0.1 — Spotify no longer accepts localhost.\n");
console.log("2. Open this URL in your browser:\n");
console.log(authUrl);
console.log("\n3. After authorizing, the script will capture the callback automatically.\n");

const code = await waitForAuthorizationCode();

const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const response = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    Authorization: `Basic ${basic}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  }),
});

const data = await response.json();

if (!response.ok) {
  console.error("Token exchange failed:", data);
  process.exit(1);
}

console.log("\nAdd this to your .env file:\n");
console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
