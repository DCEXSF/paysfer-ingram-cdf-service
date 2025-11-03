import express from "express";
import bodyParser from "body-parser";
import { handleOrder } from "./handleOrder.js";
import { getOrderProps } from "./generateOrderProps.js";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(bodyParser.json());

// Reusable order handler

app.post("/processOrder", async (req, res) => {
  let response = "";
  try {
    // console.log("Request body:", req.body);
    const orderProps = req.body;
    const isProd = req.body.isProd;
    // console.log("Received orderProps:", orderProps);
    // console.log("isProd:", isProd);

    response = await handleOrder(orderProps, isProd);
  } catch (err) {
    console.error("❌ Error in /processOrder:", err);
    res.send(`Error: ${err.message}`);
  }
  res.send(response);
});

app.get("/processOrder/:orderId", async (req, res) => {
  const { orderId } = req.params;
  // Implement logic to retrieve and return the order status
  const orderProps = await getOrderProps(orderId);
  let response = "";
  try {
    response = await handleOrder(orderProps, true);
  } catch (error) {
    res.send(`Error processing order: ${error.message}`);
    return;
  }
  res.send(response);
});

app.get("/health", (req, res) => {
  res.send("server is healthy");
});

// Endpoint to verify mustache_templates and files
app.get("/verify-templates", (req, res) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const templatesDir = path.join(__dirname, "mustache_templates");
  const requiredFiles = [
    "footer.mustache",
    "header.mustache",
    "items.mustache",
    "seller.mustache",
    "shipping.mustache",
  ];
  let result = {
    folderExists: false,
    files: {},
  };
  try {
    result.folderExists = fs.existsSync(templatesDir);
    requiredFiles.forEach((file) => {
      const filePath = path.join(templatesDir, file);
      result.files[file] = fs.existsSync(filePath);
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).send("Endpoint not found");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
