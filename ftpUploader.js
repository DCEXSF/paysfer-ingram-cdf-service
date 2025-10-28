const Client = require("ssh2-sftp-client");
const fs = require("fs");
const path = require("path");

async function uploadToFTP(localFilePath) {
  const sftp = new Client();
  const remoteDir = "/incoming";
  const fileName = path.basename(localFilePath);

  try {
    await sftp.connect({
      host: "ftp.ingramcontent.com",
      port: parseInt("22"),
      username: "c20AS036",
      password: "it3xozyR",
    });

    const remotePath = path.join(remoteDir, fileName);
    await sftp.put(fs.createReadStream(localFilePath), remotePath);
    console.log(`✅ Uploaded to Ingram FTP: ${remotePath}`);
  } catch (err) {
    console.error("❌ FTP upload failed:", err.message);
    throw err;
  } finally {
    sftp.end();
  }
}

module.exports = { uploadToFTP };