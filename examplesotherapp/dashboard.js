/**
 * worlds/dashboard.js
 * THE NEXUS (Hemisphere B)
 * Real-time Telemetry + Temporal Management + Task Injection.
 */
import { Calendar } from '../manifold/matter/primitives/organism/calendar.js'; //
import { Kanban } from '../manifold/matter/primitives/molecular/kanban.js'; //
import { TaskCreateModal } from '../manifold/matter/primitives/organism/task_create_modal.js';

export const Manifest = async (bridge, params) => {
    // 1. RESOLVE STATE
    const view = params.view || 'DASHBOARD'; // 'DASHBOARD' | 'CREATE_TASK'
    const targetDate = params.date || new Date().getDate(); // For the modal pre-fill

    // 2. FETCH REALITY
    // Tasks: Fetching last 20 active tasks
    const tasks = await bridge.query('Task', 'findMany', { take: 50 });
    const metrics = await bridge.query('Metric', 'findMany', { take: 3, orderBy: { timestamp: 'desc' } });

    // 3. NUCLEATE COMPONENTS

    // A. The Modal (Conditional Existence)
    const taskModal = {
        type: 'TaskCreateModal',
        data: {
            isOpen: view === 'CREATE_TASK',
            date: targetDate
        },
        physics: { mass: 0 } // Ether physics
    };

    // B. The Temporal Grid (Calendar)
    const calendar = {
        type: 'Card',
        data: 'Schedule',
        physics: { mass: 2, density: 'solid', flexGrow: 2 }, // Takes up 2/3 space
        children: [
            {
                type: 'Calendar',
                data: {
                    month: 'December',
                    year: 2025,
                    tasks: tasks // Inject tasks into the grid atoms
                },
                physics: { mass: 1 }
            }
        ]
    };

    // C. The Action List (Urgent Tasks)
    const taskList = {
        type: 'Card',
        data: 'Priority Queue',
        physics: { mass: 1, density: 'dense', flexGrow: 1 }, // Takes up 1/3 space
        children: [
            {
                type: 'List', //
                data: {
                    title: 'Upcoming',
                    // Map tasks to list items
                    items: tasks.slice(0, 10).map(t => `${t.title} [${t.status || 'PENDING'}]`)
                },
                physics: { mass: 1 }
            }
        ]
    };

    // D. Vital Signs
    const statsRow = {
        type: 'Row',
        physics: { mass: 0.5, gap: 20 },
        children: metrics.map(m => ({
            type: 'Card',
            physics: { density: 'dense', mass: 1 },
            children: [{ type: 'Stat', data: { label: m.name, value: `${m.value}${m.unit || ''}` } }] //
        }))
    };

    // 4. ASSEMBLY
    return [
        taskModal, // The Overlay (renders only if open)
        {
            type: 'Row',
            physics: { mass: 0.2, alignment: 'center' },
            children: [
                { type: 'Text', data: 'Command Center', variant: 'h1', physics: { mass: 1 } },
                {
                    type: 'Button',
                    // Triggering the modal via URL parameter state
                    data: { label: '+ NEW EVENT', href: '/?q=dashboard&view=CREATE_TASK' },
                    physics: { density: 'energy' }
                }
            ]
        },
        statsRow,
        {
            type: 'Row',
            physics: { mass: 3, gap: 20, height: '600px' }, // Main Workspace Split
            children: [
                calendar,
                taskList
            ]
        }
    ];
};