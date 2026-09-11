import { RotateCcw } from 'lucide-react';
import { NODE_TYPES, STATUSES } from '../../domain/schema';
import { useWorkspaceStore } from '../../store/workspaceStore';

export function FiltersPanel() {
  const graph = useWorkspaceStore((state) => state.graph)!;
  const filters = useWorkspaceStore((state) => state.filters);
  const toggleNodeType = useWorkspaceStore((state) => state.toggleNodeType);
  const toggleStatus = useWorkspaceStore((state) => state.toggleStatus);
  const toggleRelation = useWorkspaceStore((state) => state.toggleRelation);
  const toggleRejected = useWorkspaceStore((state) => state.toggleRejected);
  const setCluster = useWorkspaceStore((state) => state.setCluster);
  const resetFilters = useWorkspaceStore((state) => state.resetFilters);
  const clusters = graph.nodes.filter((node) => node.type === 'cluster');
  const relations = [...new Set(graph.edges.map((edge) => edge.relation))].sort();

  return (
    <div className="panel-scroll">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Graph visibility</span>
          <h2>Filters</h2>
        </div>
        <button
          className="icon-button"
          title="Reset all filters"
          aria-label="Reset all filters"
          onClick={resetFilters}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <section className="panel-section filter-section">
        <h3>Cluster</h3>
        <select
          value={filters.clusterId ?? ''}
          onChange={(event) => setCluster(event.target.value || null)}
        >
          <option value="">All clusters</option>
          {clusters.map((cluster) => (
            <option key={cluster.id} value={cluster.id}>
              {cluster.label}
            </option>
          ))}
        </select>
      </section>

      <section className="panel-section filter-section">
        <h3>Node types</h3>
        <div className="check-grid">
          {NODE_TYPES.map((type) => (
            <label key={type}>
              <input
                type="checkbox"
                checked={filters.nodeTypes.has(type)}
                onChange={() => toggleNodeType(type)}
              />
              <span className={`type-dot type-${type}`} />
              {type.replace('_', ' ')}
            </label>
          ))}
        </div>
      </section>

      <section className="panel-section filter-section">
        <h3>Status</h3>
        <div className="check-grid">
          {STATUSES.filter((status) => status !== 'rejected').map((status) => (
            <label key={status}>
              <input
                type="checkbox"
                checked={filters.statuses.has(status)}
                onChange={() => toggleStatus(status)}
              />
              <span className={`status-swatch status-${status}`} />
              {status}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={filters.showRejected}
              onChange={toggleRejected}
            />
            <span className="status-swatch status-rejected" />
            rejected
          </label>
        </div>
      </section>

      <section className="panel-section filter-section">
        <h3>Relations</h3>
        <div className="check-grid relations-grid">
          {relations.map((relation) => (
            <label key={relation}>
              <input
                type="checkbox"
                checked={filters.relations.has(relation)}
                onChange={() => toggleRelation(relation)}
              />
              {relation.replaceAll('_', ' ')}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
