import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { PageHeader, Card, Table, Badge, Button, Modal, Field, inputCls, Tabs } from "../components/ui";
import { adminUsers as seed } from "../data/misc";

const MODULES = ["Products", "Orders", "Customers", "Coupons", "Reports", "System Settings"];
const ROLES = ["Super Admin", "Manager", "Catalog Manager", "Support"];

const permMatrix = {
  "Super Admin": MODULES.reduce((a, m) => ({ ...a, [m]: { view: true, edit: true, delete: true } }), {}),
  "Manager": MODULES.reduce((a, m) => ({ ...a, [m]: { view: true, edit: true, delete: m !== "System Settings" } }), {}),
  "Catalog Manager": MODULES.reduce((a, m) => ({ ...a, [m]: { view: true, edit: ["Products", "Coupons"].includes(m), delete: false } }), {}),
  "Support": MODULES.reduce((a, m) => ({ ...a, [m]: { view: true, edit: m === "Orders", delete: false } }), {}),
};

export default function UserRoles() {
  const [users, setUsers] = useState(seed);
  const [tab, setTab] = useState("Admin users");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Support" });

  function invite() {
    setUsers([{ id: `U${Date.now()}`, ...form, status: "Invited", lastActive: "—" }, ...users]);
    setModal(false); setForm({ name: "", email: "", role: "Support" });
  }

  return (
    <div>
      <PageHeader
        eyebrow="System" title="User Roles"
        description="Manage admin users, role assignment, and the permission matrix."
        action={tab === "Admin users" && <Button variant="primary" onClick={() => setModal(true)}><Plus size={14} /> Invite admin</Button>}
      />
      <Tabs tabs={["Admin users", "Permission matrix"]} active={tab} onChange={setTab} />

      {tab === "Admin users" ? (
        <Card className="p-4">
          <Table
            columns={[
              { key: "name", label: "Name", render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted">{r.email}</div></div> },
              { key: "role", label: "Role", render: (r) => <Badge tone="primary">{r.role}</Badge> },
              { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "Active" ? "success" : r.status === "Invited" ? "amber" : "danger"}>{r.status}</Badge> },
              { key: "lastActive", label: "Last active", render: (r) => <span className="font-mono text-xs text-muted">{r.lastActive}</span> },
            ]}
            rows={users}
          />
        </Card>
      ) : (
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted uppercase px-3 py-2">Module</th>
                {ROLES.map((r) => <th key={r} className="text-center text-xs text-muted uppercase px-3 py-2">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 font-medium">{m}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-2.5 text-center">
                      <div className="flex justify-center gap-1.5 text-[10px] text-muted">
                        {["view", "edit", "delete"].map((p) => (
                          <span key={p} className={`px-1.5 py-0.5 rounded ${permMatrix[r][m][p] ? "bg-success-light text-success" : "bg-gray-100 text-gray-400"}`}>
                            {permMatrix[r][m][p] ? <Check size={10} /> : "—"}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Invite admin user">
        <Field label="Full name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Role">
          <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={invite} disabled={!form.name.trim() || !form.email.trim()}>Send invite</Button>
        </div>
      </Modal>
    </div>
  );
}
