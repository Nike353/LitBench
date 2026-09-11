import { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { LineageSceneEdge } from './lineageMapModel';

export function LineageEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<LineageSceneEdge>) {
  const [hovered, setHovered] = useState(false);
  if (!data) return null;
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.26,
  });
  const labelVisible = hovered || data.labelVisible;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{
          stroke: data.stroke,
          strokeWidth: data.highlighted ? 2.8 : 1.5,
          strokeOpacity: data.dimmed ? 0.1 : data.highlighted ? 0.96 : 0.42,
          strokeDasharray:
            data.edge.status === 'proposed'
              ? '7 5'
              : data.edge.status === 'uncertain'
                ? '3 4'
                : data.edge.status === 'rejected'
                  ? '2 5'
                  : undefined,
        }}
      />
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="lineage-edge-hit"
      />
      {labelVisible && (
        <EdgeLabelRenderer>
          <div
            className="lineage-edge-label nodrag nopan"
            style={
              {
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                '--edge-color': data.stroke,
              } as React.CSSProperties
            }
          >
            <span>{data.edge.relation.replaceAll('_', ' ')}</span>
            <strong>{data.edge.transition_note}</strong>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
