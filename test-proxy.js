const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const backend = express();
backend.use((req, res) => {
  console.log(`[BACKEND] Received request for ${req.url}`);
  res.send("OK");
});
backend.listen(5000, () => {
  console.log("Backend listening on 5000");

  const proxy = express();
  proxy.use(
    "/api/clientes",
    createProxyMiddleware({
      target: "http://localhost:5000",
      changeOrigin: true,
    }),
  );
  proxy.listen(5001, () => {
    console.log("Proxy listening on 5001");
    const http = require("node:http");
    http.get("http://localhost:5001/api/clientes", (res) => {
      console.log(`Got response: ${res.statusCode}`);
      process.exit(0);
    });
  });
});
