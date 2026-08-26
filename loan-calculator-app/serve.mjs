import http from "node:http";
import app from "./dist/server/index.js";

http.createServer(async (req, res) => {
  const response = await app.fetch(new Request(`http://127.0.0.1:4317${req.url}`));
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(4317, "127.0.0.1");
