const { Storage } = require("@google-cloud/storage");
const path = require("path");

const storage = new Storage();
const bucketName = "ingramftporders";

async function uploadToGCS(filePath) {
  const fileName = path.basename(filePath);
  await storage.bucket(bucketName).upload(filePath, {
    destination: fileName,
  });

  console.log(`✅ Uploaded to GCS: ${fileName}`);
  return `gs://${bucketName}/${fileName}`;
}

module.exports = { uploadToGCS };
