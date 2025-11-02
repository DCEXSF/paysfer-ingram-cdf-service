import { uploadToFTP } from "./ftpUploader.js";
import { uploadToGCS } from "./uploadToGcs.js";
import { generateFBOFile } from "./formatToCdfl.js";

async function handleOrder(orderProps, isProd) {
  //   console.log("Order Props:", orderProps);
  //   console.log("isProd:", isProd);
  if (!isProd) {
    return `Orders Are not Sent Because we are in beta testing!`;
  }
  const fboFilePath = await generateFBOFile(orderProps);
  await uploadToGCS(fboFilePath);
  await uploadToFTP(fboFilePath);
  return `Order Sent Successfully!`;
}

export { handleOrder };
