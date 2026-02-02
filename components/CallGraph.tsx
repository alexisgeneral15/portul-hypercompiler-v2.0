
import React, { useMemo } from 'react';

interface CallGraphProps {
    code: string;
}

interface Node {
    id: string;
    x: number;
    y: number;
}

interface Edge {
    source: string;
    target: string;
}

export const CallGraph: React.FC<CallGraphProps> = ({ code }) => {
    const { nodes, edges } = useMemo(() => {
        const functions = new Map<string, { calls: string[] }>();
        let currentFunction: string | null = null;

        code.split('\n').forEach(line => {
            const funcDefMatch = line.match(/^\s*new\s+(\w+)/);
            if (funcDefMatch) {
                currentFunction = funcDefMatch[1];
                if (!functions.has(currentFunction)) {
                    functions.set(currentFunction, { calls: [] });
                }
            }

            const callMatch = line.match(/^\s*cal\s+(\w+)/);
            if (callMatch && currentFunction) {
                functions.get(currentFunction)?.calls.push(callMatch[1]);
            }

            if (line.includes('}')) {
                currentFunction = null;
            }
        });

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const nodeMap = new Map<string, Node>();

        // Simple layout algorithm
        let yPos = 50;
        functions.forEach((_, name) => {
            const node = { id: name, x: 150, y: yPos };
            newNodes.push(node);
            nodeMap.set(name, node);
            yPos += 80;
        });

        functions.forEach((data, name) => {
            data.calls.forEach(targetName => {
                if (functions.has(targetName)) {
                    newEdges.push({ source: name, target: targetName });
                }
            });
        });
        
        return { nodes: newNodes, edges: newEdges };
    }, [code]);

    if (nodes.length === 0) {
        return <div className="text-center text-slate-500 p-8">No function definitions found in this file.</div>
    }

    return (
        <svg width="100%" height="100%" className="min-h-[200px]">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#58a6ff" />
                </marker>
            </defs>
            {edges.map((edge, i) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;
                return (
                    <line
                        key={i}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke="#58a6ff"
                        strokeWidth="1"
                        markerEnd="url(#arrow)"
                    />
                );
            })}
            {nodes.map(node => (
                <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                    <rect x="-50" y="-15" width="100" height="30" rx="5" fill="#161b22" stroke="#30363d" />
                    <text textAnchor="middle" dominantBaseline="middle" fill="#c9d1d9" fontSize="12" fontFamily="Fira Code, monospace">
                        {node.id}
                    </text>
                </g>
            ))}
        </svg>
    );
};
