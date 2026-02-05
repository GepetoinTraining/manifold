/**
 * manifold/matter/primitives/organism/thought.js
 * THE QUANTUM PARTICLE v2.1
 * Features: Notepad Integration
 */
import { Shape } from '../atomic/shape.js';
import { Notepad } from '../molecular/notepad.js';

export const Thought = {
    type: 'Thought',
    material: 'organism',

    render: (data, id, entropy, children, physics) => {
        // Data extraction
        const { label, shape, x, y, color, selected, note } = data;
        const mass = physics?.mass || 1.0;

        // Position Logic
        const cssLeft = 50 + parseFloat(x || 0);
        const cssTop = 50 - parseFloat(y || 0);

        // Sanitize note for passing into inline JS
        const safeNote = note ? note.replace(/'/g, "\\'").replace(/\n/g, '\\n') : '';

        return `
        <div 
            id="${id}"
            class="quantum-node"
            style="
                position: absolute; 
                left: ${cssLeft}%; top: ${cssTop}%; 
                transform: translate(-50%, -50%);
                z-index: 10;
                cursor: grab;
                transition: box-shadow 0.2s, opacity 0.2s, filter 0.2s; 
            "
            draggable="true"
            onmousedown="this.style.zIndex = 100; emitEvent('${id}', 'select_node');"
            ondragstart="handleNodeDragStart(event, '${id}')"
            ondragend="handleNodeDragEnd(event, '${id}')"
        >
            ${Shape.render(
            { label, variant: shape || 'circle' },
            `${id}_shape`,
            entropy,
            null,
            {
                mass,
                color: color || '#fff',
                temperature: selected ? 'critical' : 'cold'
            }
        )}
            
            <div 
                onclick="window.spawn_notepad('${id}', { x:${x}, y:${y}, note: '${safeNote}' })"
                style="
                    position: absolute; top: -10px; right: -10px;
                    width: 24px; height: 24px;
                    background: #0f172a; border: 1px solid ${color || '#fff'};
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.8rem; cursor: pointer;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                    z-index: 20;
                    transition: transform 0.2s;
                "
                onmouseover="this.style.transform='scale(1.2)'"
                onmouseout="this.style.transform='scale(1.0)'"
                title="Edit Note"
            >
                📝
            </div>
            
            ${note ? `<div style="
                position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
                width: 6px; height: 6px; background: ${color || 'var(--energy)'}; border-radius: 50%;
                box-shadow: 0 0 8px ${color || 'var(--energy)'};
            "></div>` : ''}
        </div>
        `;
    }
};