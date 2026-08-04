import { get, post, put, del, uploadFile } from "./client";

export const uploadsApi = {
  image: (file, folder = "misc") => uploadFile(file, folder),
};

export const authApi = {
  login: (email, password) => post("/auth/login", { email, password }, { auth: false }),
  me: () => get("/auth/me"),
};

export const dashboardApi = {
  get: (params) => get("/admin/dashboard", params),
};

export const reportsApi = {
  get: (params) => get("/admin/reports", params),
};

export const analyticsApi = {
  get: (params) => get("/analytics", params),
};

export const productsApi = {
  list: (params) => get("/products", { status: "all", limit: 100, ...params }),
  get: (id) => get(`/products/${id}`),
  create: (body) => post("/products", body),
  update: (id, body) => put(`/products/${id}`, body),
  remove: (id) => del(`/products/${id}`),
  bulkStatus: (ids, status) => put("/products/bulk-status", { ids, status }),
  bulkDelete: (ids) => del("/products/bulk", { ids }),
  lowStock: () => get("/products/low-stock"),
};

export const categoriesApi = {
  list: (params) => get("/categories", params),
  tree: () => get("/categories", { tree: true }),
  get: (id) => get(`/categories/${id}`),
  create: (body) => post("/categories", body),
  update: (id, body) => put(`/categories/${id}`, body),
  reorder: (order) => put("/categories/reorder", { order }),
  remove: (id) => del(`/categories/${id}`),
};

export const brandsApi = {
  list: (params) => get("/brands", params),
  get: (id) => get(`/brands/${id}`),
  create: (body) => post("/brands", body),
  update: (id, body) => put(`/brands/${id}`, body),
  remove: (id) => del(`/brands/${id}`),
};

export const inventoryApi = {
  warehouses: () => get("/admin/inventory/warehouses"),
  createWarehouse: (body) => post("/admin/inventory/warehouses", body),
  lowStock: () => get("/admin/inventory/low-stock"),
  adjustments: (params) => get("/admin/inventory/adjustments", params),
  adjust: (body) => post("/admin/inventory/adjust", body),
  reorder: (productId) => post(`/admin/inventory/${productId}/reorder`),
};

export const ordersApi = {
  list: (params) => get("/orders/admin", params),
  get: (id) => get(`/orders/${id}`),
  updateStatus: (id, body) => put(`/orders/${id}/status`, body),
  invoice: (id) => get(`/orders/${id}/invoice`),
  tracking: (id) => get(`/orders/${id}/tracking`),
  shiprocket: (id, body) => post(`/orders/${id}/shiprocket`, body || {}),
  syncShiprocket: (id) => post(`/orders/${id}/shiprocket/sync`),
  shiprocketLabel: (id) => get(`/orders/${id}/shiprocket/label`),
  shiprocketInvoice: (id) => get(`/orders/${id}/shiprocket/invoice`),
};

export const returnsApi = {
  list: (params) => get("/returns/admin", params),
  updateStatus: (id, body) => put(`/returns/${id}/status`, body),
};

export const couponsApi = {
  list: () => get("/coupons"),
  create: (body) => post("/coupons", body),
  update: (id, body) => put(`/coupons/${id}`, body),
  remove: (id) => del(`/coupons/${id}`),
};

export const giftCardsApi = {
  list: () => get("/gift-cards"),
  issue: (body) => post("/gift-cards", body),
  void: (id) => put(`/gift-cards/${id}/void`),
  denominations: () => get("/gift-cards/denominations"),
  createDenomination: (body) => post("/gift-cards/denominations", body),
  removeDenomination: (id) => del(`/gift-cards/denominations/${id}`),
};

export const flashSalesApi = {
  list: () => get("/flash-sales/admin"),
  get: (id) => get(`/flash-sales/${id}`),
  create: (body) => post("/flash-sales", body),
  update: (id, body) => put(`/flash-sales/${id}`, body),
  remove: (id) => del(`/flash-sales/${id}`),
  performance: (id) => get(`/flash-sales/${id}/performance`),
};

