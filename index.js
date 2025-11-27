const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json());

const SALSIFY_PAT = process.env.SALSIFY_PAT; // store your Personal Access Token as env variable

app.post("/asset-products", async (req, res) => {
  const { assetId } = req.body;
  if (!assetId) return res.status(400).json({ error: "Missing assetId" });

  try {
    const response = await fetch("https://api.salsify.com/v1/products/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SALSIFY_PAT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filters: [{ field: "assets", operator: "contains", values: [assetId] }],
        include_property_values: true
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: await response.text() });
    }

    const data = await response.json();

    // Build a map of product ID -> basic info
    const productMap = {};
    for (const product of data.data) {
      productMap[product.id] = {
        name: product.name,
        sku: product.sku,
        brand: product.brand,
        images: (product.property_values.find(p => p.property_id === "salsify:images") || {}).values || [],
        main_image: (product.property_values.find(p => p.property_id === "salsify:main_image") || {}).values || []
      };
    }

    res.json(productMap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Render sets PORT as environment variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook running on port ${PORT}`));