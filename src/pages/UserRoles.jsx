import { useState } from "react";
import { Plus, ShieldCheck, UserPlus } from "lucide-react";
import { rolesApi, staffApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { idOf, nameOf, titleCase } from "../utils/format";
import { PageHeader, Card, Button, Table, Badge, Modal, Field, inputCls, LoadingState, ErrorState, Tabs } from "../components/ui";

const staffRoles = ["support", "manager", "admin", "superadmin"];
const blankStaff = { name: "", email: "", password: "", role: "support", adminRole: "" };

export default function UserRoles() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [staff, roles] = await Promise.all([staffApi.list(), rolesApi.list()]);
    return { staff: staff.data || [], roles: roles.data || [] };
  }, []);
  const [tab, setTab] = useState("Staff");
  const [staffOpen, setStaffOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [staffForm, setStaffForm] = useState(blankStaff);
  const [roleForm, setRoleForm] = useState({ name: "", modules: "" });
  const [saving, setSaving] = useState(false);

  async function createStaff(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await staffApi.create({ ...staffForm, adminRole: staffForm.adminRole || undefined });
      setStaffOpen(false);
      setStaffForm(blankStaff);
      await reload();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function assignRole(member, value) {
    const [role, adminRole = ""] = value.split(":");
    try {
      await staffApi.assignRole(idOf(member), { role, adminRole: adminRole || null });
      await reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function createRole(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const permissions = roleForm.modules.split(",").map((module) => module.trim()).filter(Boolean).map((module) => ({ module, view: true, edit: false, delete: false }));
      await rolesApi.create({ name: roleForm.name.trim(), permissions });
      setRoleOpen(false);
      setRoleForm({ name: "", modules: "" });
      await reload();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading staff and roles…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const staff = data?.staff || [];
  const roles = data?.roles || [];
  const modules = [...new Set(roles.flatMap((role) => (role.permissions || []).map((permission) => permission.module)))].sort();

  return (
    <div>
      <PageHeader eyebrow="Access control" title="User roles" description="Invite staff, assign access roles and review the permission matrix." action={<div className="flex gap-2">{tab === "Roles" && <Button variant="secondary" onClick={() => setRoleOpen(true)}><ShieldCheck size={14} /> Create role</Button>}<Button onClick={() => setStaffOpen(true)}><UserPlus size={14} /> Invite staff</Button></div>} />
      <Tabs tabs={["Staff", "Roles"]} active={tab} onChange={setTab} />
      {tab === "Staff" ? (
        <Card className="p-4">
          <Table rows={staff} columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "role", label: "Account role", render: (r) => <Badge tone="primary">{titleCase(r.role)}</Badge> },
            { key: "adminRole", label: "Admin role", render: (r) => nameOf(r.adminRole) },
            { key: "assign", label: "Assign", render: (r) => <select className="text-xs border border-border rounded-md px-2 py-1.5" value={`${r.role}:${idOf(r.adminRole)}`} onChange={(e) => assignRole(r, e.target.value)}>{staffRoles.map((role) => <optgroup key={role} label={titleCase(role)}><option value={`${role}:`}>{titleCase(role)} — no custom role</option>{roles.map((adminRole) => <option key={idOf(adminRole)} value={`${role}:${idOf(adminRole)}`}>{titleCase(role)} — {adminRole.name}</option>)}</optgroup>)}</select> },
          ]} />
        </Card>
      ) : (
        <Card className="p-4 overflow-x-auto">
          {!roles.length ? <div className="py-12 text-center text-sm text-muted">No custom roles configured.</div> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border"><th className="text-left px-3 py-2 text-xs text-muted uppercase">Module</th>{roles.map((role) => <th key={idOf(role)} className="text-left px-3 py-2 text-xs text-muted uppercase">{role.name}<div className="normal-case font-normal">View · Edit · Delete</div></th>)}</tr></thead>
              <tbody>{modules.map((module) => <tr key={module} className="border-b border-border last:border-0"><td className="px-3 py-3 font-medium">{titleCase(module)}</td>{roles.map((role) => { const permission = (role.permissions || []).find((item) => item.module === module); return <td key={idOf(role)} className="px-3 py-3"><span className="font-mono text-xs">{["view", "edit", "delete"].map((key) => permission?.[key] ? "✓" : "—").join("   ")}</span></td>; })}</tr>)}</tbody>
            </table>
          )}
        </Card>
      )}
      <Modal open={staffOpen} onClose={() => setStaffOpen(false)} title="Invite staff member">
        <form onSubmit={createStaff}>
          <Field label="Name"><input required className={inputCls} value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} /></Field>
          <Field label="Email"><input required type="email" className={inputCls} value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} /></Field>
          <Field label="Temporary password"><input required minLength="8" type="password" className={inputCls} value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} /></Field>
          <Field label="Account role"><select className={inputCls} value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>{staffRoles.map((role) => <option key={role} value={role}>{titleCase(role)}</option>)}</select></Field>
          <Field label="Custom admin role (optional)"><select className={inputCls} value={staffForm.adminRole} onChange={(e) => setStaffForm({ ...staffForm, adminRole: e.target.value })}><option value="">None</option>{roles.map((role) => <option key={idOf(role)} value={idOf(role)}>{role.name}</option>)}</select></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setStaffOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create staff"}</Button></div>
        </form>
      </Modal>
      <Modal open={roleOpen} onClose={() => setRoleOpen(false)} title="Create role">
        <form onSubmit={createRole}>
          <Field label="Role name"><input required className={inputCls} value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} /></Field>
          <Field label="Viewable modules (comma-separated)"><input className={inputCls} value={roleForm.modules} onChange={(e) => setRoleForm({ ...roleForm, modules: e.target.value })} placeholder="dashboard, products, orders" /></Field>
          <p className="text-xs text-muted mb-5">New module permissions start with view access only and can be refined through the API.</p>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setRoleOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}><Plus size={14} /> Create role</Button></div>
        </form>
      </Modal>
    </div>
  );
}
