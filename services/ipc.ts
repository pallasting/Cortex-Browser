
import { kernel } from './kernel';
import { ViewMode } from '../types';

// Simulating tauri's invoke function
// In a real app, this would be: import { invoke } from '@tauri-apps/api/core';

export const ipc = {
    async invoke(command: string, payload?: any): Promise<any> {
        // Simulate network latency
        // await new Promise(resolve => setTimeout(resolve, 50)); 

        switch (command) {
            case 'get_state':
                return kernel.getState();
            
            case 'restore_state':
                return kernel.restoreState();

            case 'navigate':
                kernel.navigate(payload.url, payload.title);
                return;

            case 'close_tab':
                kernel.closeTab(payload.id);
                return;
            
            case 'set_active_tab':
                kernel.setActiveTab(payload.id);
                return;
            
            case 'set_view_mode':
                kernel.setViewMode(payload.mode);
                return;

            case 'toggle_live_mode':
                kernel.toggleLiveMode();
                return;

            case 'run_gc':
                kernel.runGC();
                return;

            case 'agent_log':
                kernel.addLog(payload.level, payload.source, payload.message);
                return;

            case 'mutate_data':
                kernel.mutateDataFrame(payload.id, payload.col, payload.delta);
                return;
            
            case 'neuro_step':
                kernel.neuroStep();
                return;

            case 'update_neuro_config':
                kernel.updateNeuroConfig(payload.config);
                return;

            default:
                console.warn(`IPC: Unknown command ${command}`);
                return;
        }
    }
};
