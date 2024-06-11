import { getPublicKey, kinds, nip19 } from "nostr-tools";
import { SimplePool, useWebSocketImplementation } from "nostr-tools/pool";
import { finalizeEvent } from "nostr-tools/pure";
import { config } from "dotenv";
import WebSocket from "ws";
import http from "http";
import url from "url";

useWebSocketImplementation(WebSocket);
config();

const binaryPrivateKey = nip19.decode(process.env.BOT_NSEC).data;
const relayUrls = process.env.RELAY_URLS.split(",");
const apiKey = process.env.API_KEY;

const pool = new SimplePool();

const postMessage = async () => {
  try {
    const event = finalizeEvent(
      {
        kind: kinds.ShortTextNote,
        pubkey: getPublicKey(binaryPrivateKey),
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: "No"
      },
      binaryPrivateKey
    );

    await Promise.any(pool.publish(relayUrls, event));
  } catch (error) {
    console.error("Error posting message:", error);
  }
};

const server = http.createServer((req, res) => {
  if (req.method === "POST" && url.parse(req.url).pathname === "/trigger") {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const requestApiKey = req.headers["x-api-key"];
      if (requestApiKey !== apiKey) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Forbidden");
        return;
      }
      
      postMessage()
        .then(() => {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("Post triggered successfully");
        })
        .catch((error) => {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(`Error: ${error.message}`);
        });
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
