# Cortex System Architecture

## 1. High-Level Design

Cortex adopts a **"Sidecar Pattern"** where the Rust backend acts as a local database server and computation engine, while the Frontend acts as a visualization layer.

```mermaid
graph TD
    User[User Interaction] --> UI[React Frontend]
    
    subgraph "Application Layer (Tauri)"
        UI -- JSON Commands --> IPC[Tauri IPC Bridge]
        IPC -- Arrow Bytes (Zero-Copy) --> UI
    end
    
    subgraph "Cortex Kernel (Rust)"
        IPC --> Router[Command Router]
        
        Router --> Engine[Cortex Engine (Polars)]
        Router --> Memory[Memory Store (LanceDB)]
        Router --> Neuro[NeuroRust (Physics Sim)]
        
        Engine -- HTTP/DOM --> Web[The Internet]
        Memory -- Vector Search --> Disk[Local Storage ./data]
    end
```

## 2. Data Flow Protocols

### A. Web Ingestion (Browsing)
1.  **Trigger:** User navigates to a URL.
2.  **Rust:** `reqwest` fetches HTML -> `scraper` parses DOM -> `polars` creates `DataFrame`.
3.  **Mutation:** Data is appended to `ActiveTab_Table` (Arrow InMemory).
4.  **IPC:** Rust sends `IPC::UpdateView` to Frontend with binary Arrow stream.

### B. Agent Action (The "Loop")
1.  **Trigger:** Frontend emits `AGENT_ACTION` (e.g., "Upvote").
2.  **Rust:** 
    *   LLM (Phi-3/Llama-3 via `candle`) analyzes current DataFrame.
    *   Generates `ShadowDOM` events.
3.  **Feedback:** State mutation in DataFrame (e.g., `points += 1`).

### C. Neuro Simulation
1.  **Trigger:** User activates `ViewMode::NEURO`.
2.  **Rust:** `NeuroRust` engine runs physics step (Metropolis-Hastings).
3.  **IPC:** Streams `NeuroState` (SoA Layout) to frontend `Float32Array` for Canvas rendering.

## 3. IPC Command Interface

The Rust backend must implement the following Tauri commands:

```rust
// src-tauri/src/main.rs

#[tauri::command]
fn navigate(url: String) -> Result<Vec<u8>, String>; // Returns Arrow IPC Buffer

#[tauri::command]
fn query_memory(query: String) -> Result<Vec<SearchResult>, String>;

#[tauri::command]
fn agent_act(intent: String, context_id: u32) -> Result<AgentLog, String>;

#[tauri::command]
fn neuro_step(temp: f32) -> Result<NeuroStateDTO, String>;
```
