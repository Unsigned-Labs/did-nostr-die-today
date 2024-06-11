import { getPublicKey, kinds, nip19 } from "nostr-tools";
import { SimplePool, useWebSocketImplementation } from "nostr-tools/pool";
import { finalizeEvent } from "nostr-tools/pure";
import { config } from "dotenv";
import WebSocket from "ws";

useWebSocketImplementation(WebSocket);
config();

const binaryPrivateKey = nip19.decode(process.env.BOT_NSEC).data;
const relayUrls = process.env.RELAY_URLS.split(",");

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
    console.log("Post sent successfully!");
  } catch (error) {
    console.error("Error posting message:", error);
  }
};

postMessage();
