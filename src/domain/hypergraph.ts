import type { GraphData, GraphNode } from './schema';

export interface ClusterMembership {
  cluster: GraphNode;
  role: 'primary' | 'secondary';
  weight: number;
  evidenceCount: number;
  evidenceScore: number;
  basis?: 'primary' | 'explicit' | 'inferred';
}

const SECONDARY_THRESHOLD = 0.55;
const MAX_SECONDARY_MEMBERSHIPS = 3;

function statusWeight(status: GraphData['edges'][number]['status']) {
  if (status === 'rejected') return 0;
  if (status === 'uncertain') return 0.58;
  if (status === 'proposed') return 0.82;
  return 1;
}

/**
 * The persisted graph keeps one curator-owned primary cluster per node.
 * Secondary paper memberships are evidence projections: a sufficiently
 * strong authored edge into another cluster makes that paper a bridge.
 */
export function derivePaperMemberships(graph: GraphData) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const clusterById = new Map(
    graph.nodes
      .filter((node) => node.type === 'cluster' && node.status !== 'rejected')
      .map((cluster) => [cluster.id, cluster]),
  );
  const incidentEdges = new Map<string, GraphData['edges']>();

  for (const edge of graph.edges) {
    if (edge.status === 'rejected') continue;
    incidentEdges.set(edge.source, [...(incidentEdges.get(edge.source) ?? []), edge]);
    incidentEdges.set(edge.target, [...(incidentEdges.get(edge.target) ?? []), edge]);
  }

  return new Map(
    graph.nodes
      .filter((node) => node.type === 'paper')
      .map((paper) => {
        const primary = paper.cluster ? clusterById.get(paper.cluster) : undefined;
        const scores = new Map<string, { score: number; count: number }>();
        const explicit = new Set<string>();

        for (const edge of incidentEdges.get(paper.id) ?? []) {
          const otherId = edge.source === paper.id ? edge.target : edge.source;
          const other = nodeById.get(otherId);
          const clusterId = other?.type === 'cluster' ? other.id : other?.cluster;
          if (!clusterId || clusterId === primary?.id || !clusterById.has(clusterId)) {
            continue;
          }
          if (other?.status === 'rejected') continue;
          if (
            other?.type === 'cluster' &&
            edge.relation === 'belongs_to' &&
            edge.status === 'accepted'
          )
            explicit.add(clusterId);

          const kindWeight = other?.type === 'paper' ? 0.9 : 1;
          const contribution = edge.confidence * statusWeight(edge.status) * kindWeight;
          const current = scores.get(clusterId) ?? { score: 0, count: 0 };
          scores.set(clusterId, {
            score: current.score + contribution,
            count: current.count + 1,
          });
        }

        const memberships: ClusterMembership[] = [];
        if (primary) {
          memberships.push({
            cluster: primary,
            role: 'primary',
            weight: 1,
            evidenceCount: 0,
            evidenceScore: 1,
            basis: 'primary',
          });
        }

        const secondary = [...scores.entries()]
          .filter(([id]) => !explicit.has(id))
          .filter(([, evidence]) => evidence.score >= SECONDARY_THRESHOLD)
          .sort(
            ([leftId, left], [rightId, right]) =>
              right.score - left.score || leftId.localeCompare(rightId),
          )
          .slice(0, MAX_SECONDARY_MEMBERSHIPS);

        for (const [clusterId, evidence] of [
          ...[...explicit].map((id) => [id, scores.get(id)!] as const),
          ...secondary,
        ]) {
          memberships.push({
            cluster: clusterById.get(clusterId)!,
            role: 'secondary',
            weight: Math.min(0.82, 0.4 + Math.min(1.6, evidence.score) * 0.26),
            evidenceCount: evidence.count,
            evidenceScore: evidence.score,
            basis: explicit.has(clusterId) ? 'explicit' : 'inferred',
          });
        }

        return [paper.id, memberships] as const;
      }),
  );
}

export function paperBelongsToCluster(
  memberships: ReturnType<typeof derivePaperMemberships>,
  paperId: string,
  clusterId: string,
) {
  return memberships
    .get(paperId)
    ?.some((membership) => membership.cluster.id === clusterId);
}

export function clusterPaperCounts(
  graph: GraphData,
  memberships = derivePaperMemberships(graph),
) {
  const counts = new Map<string, { papers: number; primary: number; bridges: number }>();
  for (const cluster of graph.nodes.filter((node) => node.type === 'cluster')) {
    counts.set(cluster.id, { papers: 0, primary: 0, bridges: 0 });
  }
  for (const paperMemberships of memberships.values()) {
    for (const membership of paperMemberships) {
      const count = counts.get(membership.cluster.id);
      if (!count) continue;
      count.papers += 1;
      if (membership.role === 'primary') count.primary += 1;
      else count.bridges += 1;
    }
  }
  return counts;
}
