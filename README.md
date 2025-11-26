# Cortex Browser 🧠
> **The Operating System for the Web.** Built with Rust, Apache Arrow, and LanceDB.

Cortex is a conceptual AI browser that treats the web as a structured database. It leverages a "Zero-Copy" architecture where the rendering engine (Rust) shares memory directly with local AI models via Apache Arrow format, enabling millisecond-latency analysis and retrieval.

## 🏗️ Architecture Overview

The project follows a **Tauri v2** hybrid architecture:

*   **Frontend (UI Layer):** React 19, TypeScript, Tailwind CSS, D3.js.
    *   Responsible for Visualization (`DataView`, `NeuroVis`) and User Interaction.
*   **Backend (Kernel Layer):** Rust.
    *   **Cortex Core:** HTML parsing, DOM-to-Arrow conversion (Polars).
    *   **Cortex Memory:** Local Vector Store (LanceDB) & Embeddings (`fastembed`).
    *   **NeuroRust:** Thermodynamic Neural Network Engine (Custom Arrow Kernel).

## 🚀 Development Status

| Module | Status | Technology Stack |
| :--- | :--- | :--- |
| **UI Shell** | ✅ Complete | React, Tailwind, Framer Motion |
| **Data Visualization** | ✅ Complete | D3.js, HTML5 Canvas |
| **Agent Simulation** | ✅ Complete | Deterministic State Machine (Mock) |
| **Rust Kernel** | 📝 Spec Ready | `polars`, `scraper`, `tokio` |
| **Vector Engine** | 📝 Spec Ready | `lancedb`, `arrow-array` |
| **Neuro Physics** | 📝 Spec Ready | `rayon`, `rand_distr` |

## 🛠️ Setup for Rust Implementation

To build the actual backend, move this codebase to a local environment with Rust installed.

1.  **Install Prerequisites:**
    *   Rust (latest stable): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
    *   Node.js (v18+) & pnpm
    *   Tauri CLI: `cargo install tauri-cli`

2.  **Initialize Rust Backend:**
    ```bash
    npm install
    npm run tauri init
    ```

3.  **Implement Specs:**
    Refer to `docs/RUST_KERNEL_SPEC.md` for crate dependencies and struct definitions.

## 📚 Documentation

*   [System Architecture & IPC Protocols](docs/ARCHITECTURE.md)
*   [Rust Kernel Specification](docs/RUST_KERNEL_SPEC.md)
*   [NeuroRust: Thermodynamic Engine Theory](docs/NEURORUST_WHITE_PAPER.md)

## ⚖️ License

MIT
