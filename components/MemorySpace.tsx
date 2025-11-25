import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { VectorGraphData, VectorNode, VectorLink } from '../types';

interface MemorySpaceProps {
  data: VectorGraphData;
  searchQuery?: string;
}

const MemorySpace: React.FC<MemorySpaceProps> = ({ data, searchQuery = '' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // --- Mock Semantic Similarity Calculation ---
    // In a real Rust app, this would be computed via LanceDB
    const calculateRelevance = (node: VectorNode) => {
        if (!searchQuery || searchQuery.startsWith('http')) return 1.0;
        const query = searchQuery.toLowerCase();
        const text = (node.title + node.url).toLowerCase();
        
        // Simple string matching mock for demo
        if (text.includes(query)) return 1.0;
        
        // "Semantic" association mock
        if (query.includes('rust') && (text.includes('cargo') || text.includes('tauri') || text.includes('candle'))) return 0.8;
        if (query.includes('data') && (text.includes('arrow') || text.includes('polars') || text.includes('parquet'))) return 0.8;
        if (query.includes('ai') && (text.includes('vector') || text.includes('model') || text.includes('embedding'))) return 0.8;

        return 0.1; // Dim irrelevant nodes
    };

    const nodesWithRelevance = data.nodes.map(n => ({
        ...n,
        relevance: calculateRelevance(n)
    }));
    // --------------------------------------------

    // Force Simulation
    const simulation = d3.forceSimulation<any>(JSON.parse(JSON.stringify(nodesWithRelevance))) 
      .force("link", d3.forceLink<any, VectorLink>(JSON.parse(JSON.stringify(data.links))).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(35));

    // Draw Links
    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.3)
      .selectAll("line")
      .data(JSON.parse(JSON.stringify(data.links))) 
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 3)
      .attr("stroke", (d: any) => {
          // Check if connected nodes are relevant
          const sourceRel = calculateRelevance(data.nodes.find(n => n.id === d.source) as VectorNode);
          const targetRel = calculateRelevance(data.nodes.find(n => n.id === d.target) as VectorNode);
          return (sourceRel > 0.5 && targetRel > 0.5) ? "#39C1F3" : "#2A2E37";
      });

    // Draw Nodes
    const node = svg.append("g")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodesWithRelevance) 
      .join("circle")
      .attr("r", (d: any) => (d.similarity * 15 + 5) * (d.relevance > 0.5 ? 1.2 : 0.8)) // Grow relevant nodes
      .attr("fill", (d: any) => {
          if (d.relevance < 0.5) return "#1e293b"; // dimmed
          return d.id === '1' ? "#DEA584" : "#13161C";
      }) 
      .attr("stroke", (d: any) => {
           if (d.relevance < 0.5) return "#334155";
           return d.id === '1' ? "#CE412B" : "#39C1F3";
      })
      .attr("fill-opacity", (d: any) => d.relevance < 0.5 ? 0.3 : 1)
      .attr("stroke-opacity", (d: any) => d.relevance < 0.5 ? 0.3 : 1)
      .call(drag(simulation) as any);

    // Labels
    const text = svg.append("g")
      .selectAll("text")
      .data(nodesWithRelevance) 
      .join("text")
      .text((d: any) => d.title.substring(0, 20) + (d.title.length > 20 ? "..." : ""))
      .attr("x", 12)
      .attr("y", 3)
      .attr("fill", (d: any) => d.relevance < 0.5 ? "#475569" : "#94a3b8")
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", (d: any) => d.relevance < 0.5 ? "8px" : "10px")
      .style("pointer-events", "none")
      .style("opacity", (d: any) => d.relevance < 0.5 ? 0.5 : 1);

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      text
        .attr("x", (d: any) => d.x + 12)
        .attr("y", (d: any) => d.y + 3);
    });

    function drag(simulation: d3.Simulation<any, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [data, searchQuery]); // Re-run whenever data (nodes/links) changes

  return (
    <div className="w-full h-full flex flex-col bg-cortex-bg relative overflow-hidden animate-in zoom-in-95 duration-500">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#39C1F3 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="absolute top-4 left-4 z-10 pointer-events-none">
         <h2 className="text-rust-500 font-mono text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rust-500 animate-pulse"></span>
            LANCEDB LOCAL INDEX
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">
            {searchQuery && !searchQuery.startsWith('http') ? `Filtering: "${searchQuery}"` : `Vector Space • ${data.nodes.length} Nodes`}
          </p>
      </div>

      <div ref={containerRef} className="flex-1 w-full h-full z-0 cursor-move">
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>
    </div>
  );
};

export default MemorySpace;