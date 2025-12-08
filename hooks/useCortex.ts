
import { useState, useEffect } from 'react';
import { kernel, KernelState } from '../services/kernel';
import { ipc } from '../services/ipc';
import { ViewMode, NeuroConfig } from '../types';

export const useCortex = () => {
    const [state, setState] = useState<KernelState>(kernel.getState());

    useEffect(() => {
        // Subscribe to kernel updates
        const unsubscribe = kernel.subscribe((newState) => {
            setState({ ...newState }); // Spread to trigger re-render
        });
        return unsubscribe;
    }, []);

    const actions = {
        restoreState: () => ipc.invoke('restore_state'),
        navigate: (url: string, title: string) => ipc.invoke('navigate', { url, title }),
        closeTab: (id: string) => ipc.invoke('close_tab', { id }),
        setActiveTab: (id: string) => ipc.invoke('set_active_tab', { id }),
        setViewMode: (mode: ViewMode) => ipc.invoke('set_view_mode', { mode }),
        toggleLiveMode: () => ipc.invoke('toggle_live_mode'),
        runGC: () => ipc.invoke('run_gc'),
        logAgent: (level: string, source: string, message: string) => ipc.invoke('agent_log', { level, source, message }),
        mutateData: (id: string | number, col: string, delta: number) => ipc.invoke('mutate_data', { id, col, delta }),
        neuroStep: () => ipc.invoke('neuro_step'),
        updateNeuroConfig: (config: Partial<NeuroConfig>) => ipc.invoke('update_neuro_config', { config }),
    };

    return { state, actions };
};
