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
  
  

  try {
    const fboFilePath = await generateFBOFile(orderProps);
    // Upload to GCS
      await uploadToGCS(fboFilePath);
  // Upload to FTP and delete local file after success
    await uploadToFTP(fboFilePath);
    fs.unlinkSync(fboFilePath);
    console.log(`✅ Order processed and file deleted on local: ${fboFilePath}`);
    return `Order Sent Successfully!`;
  } catch (err) {
    if(err.message==="NONEEDTOORDERONCDF"){
      console.log("No items need to be ordered on CDF after removing Paysfer Warehouse items.");
      return `No items need to be ordered on CDF.`;
    }
    console.error(`❌ Error uploading or deleting file: ${err.message}`);
    return `Error: ${err.message}`;
  }
}

export { handleOrder };
