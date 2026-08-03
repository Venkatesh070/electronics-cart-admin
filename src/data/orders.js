import { products } from "./products";
import { customers } from "./customers";

const statuses = ["Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
const payMethods = ["UPI", "Card", "Net Banking", "COD", "EMI"];

function seedRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const orders = Array.from({ length: 42 }).map((_, i) => {
  const cust = customers[i % customers.length];
  const prod = products[Math.floor(seedRand(i + 500) * products.length)];
  const qty = 1 + Math.floor(seedRand(i + 600) * 2);
  const status = statuses[Math.floor(seedRand(i + 700) * statuses.length)];
  const amount = prod.finalPrice * qty;
  return {
    id: `ORD-${20260000 + i * 7}`,
    customerId: cust.id,
    customer: cust.name,
    city: cust.city,
    items: [{ productId: prod.id, name: prod.name, qty, price: prod.finalPrice }],
    amount,
    status,
    payment: payMethods[Math.floor(seedRand(i + 800) * payMethods.length)],
    date: `2026-0${1 + Math.floor(seedRand(i + 900) * 7)}-${10 + (i % 18)}`,
  };
});
