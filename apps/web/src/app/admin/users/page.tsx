import { Ban, MoreHorizontal, Plus, UserCheck } from "lucide-react";
import { AdminPageHeader, FilterBar } from "@/components/admin-page";
import { authenticatedApi } from "@/lib/api/authenticated";
import { changeUserStatus } from "@/app/actions/admin";

interface User { id: string; displayName: string; email: string; role: string; status: string; schoolId: string; group: string }
async function getUsers(): Promise<User[]> { const response = await authenticatedApi("/admin/users"); return response?.ok ? await response.json() as User[] : []; }
export default async function UsersPage() {
  const users = await getUsers();
  return <main className="page"><AdminPageHeader eyebrow="Administration" title="Registered users" description="Monitor verified community accounts and control access without deleting historical records." action={<button className="button button--primary"><Plus size={17} /> Import master list</button>} />
    <section className="panel table-panel"><FilterBar><select className="compact-select"><option>All roles</option><option>Student</option><option>Faculty</option><option>Staff</option></select><select className="compact-select"><option>All statuses</option><option>Active</option><option>Inactive</option></select></FilterBar><div className="table-scroll"><table className="data-table"><thead><tr><th>User</th><th>School ID</th><th>Role</th><th>Course / Department</th><th>Status</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><span className="person-cell"><span className="avatar avatar--soft">{user.displayName.split(" ").map(part => part[0]).join("")}</span><span><b>{user.displayName}</b><small>{user.email}</small></span></span></td><td>{user.schoolId}</td><td>{user.role}</td><td>{user.group}</td><td><span className={`status ${user.status === "ACTIVE" ? "status--matched" : "status--pending"}`}>{user.status}</span></td><td><div className="row-actions"><form action={changeUserStatus}><input name="id" type="hidden" value={user.id} /><input name="active" type="hidden" value={user.status === "ACTIVE" ? "false" : "true"} /><button title={user.status === "ACTIVE" ? "Deactivate" : "Activate"}>{user.status === "ACTIVE" ? <Ban size={15} /> : <UserCheck size={15} />}</button></form><button title="More options"><MoreHorizontal size={15} /></button></div></td></tr>)}</tbody></table></div></section>
  </main>;
}
