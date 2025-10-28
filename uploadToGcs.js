import { Storage } from "@google-cloud/storage";
import path from "path";

const storage = new Storage();
const bucketName = "ingramftporders";

export async function uploadToGCS(filePath) {
  const fileName = path.basename(filePath);
  await storage.bucket(bucketName).upload(filePath, {
    destination: fileName,
  });

  console.log(`✅ Uploaded to GCS: ${fileName}`);
  return `gs://${bucketName}/${fileName}`;
}
