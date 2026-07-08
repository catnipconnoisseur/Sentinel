/**
 * ReasoningGraph — React Flow visualization of the investigation reasoning.
 * Nodes are colored by type (root_cause, symptom, etc.)
 * Clicking a node opens the EvidenceDrawer.
 *
 * Animation: Nodes reveal layer-by-layer (topological order) with a staggered
 * fade-in-scale effect. Edges appear after both their source and target nodes
 * are visible. This creates the illusion of the AI "building" its reasoning
 * chain in real-time — the single most impactful demo moment.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ─── Custom Node Component ──────────────────────────────────────

function ReasoningNodeComponent({ data }) {
  return (
    <div
      className={`reasoning-node ${data.type} ${data.visible ? 'node-visible' : 'node-hidden'}`}
      onClick={data.onClick}
      style={{ animationDelay: `${data.animDelay}ms` }}
    >
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
  const nodeLayerMap = {};
  layers.forEach((layer, layerIdx) => {
    const totalWidth = layer.length * NODE_WIDTH + (layer.length - 1) * H_GAP;
    const startX = -totalWidth / 2;
    layer.forEach((nodeId, nodeIdx) => {
      positions[nodeId] = {
        x: startX + nodeIdx * (NODE_WIDTH + H_GAP),
        y: layerIdx * (NODE_HEIGHT + V_GAP),
      };
      nodeLayerMap[nodeId] = layerIdx;
    });
  });

  return { positions, layers, nodeLayerMap };
}

// ─── Edge Styling ───────────────────────────────────────────────

const edgeColors = {
  caused_by: '#ef4444',
  led_to: '#f59e0b',
  correlated_with: '#8b5cf6',
  indicates: '#3b82f6',
};

// ─── Animation Constants ────────────────────────────────────────

const NODE_REVEAL_INTERVAL = 400;  // ms between each layer
const EDGE_REVEAL_DELAY = 250;     // ms after a node layer before its edges show

// ─── Main Component ─────────────────────────────────────────────

export default function ReasoningGraph({ investigation, onNodeClick }) {
  if (!investigation) return null;

  const [visibleNodeIds, setVisibleNodeIds] = useState(new Set());
  const [visibleEdgeIds, setVisibleEdgeIds] = useState(new Set());
  const prevInvestigationRef = useRef(null);

  const { positions, layers, nodeLayerMap } = useMemo(
    () => layoutNodes(investigation.nodes, investigation.edges),
    [investigation]
  );

  // ─── Staggered reveal animation ────────────────────────────
  useEffect(() => {
    // Only animate if this is a new investigation result
    if (prevInvestigationRef.current === investigation) return;
    prevInvestigationRef.current = investigation;

    // Reset
    setVisibleNodeIds(new Set());
    setVisibleEdgeIds(new Set());

    const timers = [];

    layers.forEach((layerNodeIds, layerIdx) => {
      // Reveal this layer's nodes
      const nodeTimer = setTimeout(() => {
        setVisibleNodeIds((prev) => {
          const next = new Set(prev);
          layerNodeIds.forEach((id) => next.add(id));
          return next;
        });
      }, layerIdx * NODE_REVEAL_INTERVAL);
      timers.push(nodeTimer);

      // Reveal edges that connect to this layer (after a short delay)
      const edgeTimer = setTimeout(() => {
        setVisibleEdgeIds((prev) => {
          const next = new Set(prev);
          investigation.edges.forEach((edge, i) => {
            const sourceLayer = nodeLayerMap[edge.source];
            const targetLayer = nodeLayerMap[edge.target];
            // Show edge only if both nodes are in revealed layers
            if (sourceLayer !== undefined && targetLayer !== undefined &&
                sourceLayer <= layerIdx && targetLayer <= layerIdx) {
              next.add(`e-${i}`);
            }
          });
          return next;
        });
      }, layerIdx * NODE_REVEAL_INTERVAL + EDGE_REVEAL_DELAY);
      timers.push(edgeTimer);
    });

    return () => timers.forEach(clearTimeout);
  }, [investigation, layers, nodeLayerMap]);

  // ─── Build React Flow data ─────────────────────────────────

  const flowNodes = useMemo(() =>
    investigation.nodes.map((node) => {
      const layerIdx = nodeLayerMap[node.id] || 0;
      return {
        id: node.id,
        type: 'reasoning',
        position: positions[node.id] || { x: 0, y: 0 },
        hidden: !visibleNodeIds.has(node.id),
        data: {
          label: node.label,
          type: node.type,
          icon: typeIcons[node.type] || '⚪',
          confidence: node.confidence,
          evidenceCount: node.evidence?.length || 0,
          visible: visibleNodeIds.has(node.id),
          animDelay: 0,
          onClick: () => onNodeClick?.(node),
        },
      };
    }),
    [investigation, positions, onNodeClick, visibleNodeIds, nodeLayerMap]
  );

  const flowEdges = useMemo(() =>
    investigation.edges.map((edge, i) => {
      const edgeId = `e-${i}`;
      return {
        id: edgeId,
        source: edge.source,
        target: edge.target,
        label: edge.relationship?.replace('_', ' '),
        animated: true,
        hidden: !visibleEdgeIds.has(edgeId),
        style: {
          stroke: edgeColors[edge.relationship] || '#6366f1',
          strokeWidth: 2,
          opacity: visibleEdgeIds.has(edgeId) ? 1 : 0,
          transition: 'opacity 0.4s ease',
        },
        labelStyle: {
          fill: 'var(--text-muted)',
          fontSize: 10,
          fontWeight: 500,
          opacity: visibleEdgeIds.has(edgeId) ? 1 : 0,
          transition: 'opacity 0.4s ease',
        },
        labelBgStyle: {
          fill: 'var(--bg-card)',
          fillOpacity: visibleEdgeIds.has(edgeId) ? 0.9 : 0,
        },
      };
    }),
    [investigation, visibleEdgeIds]
  );

  const animationProgress = layers.length > 0
    ? Math.round((visibleNodeIds.size / investigation.nodes.length) * 100)
    : 100;

  return (
    <div className="glass-card overflow-hidden" style={{ height: 500 }}>
      <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          🧠 Reasoning Graph
        </h3>
        <div className="flex items-center gap-3">
          {animationProgress < 100 && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${animationProgress}%` }}
                />
              </div>
              <span className="text-xs text-indigo-400 font-mono">Reasoning...</span>
            </div>
          )}
          <span className="text-xs text-[var(--text-muted)]">
            Click nodes for evidence details
          </span>
        </div>
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
