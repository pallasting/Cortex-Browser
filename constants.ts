import { DataFrame, VectorGraphData } from './types';

// Mocking the result of "html_to_dataframe" for a Hacker News style page
export const MOCK_HN_DATAFRAME: DataFrame = {
  rowCount: 12,
  columns: [
    {
      name: "id",
      type: "UInt64",
      data: [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012]
    },
    {
      name: "title",
      type: "Utf8",
      data: [
        "Rust 1.78.0 is released",
        "Apache Arrow: The universal columnar format",
        "Building a Browser in Rust: A Case Study",
        "Why specialized vector databases are the future",
        "Zero-copy serialization with rkyv",
        "Polars vs Pandas: Performance Benchmarks",
        "Show HN: Cortex, a browser that thinks",
        "Understanding SIMD in WebAssembly",
        "The state of WebGPU in 2024",
        "LanceDB: Serverless Vector Search",
        "Optimizing React with Rust WASM modules",
        "AI Agents need structured data, not HTML"
      ]
    },
    {
      name: "points",
      type: "UInt64",
      data: [542, 320, 890, 120, 45, 1200, 67, 230, 440, 310, 150, 900]
    },
    {
      name: "category",
      type: "Utf8",
      data: ["Lang", "Data", "Eng", "DB", "Eng", "Data", "Show", "Eng", "Graphics", "DB", "Web", "AI"]
    },
    {
      name: "is_vectorized",
      type: "Boolean",
      data: [true, true, true, true, false, true, false, true, true, true, false, true]
    }
  ]
};

// Mocking a different schema for "crates.io" to demonstrate schema switching
export const MOCK_CRATES_DATAFRAME: DataFrame = {
  rowCount: 8,
  columns: [
    {
      name: "crate_name",
      type: "Utf8",
      data: ["tokio", "serde", "clap", "winit", "bevy", "tauri", "actix-web", "yew"]
    },
    {
      name: "version",
      type: "Utf8",
      data: ["1.32.0", "1.0.188", "4.4.6", "0.29.0", "0.13.0", "2.0.0-beta", "4.4.0", "0.20.0"]
    },
    {
      name: "downloads",
      type: "UInt64",
      data: [154000000, 189000000, 85000000, 12000000, 4500000, 3200000, 45000000, 2100000]
    },
    {
      name: "description",
      type: "Utf8",
      data: [
        "An event-driven, non-blocking I/O platform for writing asynchronous I/O backed applications.",
        "A generic serialization/deserialization framework.",
        "A full featured, fast Command Line Argument Parser.",
        "Cross-platform window creation and management in Rust.",
        "A refreshingly simple data-driven game engine built in Rust.",
        "Build smaller, faster, and more secure desktop applications with a web frontend.",
        "Actix Web is a powerful, pragmatic, and extremely fast web framework.",
        "Rust / Wasm framework for creating reliable and efficient web applications."
      ]
    },
    {
      name: "is_vectorized",
      type: "Boolean",
      data: [true, true, true, false, false, true, true, false]
    }
  ]
};

// Mocking the Memory/Vector Space
export const MOCK_VECTOR_GRAPH: VectorGraphData = {
  nodes: [
    { id: "1", title: "Current Page: Hacker News", url: "news.ycombinator.com", similarity: 1.0 },
    { id: "2", title: "Rust Lang Documentation", url: "doc.rust-lang.org", similarity: 0.85 },
    { id: "3", title: "Apache Arrow Spec", url: "arrow.apache.org", similarity: 0.78 },
    { id: "4", title: "Polars User Guide", url: "pola.rs", similarity: 0.82 },
    { id: "5", title: "LanceDB GitHub", url: "github.com/lancedb", similarity: 0.75 },
    { id: "6", title: "HuggingFace Candle", url: "huggingface.co", similarity: 0.65 },
    { id: "7", title: "WebAssembly MDN", url: "developer.mozilla.org", similarity: 0.55 },
    { id: "8", title: "Y Combinator", url: "ycombinator.com", similarity: 0.90 },
  ],
  links: [
    { source: "1", target: "8", value: 0.9 },
    { source: "1", target: "2", value: 0.4 },
    { source: "2", target: "3", value: 0.5 },
    { source: "3", target: "4", value: 0.9 }, // Strong link between Arrow and Polars
    { source: "3", target: "5", value: 0.8 }, // Arrow and LanceDB
    { source: "2", target: "6", value: 0.6 }, // Rust and Candle
    { source: "2", target: "7", value: 0.3 },
  ]
};

export const INITIAL_URL = "https://news.ycombinator.com/front";