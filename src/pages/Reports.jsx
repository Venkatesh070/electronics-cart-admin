import { useState } from "react";
import { Download } from "lucide-react";
import { PageHeader, Card, Select, Button, Table } from "../components/ui";
import { orders } from "../data/orders";
import { products } from "../data/products";
import { customers } from "../data/customers";

const REPORTS = {
  Sales: { columns: ["Order ID", "Customer", "Date", "Amount", "Status"], rows: orders.slice(0, 10).map(o => [o.id, o.customer, o.date, `₹${o.amount.toLocaleString("en-IN")}`, o.status]) },
  Inventory: { columns: ["SKU", "Product", "Stock", "Status"], rows: products.slice(0, 10).map(p => [p.sku, p.name, p.stock, p.status]) },
  Customer: { columns: ["Name", "City", "Orders", "Spend"], rows: customers.slice(0, 10).map(c => [c.name, c.city, c.orders, `₹${c.spend.toLocaleString("en-IN")}`]) },
  Tax: { columns: ["Region", "Category", "Rate", "Collected"], rows: [["Telangana", "Laptops", "18%", "₹4,82,300"], ["Karnataka", "Laptops", "18%", "₹2,10,900"], ["All India", "Accessories", "18%", "₹1,44,220"]] },
};

export default function Reports() {
  const [type, setType] = useState("Sales");
  const [range, setRange] = useState("Last 7 days");
  const report = REPORTS[type];

  return (
    <div>
      <PageHeader
        eyebrow="Insights" title="Reports"
        description="Generate sales, inventory, customer, and tax reports for any date range."
        action={<Button variant="secondary"><Download size={14} /> Export CSV</Button>}
      />
      <Card className="p-4 mb-4 flex items-center gap-2">
        <Select value={type} onChange={setType} options={Object.keys(REPORTS)} />
        <Select value={range} onChange={setRange} options={["Today", "Last 7 days", "Last 30 days", "This quarter", "Custom range"]} />
      </Card>
      <Card className="p-4">
        <Table
          columns={report.columns.map((c, i) => ({ key: String(i), label: c, render: (r) => r[i] }))}
          rows={report.rows}
        />
      </Card>
    </div>
  );
}
