import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type {
  ListRankProjectsQuery,
  GetRankHeatmapQuery,
  GetRankTrendQuery,
  GetRankCompetitorsQuery
} from './types';

/** GET /rank-projects — List rank projects */
export async function listRankProjects(params?: ListRankProjectsQuery) {
  const { data } = await coreClient().GET('/rank-projects', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /rank-projects — Create rank project */
export async function createRankProject(body: OperationBody<'create_rank_project'>) {
  const { data } = await coreClient().POST('/rank-projects', { body });
  return data!;
}

/** GET /rank-projects/{id} — Get rank project */
export async function getRankProject(id: string) {
  const { data } = await coreClient().GET('/rank-projects/{id}', { params: { path: { id } } });
  return data!;
}

/** PUT /rank-projects/{id} — Update rank project */
export async function updateRankProject(id: string, body: OperationBody<'update_rank_project'>) {
  const { data } = await coreClient().PUT('/rank-projects/{id}', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** DELETE /rank-projects/{id} — Delete rank project */
export async function deleteRankProject(id: string) {
  await coreClient().DELETE('/rank-projects/{id}', { params: { path: { id } } });
}

/** POST /rank-projects/{id}/run — Trigger a run */
export async function runRankProject(id: string) {
  await coreClient().POST('/rank-projects/{id}/run', { params: { path: { id } } });
}

/** GET /rank-projects/{id}/heatmap — Heatmap for a location × keyword × platform */
export async function getRankHeatmap(id: string, params: GetRankHeatmapQuery) {
  const { data } = await coreClient().GET('/rank-projects/{id}/heatmap', {
    params: { path: { id }, query: query(params ?? {}) }
  });
  return data!;
}

/** GET /rank-projects/{id}/trend — ARP / SoLV trend */
export async function getRankTrend(id: string, params: GetRankTrendQuery) {
  const { data } = await coreClient().GET('/rank-projects/{id}/trend', {
    params: { path: { id }, query: query(params ?? {}) }
  });
  return data!;
}

/** GET /rank-projects/{id}/competitors — Competitors seen in results */
export async function getRankCompetitors(id: string, params?: GetRankCompetitorsQuery) {
  const { data } = await coreClient().GET('/rank-projects/{id}/competitors', {
    params: { path: { id }, query: query(params ?? {}) }
  });
  return data!;
}
