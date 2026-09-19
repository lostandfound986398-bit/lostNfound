import { Database, MapPin, Plus, Save, SlidersHorizontal, Tags } from "lucide-react";
import { AdminPageHeader } from "@/components/admin-page";
import { authenticatedApi } from "@/lib/api/authenticated";
import { createCategoryAction, createLocationAction, toggleCategoryAction, toggleLocationAction } from "@/app/actions/admin";

interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

interface LocationItem {
  id: string;
  name: string;
  isActive: boolean;
}

async function getCategories(): Promise<Category[]> {
  const response = await authenticatedApi("/admin/categories");
  return response?.ok ? ((await response.json()) as Category[]) : [];
}

async function getLocations(): Promise<LocationItem[]> {
  const response = await authenticatedApi("/admin/locations");
  return response?.ok ? ((await response.json()) as LocationItem[]) : [];
}

export default async function SettingsPage() {
  const categories = await getCategories();
  const locations = await getLocations();

  return (
    <main className="page">
      <AdminPageHeader
        eyebrow="Administration"
        title="System settings"
        description="Maintain categories, campus locations, matching rules, and administration configuration."
        action={
          <button className="button button--primary">
            <Save size={17} /> Save settings
          </button>
        }
      />

      <div className="settings-grid" style={{ gridTemplateColumns: "1fr 2fr", gap: "1.5rem" }}>
        {/* Categories Panel */}
        <section className="panel" style={{ padding: "1.5rem" }}>
          <div className="panel__head" style={{ marginBottom: "1rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Tags size={20} /> Item categories
            </h2>
          </div>

          <form action={createCategoryAction} className="two-fields" style={{ marginBottom: "1rem" }}>
            <input className="form-control" name="name" placeholder="New category name" required />
            <button className="button button--primary" type="submit" style={{ whiteSpace: "nowrap" }}>
              <Plus size={16} /> Add
            </button>
          </form>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td><b>{cat.name}</b></td>
                    <td>
                      <span className={`status ${cat.isActive ? "status--matched" : "status--pending"}`}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <form action={toggleCategoryAction}>
                        <input name="id" type="hidden" value={cat.id} />
                        <input name="active" type="hidden" value={cat.isActive ? "false" : "true"} />
                        <button className="button button--secondary button--sm" type="submit">
                          {cat.isActive ? "Disable" : "Enable"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Locations Panel */}
        <section className="panel" style={{ padding: "1.5rem" }}>
          <div className="panel__head" style={{ marginBottom: "1rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={20} /> Campus locations
            </h2>
          </div>

          <form action={createLocationAction} className="two-fields" style={{ marginBottom: "1rem" }}>
            <input className="form-control" name="name" placeholder="New campus location" required />
            <button className="button button--primary" type="submit" style={{ whiteSpace: "nowrap" }}>
              <Plus size={16} /> Add
            </button>
          </form>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id}>
                    <td><b>{loc.name}</b></td>
                    <td>
                      <span className={`status ${loc.isActive ? "status--matched" : "status--pending"}`}>
                        {loc.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <form action={toggleLocationAction}>
                        <input name="id" type="hidden" value={loc.id} />
                        <input name="active" type="hidden" value={loc.isActive ? "false" : "true"} />
                        <button className="button button--secondary button--sm" type="submit">
                          {loc.isActive ? "Disable" : "Enable"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
