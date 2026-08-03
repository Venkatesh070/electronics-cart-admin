export const categories = [
  {
    id: "c1", name: "Laptops", productCount: 96, image: "laptop", parent: null,
    children: [
      { id: "c1-1", name: "Ultrabooks", productCount: 28, parent: "c1" },
      { id: "c1-2", name: "Gaming Laptops", productCount: 24, parent: "c1" },
      { id: "c1-3", name: "Business Laptops", productCount: 21, parent: "c1" },
      { id: "c1-4", name: "2-in-1 Convertibles", productCount: 13, parent: "c1" },
      { id: "c1-5", name: "Budget Laptops", productCount: 10, parent: "c1" },
    ],
  },
  {
    id: "c2", name: "Desktops", productCount: 34, image: "desktop", parent: null,
    children: [
      { id: "c2-1", name: "All-in-One PCs", productCount: 12, parent: "c2" },
      { id: "c2-2", name: "Gaming Towers", productCount: 14, parent: "c2" },
      { id: "c2-3", name: "Mini PCs", productCount: 8, parent: "c2" },
    ],
  },
  {
    id: "c3", name: "Monitors", productCount: 41, image: "monitor", parent: null,
    children: [
      { id: "c3-1", name: "Gaming Monitors", productCount: 18, parent: "c3" },
      { id: "c3-2", name: "4K / Professional", productCount: 15, parent: "c3" },
      { id: "c3-3", name: "Portable Monitors", productCount: 8, parent: "c3" },
    ],
  },
  {
    id: "c4", name: "Storage", productCount: 52, image: "storage", parent: null,
    children: [
      { id: "c4-1", name: "SSDs", productCount: 26, parent: "c4" },
      { id: "c4-2", name: "External HDDs", productCount: 16, parent: "c4" },
      { id: "c4-3", name: "Memory Cards", productCount: 10, parent: "c4" },
    ],
  },
  {
    id: "c5", name: "Accessories", productCount: 78, image: "accessory", parent: null,
    children: [
      { id: "c5-1", name: "Keyboards & Mice", productCount: 24, parent: "c5" },
      { id: "c5-2", name: "Bags & Sleeves", productCount: 18, parent: "c5" },
      { id: "c5-3", name: "Docking Stations", productCount: 11, parent: "c5" },
      { id: "c5-4", name: "Chargers & Cables", productCount: 25, parent: "c5" },
    ],
  },
  {
    id: "c6", name: "Networking", productCount: 23, image: "network", parent: null,
    children: [
      { id: "c6-1", name: "Routers", productCount: 12, parent: "c6" },
      { id: "c6-2", name: "Wi-Fi Extenders", productCount: 6, parent: "c6" },
      { id: "c6-3", name: "USB Adapters", productCount: 5, parent: "c6" },
    ],
  },
];
