import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { DataFrame } from '../types';
import InspectorPanel from './InspectorPanel';

interface DataViewProps {
  data: DataFrame;
  isChartVisible?: boolean;
}

const DataView: React.FC<DataViewProps> = ({ data, isChartVisible = false }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [showCode, setShowCode] = useState(true);
  const [showChart, setShowChart] = useState(isChartVisible);
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Sync internal state with prop if it changes
  useEffect(() => {
    if (isChartVisible) setShowChart(true);
  }, [isChartVisible]);

  // Transpose the column-oriented Arrow data to row-oriented for React rendering
  const allRows = useMemo(() => {
    return Array.from({ length: data.rowCount }, (_, rowIndex) => {
      const row: Record<string, any> = {};
      data.columns.forEach(col => {
        row[col.name] = col.data[rowIndex];
      });
      return row;
    });
  }, [data]);

  // 1. Filter
  const filteredRows = useMemo(() => {
    if (!filterQuery) return allRows;
    const lowerQuery = filterQuery.toLowerCase();
    return allRows.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      );
    });
  }, [allRows, filterQuery]);

  // 2. Sort
  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows;
    
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExportCSV = () => {
      if (sortedRows.length === 0) return;
      
      const headers = Object.keys(sortedRows[0]).join(',');
      const csvRows = sortedRows.map(row => 
          Object.values(row).map(v => typeof v === 'string' ? `"${v}"` : v).join(',')
      );
      
      const csvContent = [headers, ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "cortex_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Identify columns for visualization
  const numericCol = data.columns.find(c => c.type === 'UInt64');
  const labelCol = data.columns.find(c => c.type === 'Utf8' && (c.name === 'title' || c.name === 'crate_name'));

  // --- D3 Visualization Logic ---
  useEffect(() => {
    if (!showChart || !chartRef.current || !numericCol || !labelCol) return;

    const svg = d3.select(chartRef.current);
    const width = chartRef.current.clientWidth;
    const height = 150; // Fixed height for the chart panel

    svg.attr("width", width).attr("height", height);
    svg.selectAll("*").remove(); // Clear previous

    const margin = { top: 20, right: 20, bottom: 20, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Prepare data
    const chartData = numericCol.data.map((val, i) => ({
      value: Number(val),
      label: String(labelCol.data[i])
    })).slice(0, 20); // Limit to top 20 for visibility

    const x = d3.scaleBand()
      .range([0, chartWidth])
      .domain(chartData.map((d, i) => i.toString()))
      .padding(0.2);

    const y = d3.scaleLinear()
      .range([chartHeight, 0])
      .domain([0, d3.max(chartData, d => d.value) || 100]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Bars
    g.selectAll(".bar")
      .data(chartData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d, i) => x(i.toString()) || 0)
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.value))
      .attr("height", d => chartHeight - y(d.value))
      .attr("fill", "#39C1F3") // Arrow Blue
      .attr("opacity", 0.8);

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat(() => "").tickSize(0))
      .select(".domain").attr("stroke", "#2A2E37");

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(3).tickSize(-chartWidth))
      .select(".domain").remove();
    
    g.selectAll(".tick line")
      .attr("stroke", "#2A2E37")
      .attr("stroke-dasharray", "2,2");
    
    g.selectAll(".tick text")
      .attr("fill", "#64748b")
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", "9px");

  }, [showChart, numericCol, labelCol, allRows, data]); // Re-run when data changes (Live Mode)


  // Generate fake Polars code based on current state
  const generatedCode = useMemo(() => {
    const tableName = data.columns.some(c => c.name === 'crate_name') ? 'crates_df' : 'hn_df';
    let code = `// Rust / Polars Lazy Execution Plan\nlet df = ${tableName}.lazy();`;
    
    if (filterQuery) {
        code += `\nlet q = df.filter(\n    col("*").map(|s| s.to_string().contains("(?i)${filterQuery}"))\n);`;
    } else {
        code += `\nlet q = df;`;
    }
    
    if (sortConfig) {
        code += `\n// Sorting\nlet q = q.sort("${sortConfig.key}", SortOptions { descending: ${sortConfig.direction === 'desc'}, ..Default::default() });`;
    }

    if (showChart) {
        code += `\n// Plotting pipeline\nlet chart = Chart::new(ChartType::Bar)\n    .x("${labelCol?.name || 'label'}")\n    .y("${numericCol?.name || 'value'}")\n    .render(&q.collect()?);`;
    } else {
        code += `\nlet result = q.collect()?;`;
    }
    
    return code;
  }, [filterQuery, data, showChart, labelCol, numericCol, sortConfig]);

  return (
    <div className="w-full h-full flex flex-col bg-cortex-bg overflow-hidden animate-in fade-in duration-300 relative">
      {/* Toolbar / SQL Simulator */}
      <div className="px-4 py-3 border-b border-cortex-border bg-cortex-panel flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-arrow-400 font-mono text-sm font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-arrow-400 animate-pulse"></span>
              ARROW RECORD BATCH
            </h2>
            <p className="text-slate-500 text-xs mt-0.5 font-mono">
              Memory Address: 0x7F4A9B1C • {data.rowCount} Total Rows • {data.columns.length} Cols
            </p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={handleExportCSV}
                className="text-xs px-3 py-1 rounded border font-mono transition-colors bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white flex items-center gap-2"
            >
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               Export CSV
            </button>
            <button 
                onClick={() => setShowChart(!showChart)}
                className={`text-xs px-3 py-1 rounded border font-mono transition-colors flex items-center gap-2 ${showChart ? 'bg-arrow-400/20 text-arrow-400 border-arrow-400/50' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
              {showChart ? 'Hide Viz' : 'Visualize'}
            </button>
            <button 
                onClick={() => setShowCode(!showCode)}
                className={`text-xs px-3 py-1 rounded border font-mono transition-colors ${showCode ? 'bg-rust-500/20 text-rust-500 border-rust-500/50' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
            >
              {showCode ? 'Hide Engine' : 'Show Engine'}
            </button>
          </div>
        </div>

        {/* Filter Input */}
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-500 group-focus-within:text-arrow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
            </div>
            <input 
                type="text" 
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="FILTER (e.g. 'Rust', 'AI', 'true')..." 
                className="block w-full pl-10 pr-3 py-1.5 border border-slate-700 rounded-md leading-5 bg-black/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-arrow-400 sm:text-xs font-mono transition-all"
            />
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] text-slate-500 font-mono">
                    {sortedRows.length} matches
                </span>
            </div>
        </div>
      </div>

      {/* Visualization Panel */}
      {showChart && numericCol && (
        <div className="h-[160px] bg-[#0F1115] border-b border-cortex-border relative flex-shrink-0">
             <div className="absolute top-2 left-4 text-[10px] text-slate-500 font-mono z-10">
                VISUALIZATION: {numericCol.name.toUpperCase()} DISTRIBUTION
             </div>
             <svg ref={chartRef} className="w-full h-full block"></svg>
        </div>
      )}
      
      {/* Table Area */}
      <div className="flex-1 overflow-auto relative bg-cortex-bg">
        <table className="w-full text-left border-collapse">
          <thead className="bg-cortex-panel sticky top-0 z-10 shadow-sm">
            <tr>
              {data.columns.map((col) => (
                <th 
                    key={col.name} 
                    onClick={() => handleSort(col.name)}
                    className="p-2 border-b border-r border-cortex-border text-xs font-mono text-slate-400 uppercase tracking-wider last:border-r-0 bg-cortex-panel cursor-pointer hover:bg-white/5 select-none"
                >
                  <div className="flex items-center justify-between group">
                    <span className="flex items-center gap-1">
                        {col.name}
                        {sortConfig?.key === col.name && (
                            <span className="text-arrow-400">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                    </span>
                    <span className="text-[9px] px-1 bg-slate-800 rounded text-slate-500 group-hover:text-arrow-400">{col.type}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cortex-border bg-cortex-bg">
            {sortedRows.map((row, i) => (
              <tr 
                key={i} 
                onClick={() => setSelectedRow(row)}
                className={`transition-colors group cursor-pointer ${selectedRow === row ? 'bg-arrow-400/10' : 'hover:bg-white/5'}`}
              >
                {data.columns.map((col) => (
                  <td key={`${i}-${col.name}`} className="p-2 border-r border-cortex-border text-sm text-slate-300 font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] last:border-r-0">
                    {col.name === 'is_vectorized' ? (
                       row[col.name] ? 
                       <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-900/30 text-green-400 border border-green-900/50">TRUE</span> : 
                       <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-900/30 text-red-400 border border-red-900/50">FALSE</span>
                    ) : col.name === 'category' ? (
                        <span className="text-arrow-400">{row[col.name]}</span>
                    ) : (
                      <span className={col.type === 'UInt64' ? 'text-rust-500' : ''}>{row[col.name]}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {sortedRows.length === 0 && (
                <tr>
                    <td colSpan={data.columns.length} className="p-8 text-center text-slate-500 font-mono text-sm">
                        No records match filter criteria.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Query Inspector (Simulating the Engine) */}
      {showCode && (
        <div className="bg-[#0A0C10] border-t border-cortex-border p-0 animate-in slide-in-from-bottom duration-300 h-32 flex flex-col flex-shrink-0">
            <div className="bg-[#1e1e1e] px-2 py-1 text-[10px] text-slate-500 font-mono border-b border-white/10 flex justify-between">
                <span>GENERATED_PLAN.rs</span>
                <span>TARGET: WASM</span>
            </div>
            <div className="flex-1 p-3 overflow-auto font-mono text-xs text-slate-300">
                <pre>
                    <code dangerouslySetInnerHTML={{__html: generatedCode.replace(/let/g, '<span class="text-rust-500">let</span>').replace(/lazy/g, '<span class="text-arrow-400">lazy</span>').replace(/filter/g, '<span class="text-arrow-400">filter</span>').replace(/collect/g, '<span class="text-arrow-400">collect</span>').replace(/sort/g, '<span class="text-yellow-400">sort</span>').replace(/Chart/g, '<span class="text-blue-400">Chart</span>')}}></code>
                </pre>
            </div>
        </div>
      )}
      
      {/* Footer Stats */}
      <div className="bg-cortex-panel border-t border-cortex-border p-1 text-[10px] text-slate-500 font-mono flex justify-end gap-4 px-4">
        <span>RAM: 4.2MB</span>
        <span>Parse Time: 2ms</span>
        <span>Engine: Polars (Rust)</span>
      </div>

      {/* Inspector Panel Overlay */}
      {selectedRow && (
          <InspectorPanel data={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
};

export default DataView;
