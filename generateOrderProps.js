import { MongoClient, ObjectId } from "mongodb";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:Paysfer1234%23%21@paysfer.fy8bm.mongodb.net/paysfer?retryWrites=true&w=majority&appName=Paysfer";
const client = new MongoClient(uri);

export async function getOrderProps(orderId) {
  await client.connect();
  const db = client.db();

  // Fetch order
  const order = await db
    .collection("orders")
    .findOne({ ID: orderId});
  if (!order) throw new Error("Order not found");

  // Fetch user
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(order.UserID) });
  if (!user) throw new Error("User not found");

  // Fetch address
  const address = await db
    .collection("addresses")
    .findOne({ _id: new ObjectId(order.ShippingAddress) });
  if (!address) throw new Error("Address not found");

  return { user, address, order };
}