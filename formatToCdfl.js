import fs from "fs";
import moment from "moment";
import mustache from "mustache";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __mustacheDir = path.join(__dirname, "mustache_templates");
import {isPaysferWarehouseStockAvailable,removePaysferWarehouseItemsFromOrder} from './itemAvaillabilityCheckService.js';
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

function formatOrderId(orderId) {
  // If already contains dashes, return as is
  if (orderId.includes("-")) return orderId;
  // If length is 13 and no dashes, format as XXXX-XXXXXX-XXXX
  if (/^\d{14}$/.test(orderId)) {
    console.log("Formatted Order ID:"); // "7810-044585-0010"); // "7810-044585-0010"
    return `${orderId.slice(0, 4)}-${orderId.slice(4, 10)}-${orderId.slice(
      10
    )}`;
  }
  // Otherwise, return original
  return orderId;
}

const generateFBOFile = async ({ user, address, order }) => {
  let filteredOrder = await removePaysferWarehouseItemsFromOrder(order);
  order = filteredOrder.order;
  console.log("needToOrderOnCDF:", filteredOrder.needToOrderOnCDF);
  console.log(filteredOrder.order);
  if (!filteredOrder.needToOrderOnCDF) {
    throw new Error("NONEEDTOORDERONCDF");
    console.log("No items need to be ordered on CDF after removing Paysfer Warehouse items.");
    return {needToOrderOnCDF:filteredOrder.needToOrderOnCDF};
  }
console.log("Order after removing Paysfer Warehouse items:", order);
  const creationDate = moment().format("YYMMDD");
  const NinetyDaysFromNow = moment().add(90, "days").format("YYMMDD");
  let orderIdNoSpace = (order.ID || "").trim();
  orderIdNoSpace = formatOrderId(orderIdNoSpace);
  const fileName = padToFixedLength(`${orderIdNoSpace}.fbo`, 22);
  console.log("Order ID No Space:", orderIdNoSpace);
  console.log("File Name:", fileName);
  // return orderIdNoSpace;
  // const fileNameWithSubSpace = padToFixedLength(order.ID, 22);
  const accountNumber = "20AS036";
  const items = order.Items || [];
  const country = address.Country;
  // Map state/province for UK countries if needed
  let userState = address.StateOrProvince;
  if (typeof userState === "string") {
    const stateMap = {
      england: "ENG",
      scotland: "SCT",
      wales: "WLS",
      "northern ireland": "NIR"
    };
    const normalized = userState.trim().toLowerCase();
    if (stateMap[normalized]) {
      userState = stateMap[normalized];
    }
  }
  // const currentCountry = country === "CAN" ? "CAN" : "USA";
  const currentCountry = country;
  const SHIPPING =
    currentCountry === "USA" ? "### USA ECONOMY" : "### INTL COURIER";

  let totalItemsQuantity = 0;

  // Render header
  const headerTemplatePath = path.join(__mustacheDir, "header.mustache");
  const headerTemplate = fs.readFileSync(headerTemplatePath, "utf8");
  const backOrderCancellationDate = NinetyDaysFromNow;
  const headerOutput = mustache.render(headerTemplate, {
    creationDate,
    fileName,
    orderIdNoSpace: padToFixedLength(orderIdNoSpace, 22),
    accountNumber,
    backOrderCancellationDate,
  });

  // Render seller section
  const sellerTemplatePath = path.join(__mustacheDir, "seller.mustache");
  const sellerTemplate = fs.readFileSync(sellerTemplatePath, "utf8");
  const sellerOutput = mustache.render(sellerTemplate, {
    orderIdNoSpace: padToFixedLength(orderIdNoSpace, 22),
    accountNumber,
    shippingMethod: padToFixedLength(SHIPPING, 26),
  });

  // Render shipping section
  const shippingTemplatePath = path.join(__mustacheDir, "shipping.mustache");
  const shippingTemplate = fs.readFileSync(shippingTemplatePath, "utf8");
  const shippingOutput = mustache.render(shippingTemplate, {
    orderIdNoSpace: padToFixedLength(orderIdNoSpace, 22),
    userName: padToFixedLength(`${user.firstName} ${user.lastName}`, 50),
    userNumber: padToFixedLength(
      address.DaytimePhone || user.phoneNumber || "0000000000",
      51
    ),
    userAddressLine: padToFixedLength(address.AddressLine1, 50),
    userAddressLine2: padToFixedLength(address.AddressLine2, 50),
    userCity: padToFixedLength(address.City, 25),
    userState: padToFixedLength(userState, 3),
    userZipCode: padToFixedLength(address.PostalCode, 11),
    userCountry: padToFixedLength(currentCountry, 3),
  });

  // Render items section (repeat for each item)
  const itemsTemplatePath = path.join(__mustacheDir, "items.mustache");
  const itemsTemplate = fs.readFileSync(itemsTemplatePath, "utf8");
  const itemsOutput = items
    .map((item) => {
      totalItemsQuantity += item.Quantity || 0;
      const randomNumber = generate10DigitNumber();
      return mustache.render(itemsTemplate, {
        orderIdNoSpace: padToFixedLength(orderIdNoSpace, 22),
        poaLineNumber: padToFixedLength(randomNumber, 22),
        EAN: padToFixedLength(item.SellerSKU || item.EAN, 20),
        itemPrice: padToFixedLength(
          padLeftZero(
            String(parseFloat(item?.totalItemPrice || 0).toFixed(2)),
            8
          ),
          17
        ),
        itemQuantity: padFixedZero(String(item?.Quantity) || "1", 7),
      });
    })
    .join("\n");

  // Render footer section
  const footerTemplatePath = path.join(__mustacheDir, "footer.mustache");
  const footerTemplate = fs.readFileSync(footerTemplatePath, "utf8");
  const totalrecords_ten_fifty = 12 + items.length * 2; // header+seller+shipping+footer + 2*items
  console.log("Total total records 10 to 50 Quantity:", totalrecords_ten_fifty);
  const footerOutput = mustache.render(footerTemplate, {
    orderIdNoSpace: padToFixedLength(orderIdNoSpace, 22),
    "1050totalRecords": padFixedZero(totalrecords_ten_fifty, 5),
    "40Records50record": padFixedZero(items.length, 10),
    "4041Records": padFixedZero(totalItemsQuantity, 13),
    "40Records": padFixedZero(items.length, 13),
    "10Records": padFixedZero(1, 5),
    "4041Records": padFixedZero(totalItemsQuantity, 10),
    "0Records": padFixedZero(1, 5),
    "1Records": padFixedZero(1, 5),
    "2Records": padFixedZero(5, 5),
    "3Records": padFixedZero(5, 5),
    "4Records": padFixedZero(items.length * 2, 5),
    "5Records": padFixedZero(1, 5),
    "6Records": padFixedZero(0, 5),
    "7Records": padFixedZero(0, 5),
    "89Records": padFixedZero(1, 5),
  });
  console.log("✅ Order Id: ", orderIdNoSpace);
  // Combine all sections and pad each line to 80 chars
  const allLines = (
    headerOutput +
    "\n" +
    sellerOutput +
    "\n" +
    shippingOutput +
    "\n" +
    itemsOutput +
    "\n" +
    footerOutput
  )
    .split(/\r?\n/)
    .map((line) => padToFixedLength(line, 80))
    .join("\n");
  const outputPath = path.join(__dirname, `${orderIdNoSpace}.fbo`);
  fs.writeFileSync(outputPath, allLines, "utf8");
  return outputPath;
};

export { generateFBOFile };

