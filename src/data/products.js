const models = [
  { name: "Dell XPS 13 Plus", brand: "Dell", cat: "Ultrabooks", base: 118990 },
  { name: "Dell Inspiron 15", brand: "Dell", cat: "Business Laptops", base: 54990 },
  { name: "Dell Alienware m16", brand: "Dell", cat: "Gaming Laptops", base: 189990 },
  { name: "Dell Latitude 7440", brand: "Dell", cat: "Business Laptops", base: 132990 },
  { name: "HP Spectre x360 14", brand: "HP", cat: "2-in-1 Convertibles", base: 142990 },
  { name: "HP Pavilion 15", brand: "HP", cat: "Budget Laptops", base: 48990 },
  { name: "HP Omen 16", brand: "HP", cat: "Gaming Laptops", base: 134990 },
  { name: "HP EliteBook 840", brand: "HP", cat: "Business Laptops", base: 128990 },
  { name: "Lenovo ThinkPad X1 Carbon", brand: "Lenovo", cat: "Ultrabooks", base: 156990 },
  { name: "Lenovo Legion 5 Pro", brand: "Lenovo", cat: "Gaming Laptops", base: 149990 },
  { name: "Lenovo IdeaPad Slim 5", brand: "Lenovo", cat: "Budget Laptops", base: 52990 },
  { name: "Lenovo Yoga 9i", brand: "Lenovo", cat: "2-in-1 Convertibles", base: 138990 },
  { name: "Apple MacBook Air 13 M3", brand: "Apple", cat: "Ultrabooks", base: 114900 },
  { name: "Apple MacBook Pro 14 M3 Pro", brand: "Apple", cat: "Ultrabooks", base: 199900 },
  { name: "Asus ROG Zephyrus G14", brand: "Asus", cat: "Gaming Laptops", base: 159990 },
  { name: "Asus Zenbook 14 OLED", brand: "Asus", cat: "Ultrabooks", base: 89990 },
  { name: "Asus Vivobook 15", brand: "Asus", cat: "Budget Laptops", base: 42990 },
  { name: "Acer Predator Helios Neo 16", brand: "Acer", cat: "Gaming Laptops", base: 144990 },
  { name: "Acer Swift Go 14", brand: "Acer", cat: "Ultrabooks", base: 69990 },
  { name: "Acer Aspire Lite", brand: "Acer", cat: "Budget Laptops", base: 36990 },
  { name: "MSI Stealth 16", brand: "MSI", cat: "Gaming Laptops", base: 174990 },
  { name: "MSI Prestige 13 Evo", brand: "MSI", cat: "Ultrabooks", base: 94990 },
  { name: "Samsung Galaxy Book4 Pro", brand: "Samsung", cat: "Ultrabooks", base: 129990 },
  { name: "Samsung Galaxy Book4 360", brand: "Samsung", cat: "2-in-1 Convertibles", base: 104990 },
];

const conditions = ["New", "New", "New", "Refurbished"];
const statuses = ["Published", "Published", "Published", "Draft", "Archived"];

function seedRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const products = models.map((m, i) => {
  const r1 = seedRand(i + 1);
  const r2 = seedRand(i + 51);
  const r3 = seedRand(i + 101);
  const discount = Math.round((5 + r1 * 20));
  const stock = Math.round(r2 * 60);
  const rating = (3.6 + r3 * 1.3).toFixed(1);
  const status = statuses[Math.floor(seedRand(i + 200) * statuses.length)];
  return {
    id: `p${i + 1}`,
    sku: `EC-${m.brand.slice(0, 2).toUpperCase()}-${1000 + i}`,
    name: m.name,
    brand: m.brand,
    category: m.cat,
    price: m.base,
    discount,
    finalPrice: Math.round(m.base * (1 - discount / 100)),
    stock,
    condition: conditions[Math.floor(seedRand(i + 300) * conditions.length)],
    status: stock === 0 ? "Out of Stock" : status,
    rating: Number(rating),
    reviewCount: Math.round(8 + r1 * 240),
    ram: ["8GB", "16GB", "32GB"][Math.floor(r2 * 3)],
    storage: ["256GB SSD", "512GB SSD", "1TB SSD"][Math.floor(r3 * 3)],
    screen: ["13.3\"", "14\"", "15.6\"", "16\""][Math.floor(r1 * 4)],
    updatedAt: `2026-0${1 + Math.floor(r2 * 7)}-${10 + Math.floor(r3 * 18)}`,
  };
});
