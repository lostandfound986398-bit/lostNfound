import { BellRing, Megaphone, Plus, Send } from "lucide-react";
import { AdminPageHeader } from "@/components/admin-page";
import { authenticatedApi } from "@/lib/api/authenticated";
import { publishAnnouncement } from "@/app/actions/admin";

interface Announcement { id: string; title: string; body: string; audience: string | null; publishedAt: string | null }
async function getAnnouncements(): Promise<Announcement[]> { const response = await authenticatedApi("/admin/announcements"); return response?.ok ? await response.json() as Announcement[] : []; }

export default async function AnnouncementsPage() {
  const notices = await getAnnouncements();
  return <main className="page"><AdminPageHeader eyebrow="Communication" title="Notifications and announcements" description="Send concise system updates without exposing private user contact details." action={<button className="button button--primary"><Plus size={17} /> New announcement</button>} />
    <div className="notification-layout"><section className="panel table-panel"><div className="panel__head"><h2>Recent messages</h2></div><div className="notice-list">{notices.map((notice) => <article className="notice-row" key={notice.id}><span className="notice-icon"><BellRing size={18} /></span><span><b>{notice.title}</b><small>{notice.audience ?? "All verified users"}</small></span><span className="status status--matched">Sent</span><time>{notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString() : "Draft"}</time></article>)}</div></section><aside className="editor-panel"><div className="editor-panel__head"><span><small>Compose</small><strong>New announcement</strong></span><Megaphone size={20} /></div><form action={publishAnnouncement} className="stack-form"><label>Audience<select className="form-control" name="audience" defaultValue=""><option value="">All verified users</option><option value="STUDENT">Students</option><option value="FACULTY">Faculty</option><option value="STAFF">Staff</option></select></label><label>Subject<input className="form-control" name="title" placeholder="Short, specific subject" required /></label><label>Message<textarea className="form-control textarea textarea--large" name="body" placeholder="Write the announcement…" required /></label><button className="button button--primary button--full" type="submit"><Send size={16} /> Send announcement</button></form></aside></div>
  </main>;
}
