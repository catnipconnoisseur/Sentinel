/**
 * ReasoningGraph — React Flow visualization of the investigation reasoning.
 * Nodes are colored by type (root_cause, symptom, etc.)
 * Clicking a node opens the EvidenceDrawer.
 */

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ─── Custom Node Component ──────────────────────────────────────

function ReasoningNodeComponent({ data }) {
  return (
    <div className={`reasoning-node ${data.type}`} onClick={data.onClick}>
      <Handle type="target" position={Position.Top} style={{ background: '#6366f1', border: 'none', width: 8, height: 8 }} />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{data.icon}</span>
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-[var(--text-muted)]">
        {data.evidenceCount > 0 && `${data.evidenceCount} evidence`}
        {data.evidenceCount > 0 && ' · '}
        {Math.round(data.confidence * 100)}% confidence
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#6366f1', border: 'none', width: 8, height: 8 }} />
    </div>
  );
}

const nodeTypes = { reasoning: ReasoningNodeComponent };

// ─── Type Icons ─────────────────────────────────────────────────

const typeIcons = {
  root_cause: '🔴',
  symptom: '🟡',
  contributing_factor: '🟣',
  evidence: '🔵',
  recommendation: '🟢',
};

// ─── Layout Helper (simple top-down) ────────────────────────────

function layoutNodes(nodes, edges) {
  // Build adjacency for simple layering
  const inDegree = {};
  const children = {};
  nodes.forEach((n) => { inDegree[n.id] = 0; children[n.id] = []; });
  edges.forEach((e) => {
    inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    if (children[e.source]) children[e.source].push(e.target);
  });

  // BFS layering
  const layers = [];
  const visited = new Set();
  let current = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);

  while (current.length > 0) {
    layers.push(current);
    current.forEach((id) => visited.add(id));
    const next = [];
    current.forEach((id) => {
      children[id]?.forEach((childId) => {
        if (!visited.has(childId) && !next.includes(childId)) {
          next.push(childId);
        }
      });
    });
    current = next;
  }

  // Add any unvisited nodes (disconnected)
  const unvisited = nodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
  if (unvisited.length > 0) layers.push(unvisited);

  // Position nodes
  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 100;
  const H_GAP = 40;
  const V_GAP = 60;

  const positions = {};
  layers.forEach((layer, layerIdx) => {
    const totalWidth = layer.length * NODE_WIDTH + (layer.length - 1) * H_GAP;
    const startX = -totalWidth / 2;
    layer.forEach((nodeId, nodeIdx) => {
      positions[nodeId] = {
        x: startX + nodeIdx * (NODE_WIDTH + H_GAP),
        y: layerIdx * (NODE_HEIGHT + V_GAP),
      };
    });
  });

  return positions;
}

// ─── Edge Styling ───────────────────────────────────────────────

const edgeColors = {
  caused_by: '#ef4444',
  led_to: '#f59e0b',
  correlated_with: '#8b5cf6',
  indicates: '#3b82f6',
};

// ─── Main Component ─────────────────────────────────────────────

export default function ReasoningGraph({ investigation, onNodeClick }) {
  if (!investigation) return null;

  const positions = useMemo(
    () => layoutNodes(investigation.nodes, investigation.edges),
    [investigation]
  );

  const flowNodes = useMemo(() =>
    investigation.nodes.map((node) => ({
      id: node.id,
      type: 'reasoning',
      position: positions[node.id] || { x: 0, y: 0 },
      data: {
        label: node.label,
        type: node.type,
        icon: typeIcons[node.type] || '⚪',
        confidence: node.confidence,
        evidenceCount: node.evidence?.length || 0,
        onClick: () => onNodeClick?.(node),
      },
    })),
    [investigation, positions, onNodeClick]
  );

  const flowEdges = useMemo(() =>
    investigation.edges.map((edge, i) => ({
      id: `e-${i}`,
      source: edge.source,
      target: edge.target,
      label: edge.relationship?.replace('_', ' '),
      animated: true,
      style: {
        stroke: edgeColors[edge.relationship] || '#6366f1',
        strokeWidth: 2,
      },
      labelStyle: {
        fill: 'var(--text-muted)',
        fontSize: 10,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: 'var(--bg-card)',
        fillOpacity: 0.9,
      },
    })),
    [investigation]
  );

  return (
    <div className="glass-card overflow-hidden" style={{ height: 500 }}>
      <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          🧠 Reasoning Graph
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          Click nodes for evidence details
        </span>
      </div>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={1.5}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(99, 102, 241, 0.05)" gap={20} />
        <Controls
          showInteractive={false}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
          }}
        />
      </ReactFlow>
    </div>
  );
}
