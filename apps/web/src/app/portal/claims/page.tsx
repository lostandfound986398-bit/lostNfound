import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface Claim { id: string; status: string; reviewNotes: string | null; createdAt: string; title: string }
async function getClaims(): Promise<Claim[]> { const supabase = await createClient(); const { data } = await supabase.auth.getSession(); if (!data.session?.access_token) return []; const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/claims/mine`, { headers: { authorization: `Bearer ${data.session.access_token}` }, cache: "no-store" }); return response.ok ? await response.json() as Claim[] : []; }

export default async function MyClaimsPage() {
  const claims = await getClaims();
  return <main className="portal-content portal-content--inner"><div className="portal-title"><div><span className="eyebrow">Ownership verification</span><h1>My claims</h1><p>See review decisions and safe pickup instructions.</p></div></div>
    <div className="claim-timeline">{claims.map((claim) => { const Icon = claim.status === "APPROVED" || claim.status === "RELEASED" ? CheckCircle2 : Clock3; return <article className="claim-card" key={claim.id}><span className="claim-card__icon"><Icon size={22} /></span><div><div className="claim-card__head"><h2>{claim.title}</h2><span className={`status ${claim.status === "APPROVED" || claim.status === "RELEASED" ? "status--matched" : "status--pending"}`}>{claim.status.replace("_", " ")}</span></div><p>{claim.reviewNotes || "The administrator is reviewing your ownership answers."}</p><small>{new Date(claim.createdAt).toLocaleDateString()}</small></div></article>; })}</div>
    <div className="info-box"><ShieldCheck size={20} /><span>Approval is not the same as release. Staff must inspect your school ID and record the handover before the item leaves custody.</span></div>
  </main>;
}
