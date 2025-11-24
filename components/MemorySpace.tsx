import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { VectorGraphData, VectorNode, VectorLink } from '../types';

interface MemorySpaceProps {
  data: VectorGraphData;
}

const MemorySpace: React.FC<MemorySpaceProps> = ({ data }) => {
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

    // Force Simulation
    const simulation = d3.forceSimulation<VectorNode>(JSON.parse(JSON.stringify(data.nodes))) // Deep copy to avoid mutation issues in React StrictMode
      .force("link", d3.forceLink<VectorNode, VectorLink>(JSON.parse(JSON.stringify(data.links))).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    // Draw Lines
    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.3)
      .selectAll("line")
      .data(JSON.parse(JSON.stringify(data.links))) // copy
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 3)
      .attr("stroke", "#39C1F3"); // Arrow Blue

    // Draw Nodes
    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(JSON.parse(JSON.stringify(data.nodes))) // copy
      .join("circle")
      .attr("r", (d: any) => d.similarity * 15 + 5)
      .attr("fill", (d: any) => d.id === '1' ? "#DEA584" : "#13161C") // Current page is Rust Orange
      .attr("stroke", (d: any) => d.id === '1' ? "#CE412B" : "#39C1F3")
      .call(drag(simulation) as any);

    // Labels
    const text = svg.append("g")
      .selectAll("text")
      .data(JSON.parse(JSON.stringify(data.nodes))) // copy
      .join("text")
      .text((d: any) => d.title.substring(0, 20) + (d.title.length > 20 ? "..." : ""))
      .attr("x", 12)
      .attr("y", 3)
      .attr("fill", "#94a3b8")
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", "10px")
      .style("pointer-events", "none");

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

    function drag(simulation: d3.Simulation<VectorNode, undefined>) {
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
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col bg-cortex-bg relative overflow-hidden animate-in zoom-in-95 duration-500">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#39C1F3 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="absolute top-4 left-4 z-10">
         <h2 className="text-rust-500 font-mono text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rust-500 animate-pulse"></span>
            LANCEDB LOCAL INDEX
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">
            Vector Space • 384 Dimensions • Cosine Similarity
          </p>
      </div>

      <div ref={containerRef} className="flex-1 w-full h-full z-0 cursor-move">
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>
    </div>
  );
};

export default MemorySpace;
