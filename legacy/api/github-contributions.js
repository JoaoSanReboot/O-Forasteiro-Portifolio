// Endpoint de servidor (Vercel Functions, Node 18+) que alimenta a placa do telégrafo
// com as contribuições reais do GitHub. O token NUNCA vai para o navegador: ele fica
// na variável de ambiente GITHUB_TOKEN do projeto na Vercel.
//
// Variáveis de ambiente:
//   GITHUB_TOKEN  (obrigatória) token fine-grained só de leitura; não precisa de nenhuma permissão extra
//                 para ler o calendário público de contribuições.
//   GITHUB_LOGIN  (opcional)    usuário do GitHub; padrão "JoaoSanReboot".
//
// Resposta: { total, days: [{ date: "AAAA-MM-DD", count, level: 0-4 }], fetchedAt }

const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const login = process.env.GITHUB_LOGIN || "JoaoSanReboot";
  if (!token) {
    res.status(503).json({ error: "missing_token", message: "Configure GITHUB_TOKEN nas variáveis de ambiente." });
    return;
  }
  try {
    const r = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "portfolio-forasteiro" },
      body: JSON.stringify({ query: QUERY, variables: { login } }),
    });
    if (!r.ok) { res.status(502).json({ error: "github_error", status: r.status }); return; }
    const json = await r.json();
    const cal = json && json.data && json.data.user && json.data.user.contributionsCollection && json.data.user.contributionsCollection.contributionCalendar;
    if (!cal) { res.status(404).json({ error: "no_data", details: json && json.errors }); return; }
    const days = cal.weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0 })));
    // uma hora de cache na borda: a placa não precisa bater no GitHub a cada visita
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ total: cal.totalContributions, days, fetchedAt: new Date().toISOString() });
  } catch (err) {
    res.status(502).json({ error: "network_error" });
  }
}
