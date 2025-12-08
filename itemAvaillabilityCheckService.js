// Remove items available in Paysfer warehouse from order object
async function removePaysferWarehouseItemsFromOrder(order) {
    if (!order || !Array.isArray(order.Items)) return { order, needToOrderOnCDF: false };
    const filteredItems = [];
    for (const item of order.Items) {
        const isAvailable = await isPaysferWarehouseStockAvailable(item.SellerSKU, item.Quantity || 1);
        if (!isAvailable) {
            filteredItems.push(item);
        }
    }
    const needToOrderOnCDF = filteredItems.length > 0;
    console.log(`Items after removing Paysfer Warehouse items:`, filteredItems,needToOrderOnCDF);
    return { order: { ...order, Items: filteredItems }, needToOrderOnCDF };
}

export { removePaysferWarehouseItemsFromOrder };
// Check if Paysfer warehouse has enough stock for a SellerSKU and required quantity

import { MongoClient, ObjectId } from 'mongodb';

const uri = 'mongodb+srv://admin:Paysfer1234%23%21@paysfer.fy8bm.mongodb.net/paysfer?retryWrites=true&w=majority&appName=Paysfer'; // Update with your MongoDB URI
const dbName = 'paysfer'; // Update with your DB name

async function findOrderById(orderId) {
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db(dbName);
        const orders = db.collection('orders');
        const order = await orders.findOne({ ID: orderId });
        return order;
    } finally {
        await client.close();
    }
}

async function isPaysferWarehouseStockAvailable(sellerSKU, requiredQty) {
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db(dbName);
        const products = db.collection('buyableproducts');
        const product = await products.findOne({ SellerSKU: sellerSKU });
        if (
            product &&
            product.bookMeta &&
            product.bookMeta.stock &&
            product.bookMeta.stock.isItAvailableAtPaysferWareHouse === true
        ) {
            const warehouseQty = product.bookMeta.stock.quantityAtPaysferWareHouse || 0;
            if (warehouseQty >= requiredQty) {
                return true;
            }
        }
        return false;
    } finally {
        await client.close();
    }
}

export { isPaysferWarehouseStockAvailable };