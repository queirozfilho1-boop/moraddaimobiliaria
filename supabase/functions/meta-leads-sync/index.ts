// Sincroniza leads dos formulários de Lead Ads da Meta (Facebook/Instagram)
// para a tabela leads. Agendada via pg_cron (a cada 10 min).
// Deduplicação por meta_lead_id (índice único).
import { createClient } from "npm:@supabase/supabase-js@2";

const GRAPH = "https://graph.facebook.com/v21.0";

async function g(path: string, params: Record<string, string>): Promise<any> {
  const u = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u);
  return r.json();
}

function campo(fd: any[], ...nomes: string[]): string | null {
  for (const f of fd || []) {
    const n = (f.name || "").toLowerCase();
    if (nomes.some((x) => n.includes(x))) return f.values?.[0] ?? null;
  }
  return null;
}

Deno.serve(async (_req) => {
  const META = Deno.env.get("META_LEADS_TOKEN");
  if (!META) return new Response("META_LEADS_TOKEN ausente", { status: 500 });
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ids já importados
  const existentes = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb
      .from("leads")
      .select("meta_lead_id")
      .not("meta_lead_id", "is", null)
      .range(from, from + 999);
    for (const r of data || []) existentes.add(r.meta_lead_id);
    if (!data || data.length < 1000) break;
  }

  const pages = await g("me/accounts", {
    access_token: META,
    fields: "id,name,access_token",
  });

  let novos = 0;
  const erros: string[] = [];
  for (const pg of pages.data ?? []) {
    const forms = await g(`${pg.id}/leadgen_forms`, {
      access_token: pg.access_token,
      fields: "id,name",
      limit: "50",
    });
    for (const form of forms.data ?? []) {
      let after: string | undefined;
      while (true) {
        const params: Record<string, string> = {
          access_token: pg.access_token,
          fields: "id,created_time,field_data,ad_name,campaign_name,adset_name",
          limit: "100",
        };
        if (after) params.after = after;
        const page = await g(`${form.id}/leads`, params);
        if (page.error) {
          erros.push(`${form.name}: ${page.error.message}`);
          break;
        }
        for (const ld of page.data ?? []) {
          if (existentes.has(ld.id)) continue;
          const fd = ld.field_data || [];
          const nome = campo(fd, "full_name", "first_name", "nome") || "Lead Facebook";
          let tel = (campo(fd, "phone") || "").replace(/\D/g, "");
          if (tel.startsWith("55") && tel.length > 11) tel = tel.slice(2);
          const email = campo(fd, "email");
          const va = (campo(fd, "vender_ou_alugar") || "").toLowerCase();
          const tipo = va.includes("vend")
            ? "vender"
            : va.includes("alug")
              ? "alugar_meu_imovel"
              : null;
          const extras = fd
            .filter(
              (f: any) =>
                !["phone", "first_name", "full_name", "email"].some((x) =>
                  (f.name || "").toLowerCase().includes(x)
                )
            )
            .map((f: any) => `${(f.name || "").replace(/_/g, " ")}: ${(f.values || []).join(", ")}`)
            .join("; ");
          const { error } = await sb.from("leads").insert({
            nome,
            telefone: tel,
            email: email || null,
            mensagem: `[Facebook Lead Ads — ${form.name}] ${extras}`,
            origem: "facebook",
            status: "novo",
            tipo,
            utm_source: "facebook",
            utm_medium: "paid",
            utm_campaign: ld.campaign_name || null,
            utm_content: ld.ad_name || null,
            meta_lead_id: ld.id,
            created_at: ld.created_time,
          });
          if (error) erros.push(`${ld.id}: ${error.message}`);
          else novos++;
        }
        if (page.paging?.next && page.paging?.cursors?.after) after = page.paging.cursors.after;
        else break;
      }
    }
  }

  return new Response(JSON.stringify({ novos, erros }), {
    headers: { "Content-Type": "application/json" },
  });
});
