/**
 * worlds/flow.js
 * THE FLOW HUD
 * A Tactile Input Surface for Teachers.
 */

export const Manifest = async (bridge, params) => {
    // 1. Identify the Class (Context)
    // For now, we assume a default "Current Class" or fetch from schedule
    const context = "Quantum Physics 101";

    // 2. The Input Matrix
    // Large, touch-friendly buttons that trigger immediate mutations
    return [
        {
            type: 'Text',
            data: context,
            variant: 'h3',
            physics: { mass: 0.1 }
        },
        {
            type: 'Text',
            data: 'Observe & Log',
            variant: 'p',
            physics: { mass: 0.1, density: 'gas' }
        },
        {
            id: 'flow_grid',
            type: 'Row',
            physics: {
                mass: 1,
                // Custom grid physics for mobile layout
                style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 60vh;'
            },
            children: [
                {
                    type: 'Button',
                    data: {
                        label: '😰 ANXIETY',
                        // Directly calls the log command
                        action: `emitCommand('log_flow', { score: 1, state: 'ANXIETY' })`
                    },
                    physics: { mass: 1, density: 'solid', temperature: 'critical' } // Red
                },
                {
                    type: 'Button',
                    data: {
                        label: '🥱 BOREDOM',
                        action: `emitCommand('log_flow', { score: 3, state: 'BOREDOM' })`
                    },
                    physics: { mass: 1, density: 'solid', temperature: 'cold' } // Blue
                },
                {
                    type: 'Button',
                    data: {
                        label: '🌊 FLOW',
                        action: `emitCommand('log_flow', { score: 10, state: 'FLOW' })`
                    },
                    physics: { mass: 2, density: 'energy', temperature: 'warm' }, // Green/Gold, Span 2 cols?
                    // Override styling to span full width
                    dimensions: { width: '200%' }
                }
            ]
        }
    ];
};