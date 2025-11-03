import { uploadToFTP } from "./ftpUploader.js";
import { uploadToGCS } from "./uploadToGcs.js";
import { generateFBOFile } from "./formatToCdfl.js";
import fs from "fs";

async function handleOrder(orderProps, isProd) {
  //   console.log("Order Props:", orderProps);
  //   console.log("isProd:", isProd);
  if (!isProd) {
    return `Orders Are not Sent Because we are in beta testing!`;
  }
  const fboFilePath = await generateFBOFile(orderProps);
  await uploadToGCS(fboFilePath);
  // Upload to FTP and delete local file after success
  try {
    await uploadToFTP(fboFilePath);
    fs.unlinkSync(fboFilePath);
    console.log(`✅ Order processed and file deleted on local: ${fboFilePath}`);
    return `Order Sent Successfully!`;
  } catch (err) {
    console.error(`❌ Error uploading or deleting file: ${err.message}`);
    return `Error: ${err.message}`;
  }
}

export { handleOrder };
