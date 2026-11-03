import { HeatData, HeatDay } from '../../content/heat-snapshot';

// Acesso aos dados da placa: GET na API (.NET), que guarda o token e conversa com o GitHub.
// O navegador nunca fala direto com o GitHub.

/** o que a API (GET /api/github/contributions) responde */
interface LiveResponse {
  total: number;
  days: HeatDay[];
  fetchedAt?: string;
}

/** `null`: a API respondeu, mas sem dias (a placa segue com o registro guardado) */
export type LiveHeat = { data: HeatData; fetchedAt: Date } | null;

/** busca as contribuições; falha de rede ou status fora de 2xx rejeita a promessa */
export function fetchLiveHeat(endpoint: string, signal: AbortSignal): Promise<LiveHeat> {
  return fetch(endpoint, { headers: { Accept: 'application/json' }, signal })
    .then((r) => (r.ok ? (r.json() as Promise<Partial<LiveResponse> | null>) : Promise.reject(new Error('http ' + r.status))))
    .then((data) => {
      if (!data || !Array.isArray(data.days) || !data.days.length) return null;
      return { data: { total: data.total ?? 0, days: data.days, live: true }, fetchedAt: data.fetchedAt ? new Date(data.fetchedAt) : new Date() };
    });
}
