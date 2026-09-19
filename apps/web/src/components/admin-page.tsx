export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  );
}

export function FilterBar({ children }: { children?: React.ReactNode }) {
  return (
    <div className="filter-bar">
      <label className="filter-search"><span aria-hidden="true">⌕</span><input placeholder="Search by item, person, ID, or location…" /></label>
      {children}
    </div>
  );
}

