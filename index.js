const functions = require('@google-cloud/functions-framework');
const { uploadToFTP } = require("./ftpUploader");
const { uploadToGCS } = require("./uploadToGcs");
const generateFBOFile = require("./formatToCdfl");

functions.http('processOrder', async(req, res) => {
try {
    const orderProps = req.body;
    const isProd = req.body.isProd;
    if(!isProd) {
      res.send(`Orders Are not Sent Because we are in beta testing!`);
    }
    else{
      const fboFilePath = await generateFBOFile(orderProps);
      await uploadToGCS(fboFilePath);
      await uploadToFTP(fboFilePath);
      res.send(`Order Sent Successfully!`);
    }

  } catch (err) {
    console.error("❌ Error in /processOrder:", err);
    res.send(`Order not Sent Successfully! ${err.message}`);
  }
});