export const customersApi = {
  list: (params) => get("/admin/customers", params),
  get: (id) => get(`/admin/customers/${id}`),
  block: (id, isBlocked) => put(`/admin/customers/${id}/block`, { isBlocked }),
  addNote: (id, text) => post(`/admin/customers/${id}/notes`, { text }),
};

export const reviewsApi = {
  list: (params) => get("/reviews", params),
  moderate: (id, status) => put(`/reviews/${id}/moderate`, { status }),
};

export const bannersApi = {
  list: () => get("/banners/admin"),
  create: (body) => post("/banners", body),
  update: (id, body) => put(`/banners/${id}`, body),
  remove: (id) => del(`/banners/${id}`),
};

export const campaignsApi = {
  list: () => get("/admin/campaigns"),
  get: (id) => get(`/admin/campaigns/${id}`),
  create: (body) => post("/admin/campaigns", body),
  update: (id, body) => put(`/admin/campaigns/${id}`, body),
  remove: (id) => del(`/admin/campaigns/${id}`),
  send: (id) => post(`/admin/campaigns/${id}/send`),
};

export const pagesApi = {
  list: () => get("/pages/admin"),
  create: (body) => post("/pages", body),
  update: (id, body) => put(`/pages/${id}`, body),
  remove: (id) => del(`/pages/${id}`),
};

export const homepageBlocksApi = {
  list: () => get("/homepage-blocks/admin"),
  create: (body) => post("/homepage-blocks", body),
  update: (id, body) => put(`/homepage-blocks/${id}`, body),
  remove: (id) => del(`/homepage-blocks/${id}`),
};

export const blogApi = {
  list: () => get("/blog/admin"),
  create: (body) => post("/blog", body),
  update: (id, body) => put(`/blog/${id}`, body),
  remove: (id) => del(`/blog/${id}`),
};

export const taxesApi = {
  list: () => get("/admin/taxes"),
  create: (body) => post("/admin/taxes", body),
  update: (id, body) => put(`/admin/taxes/${id}`, body),
  remove: (id) => del(`/admin/taxes/${id}`),
};

export const shippingApi = {
  list: () => get("/admin/shipping"),
  create: (body) => post("/admin/shipping", body),
  update: (id, body) => put(`/admin/shipping/${id}`, body),
  remove: (id) => del(`/admin/shipping/${id}`),
};

export const paymentSettingsApi = {
  list: () => get("/admin/payment-settings"),
  upsert: (body) => put("/admin/payment-settings", body),
};

export const rolesApi = {
  list: () => get("/admin/roles"),
  create: (body) => post("/admin/roles", body),
  update: (id, body) => put(`/admin/roles/${id}`, body),
  remove: (id) => del(`/admin/roles/${id}`),
};

export const staffApi = {
  list: () => get("/admin/staff"),
  create: (body) => post("/admin/staff", body),
  assignRole: (id, body) => put(`/admin/staff/${id}/role`, body),
};

export const settingsApi = {
  get: () => get("/admin/settings"),
  update: (body) => put("/admin/settings", body),
  public: () => get("/settings", undefined, { auth: false }),
};

export const auditLogsApi = {
  list: (params) => get("/admin/audit-logs", params),
};

export const apiKeysApi = {
  list: () => get("/admin/api-keys"),
  create: (body) => post("/admin/api-keys", body),
  revoke: (id) => del(`/admin/api-keys/${id}`),
};

export const webhooksApi = {
  list: () => get("/admin/webhooks"),
  create: (body) => post("/admin/webhooks", body),
  update: (id, body) => put(`/admin/webhooks/${id}`, body),
  remove: (id) => del(`/admin/webhooks/${id}`),
};

export const notificationsApi = {
  list: () => get("/notifications"),
  markRead: (id) => put(`/notifications/${id}/read`),
  markAllRead: () => put("/notifications/read-all"),
};

export const ticketsApi = {
  list: (params) => get("/tickets/admin", params),
};
