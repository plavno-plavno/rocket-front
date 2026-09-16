import { queryOptions } from '@tanstack/react-query';
import {
  listRankProjects,
  getRankProject,
  getRankHeatmap,
  getRankTrend,
  getRankCompetitors
} from './service';
import type {
  ListRankProjectsQuery,
  GetRankHeatmapQuery,
  GetRankTrendQuery,
  GetRankCompetitorsQuery
} from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const rankKeys = {
  all: ['rank'] as const,
  rankProjects: (params?: ListRankProjectsQuery) =>
    [...rankKeys.all, 'rankProjects', params ?? {}] as const,
  rankProject: (id: string) => [...rankKeys.all, 'rankProject', id] as const,
  rankHeatmap: (id: string, params: GetRankHeatmapQuery) =>
    [...rankKeys.all, 'rankHeatmap', id, params ?? {}] as const,
  rankTrend: (id: string, params: GetRankTrendQuery) =>
    [...rankKeys.all, 'rankTrend', id, params ?? {}] as const,
  rankCompetitors: (id: string, params?: GetRankCompetitorsQuery) =>
    [...rankKeys.all, 'rankCompetitors', id, params ?? {}] as const
};

export const rankProjectsQueryOptions = (params?: ListRankProjectsQuery) =>
  queryOptions({
    queryKey: rankKeys.rankProjects(params),
    queryFn: () => listRankProjects(params)
  });

export const rankProjectQueryOptions = (id: string) =>
  queryOptions({ queryKey: rankKeys.rankProject(id), queryFn: () => getRankProject(id) });

export const rankHeatmapQueryOptions = (id: string, params: GetRankHeatmapQuery) =>
  queryOptions({
    queryKey: rankKeys.rankHeatmap(id, params),
    queryFn: () => getRankHeatmap(id, params)
  });

export const rankTrendQueryOptions = (id: string, params: GetRankTrendQuery) =>
  queryOptions({
    queryKey: rankKeys.rankTrend(id, params),
    queryFn: () => getRankTrend(id, params)
  });

export const rankCompetitorsQueryOptions = (id: string, params?: GetRankCompetitorsQuery) =>
  queryOptions({
    queryKey: rankKeys.rankCompetitors(id, params),
    queryFn: () => getRankCompetitors(id, params)
  });
