import fs from "fs";
import moment from "moment";
import mustache from "mustache";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Pads string left with zeros.
 */
const padLeftZero = (str, length) => str?.toString().padStart(length, "0");

/**
 * Pads the string with right spaces so the total length is exactly `totalLength`.
 * The actual content stays at the beginning, and the rest is filled with spaces.
 *
 * @param {string} str - The input string.
 * @param {number} totalLength - The final total length of the field.
 * @returns {string} - The padded string.
 */
const padToFixedLength = (str, totalLength) => {
  const actual = str?.toString() || "";
  const spaceNeeded = totalLength - actual.length;
  return actual + " ".repeat(Math.max(spaceNeeded, 0));
};

/**
 * Left-pads the input with zeros to the specified total length.
 * @param {string | number} value - The value to pad.
 * @param {number} totalLength - The desired final length.
 * @returns {string}
 */
const padFixedZero = (value, totalLength) => {
  return value.toString().padStart(totalLength, "0");
};

const generate10DigitNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

/**
 * Generates FBO file content using Mustache template.
 * @param {{ user: any, address: any, order: any }} input
 */
const generateFBOFile = ({ user, address, order }) => {
  console.log("Generating FBO file for Order ID:", order);
  console.log("User:", user);
  console.log("Address:", address);
  const creationDate = moment().format("YYMMDD");
  const NinetyDaysFromNow = moment().add(90, "days").format("YYMMDD");
  const fileName = padToFixedLength(`${order.ID}.fbo`, 22);
  const orderIdNoSpace = (order.ID || "").trim();
  const fileNameWithSubSpace = padToFixedLength(order.ID, 22);
  const accountNumber = "20AS036";
  const items = order.Items || [];
  const isMultiple = items.length > 1;
  const country = address.Country;
  const currentCountry = country === "CAN" ? "CAN" : "USA";
  const SHIPPING =
    currentCountry === "USA" ? "### USA ECONOMY" : "### INTL  COURIER";
  const records = items.map((item, index) => {
    const randomNumber = generate10DigitNumber();
    const fileNameWithSubSpaceIndex = padToFixedLength(
      (item.ID || "").replace(/[\s-]/g, ""),
      22
    );
    return {
      poaLineNumber: padToFixedLength(randomNumber, 22),
      EAN: padToFixedLength(item.SellerSKU || item.EAN, 20),
      itemPrice: padToFixedLength(
        padLeftZero(
          String(parseFloat(item?.totalItemPrice || 0).toFixed(2)),
          8
        ),
        17
      ),
      index,
      fileNameWithSubSpace: fileNameWithSubSpaceIndex,
      accountNumber,
      itemQuantity: padFixedZero(String(item?.Quantity) || "1", 7),
    };
  });
  if (isMultiple) {
    const headerTemplatePath = path.join(__dirname, "header.mustache");
    const headerTemplate = fs.readFileSync(headerTemplatePath, "utf8");
    const headerOutput = mustache.render(headerTemplate, {
      creationDate,
      fileName,
      isMultiple,
    });
    const bodyTemplatePath = path.join(__dirname, "repeat.mustache");
    const bodyTemplate = fs.readFileSync(bodyTemplatePath, "utf8");
    let bodyOutput = records
      .map((record) =>
        mustache.render(bodyTemplate, {
          ...record,
          creationDate,
          fileName,
          fileNameWithSubSpace:
            record.fileNameWithSubSpace || fileNameWithSubSpace,
          accountNumber,
          backOrderCancellationDate: NinetyDaysFromNow,
          isBackOrder: "Y",
          shippingMethod: padToFixedLength(SHIPPING, 26),
          userName: padToFixedLength(`${user.firstName} ${user.lastName}`, 50),
          userNumber: padToFixedLength(
            address.DaytimePhone || user.phoneNumber || "0000000000",
            51
          ),
          userAddressLine: padToFixedLength(address.AddressLine1, 51),
          userAddressLine2: padToFixedLength(address.AddressLine2, 51),
          userCity: padToFixedLength(address.City, 25),
          userState: padToFixedLength(address.StateOrProvince, 3),
          userZipCode: padToFixedLength(address.PostalCode, 11),
          userCountry: padToFixedLength(currentCountry, 3),
        })
      )
      .join("\n");
    bodyOutput = bodyOutput.replace(/&#x2F;/g, "/");
    const footerTemplatePath = path.join(__dirname, "footer.mustache");
    const footerTemplate = fs.readFileSync(footerTemplatePath, "utf8");
    const footerOutput = mustache.render(footerTemplate, {
      "40Records": padFixedZero(records.length, 13),
      "10Records": padFixedZero(records.length, 5),
      "4041Records": padFixedZero(records.length, 10),
      "0Records": padFixedZero(records.length * 1, 5),
      "1Records": padFixedZero(records.length * 2, 5),
      "2Records": padFixedZero(records.length * 5, 5),
      "3Records": padFixedZero(records.length * 5, 5),
      "4Records": padFixedZero(records.length * 2, 5),
      "5Records": padFixedZero(records.length, 5),
      "6Records": padFixedZero(0, 5),
      "7Records": padFixedZero(0, 5),
      "89Records": padFixedZero(1, 5),
    });
    const outputPath = path.join(__dirname, `${orderIdNoSpace}.fbo`);
    fs.writeFileSync(
      outputPath,
      headerOutput + bodyOutput + "\n" + footerOutput,
      "utf8"
    );

    return outputPath;
  }

  const mustacheData = {
    isMultiple,
    creationDate,
    fileName,
    fileNameWithSubSpace,
    accountNumber,
    backOrderCancellationDate: NinetyDaysFromNow,
    isBackOrder: "Y",
    shippingMethod: padToFixedLength(SHIPPING, 26),
    userName: padToFixedLength(`${user.firstName} ${user.lastName}`, 50),
    userNumber: padToFixedLength(
      address.DaytimePhone || user.phoneNumber || "0000000000",
      51
    ),
    userAddressLine: padToFixedLength(address.AddressLine1, 51),
    userAddressLine2: padToFixedLength(address.AddressLine2, 51),
    userCity: padToFixedLength(address.City, 25),
    userState: padToFixedLength(address.StateOrProvince, 3),
    userZipCode: padToFixedLength(address.PostalCode, 11),
    userCountry: padToFixedLength(currentCountry, 3),
    ...(!isMultiple ? records[0] : {}),
    is90RecordRequired: false,
  };

  const templatePath = path.join(__dirname, "fbo.mustache");
  const template = fs.readFileSync(templatePath, "utf8");

  let output = mustache.render(template, mustacheData);
  output = output.replace(/&#x2F;/g, "/");
  const outputPath = path.join(__dirname, `${orderIdNoSpace}.fbo`);

  fs.writeFileSync(outputPath, output, "utf8");

  return outputPath;
};

export { generateFBOFile };
