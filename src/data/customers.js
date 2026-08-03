const first = ["Rahul", "Priya", "Arjun", "Sneha", "Vikram", "Ananya", "Karthik", "Divya", "Rohit", "Meera", "Suresh", "Pooja", "Naveen", "Kavya", "Manoj", "Swathi", "Ravi", "Lakshmi", "Aditya", "Nisha"];
const last = ["Sharma", "Reddy", "Rao", "Iyer", "Nair", "Gupta", "Patel", "Kumar", "Menon", "Verma", "Chowdary", "Pillai"];
const cities = ["Hyderabad", "Bengaluru", "Chennai", "Pune", "Mumbai", "Vijayawada", "Warangal", "Delhi"];

function seedRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const customers = Array.from({ length: 26 }).map((_, i) => {
  const fn = first[i % first.length];
  const ln = last[Math.floor(seedRand(i + 5) * last.length)];
  const r = seedRand(i + 40);
  const orders = Math.round(1 + r * 22);
  const spend = Math.round(orders * (8000 + r * 40000));
  return {
    id: `cu${i + 1}`,
    name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
    phone: `9${Math.floor(100000000 + seedRand(i + 90) * 800000000)}`,
    city: cities[i % cities.length],
    orders,
    spend,
    segment: spend > 150000 ? "VIP" : spend > 60000 ? "Regular" : "New",
    status: seedRand(i + 70) > 0.92 ? "Blocked" : "Active",
    joined: `202${4 + Math.floor(seedRand(i + 12) * 2)}-0${1 + Math.floor(seedRand(i + 13) * 8)}-1${i % 9}`,
  };
});
