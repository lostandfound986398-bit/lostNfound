import { FileUp, ShieldCheck } from "lucide-react";
import { AdminPageHeader, FilterBar } from "@/components/admin-page";
import { authenticatedApi } from "@/lib/api/authenticated";

interface MasterPerson {
  id: string;
  schoolId: string;
  fullName: string;
  email: string | null;
  role: string;
  course: string | null;
  yearLevel: string | null;
  section: string | null;
  position: string | null;
  department: string | null;
  isActive: boolean;
  accountStatus: string | null;
}

async function getMasterList(): Promise<MasterPerson[]> {
  const response = await authenticatedApi("/admin/master-list");
  return response?.ok ? ((await response.json()) as MasterPerson[]) : [];
}

export default async function MasterListPage() {
  const people = await getMasterList();

  return (
    <main className="page">
      <AdminPageHeader
        eyebrow="Authorized identities"
        title="CBEA master list"
        description="Only active people in this private registry can create an account."
        action={
          <button className="button button--primary">
            <FileUp size={17} /> Master list verified
          </button>
        }
      />
      <div className="info-box">
        <ShieldCheck size={20} />
        <span>The master list never stores passwords. Imports update authorization data while preserving linked account history.</span>
      </div>

      <section className="panel table-panel">
        <FilterBar>
          <span>{people.length} master list records</span>
        </FilterBar>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>School ID</th>
                <th>Full name</th>
                <th>Role</th>
                <th>Course / Department</th>
                <th>Status</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => {
                const group = person.role === "STUDENT"
                  ? `${person.course || ""} ${person.yearLevel || ""}${person.section || ""}`.trim()
                  : `${person.position || ""} · ${person.department || ""}`.trim();
                const regStatus = person.accountStatus ? "Registered" : person.isActive ? "Available" : "Deactivated";

                return (
                  <tr key={person.id}>
                    <td><b>{person.schoolId}</b></td>
                    <td>{person.fullName}</td>
                    <td>{person.role}</td>
                    <td>{group || "—"}</td>
                    <td>
                      <span className={`status ${person.isActive ? "status--matched" : "status--pending"}`}>
                        {person.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${regStatus === "Registered" ? "status--matched" : "status--open"}`}>
                        {regStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
