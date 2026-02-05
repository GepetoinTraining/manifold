/**
 * worlds/kanban3d_gallery.js
 * THE PROJECT TOPOLOGY (Gallery3 Version)
 * 
 * Alternative version that uses Gallery3 as the container
 * and embeds Kanban3D as a featured component
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load mock data synchronously
const mockData = JSON.parse(
    readFileSync(join(__dirname, '../data/mockdata/kanban3d_data.json'), 'utf-8')
);

export const world = {
    id: 'kanban3d_gallery',
    title: 'Project Topology Gallery',
    intent: 'laboratory',
};

export const Manifest = async (bridge, params) => {
    // Prepare Gallery3 sections with Kanban3D as hero component
    const galleryData = {
        title: 'Φ PROJECT TOPOLOGY',
        subtitle: '3D Kanban board - workflow physics in spatial dimensions',

        sections: [
            {
                title: 'Live Project Board',
                description: 'Real-time 3D visualization of workflow topology',
                featured: true,
                component: {
                    type: 'Kanban3D',
                    data: {
                        variant: mockData.variant,
                        camera: mockData.camera,
                        controls: mockData.controls,
                        lanes: mockData.lanes
                    }
                }
            },
            {
                title: 'Board Statistics',
                description: 'Aggregate metrics across all lanes and cards',
                components: [
                    {
                        type: 'Stat',
                        data: {
                            label: 'Total Cards',
                            value: mockData.metadata.totalCards,
                            trend: '+6 this week',
                            variant: 'positive'
                        }
                    },
                    {
                        type: 'Stat',
                        data: {
                            label: 'Active Lanes',
                            value: mockData.metadata.totalLanes,
                            trend: 'stable',
                            variant: 'neutral'
                        }
                    },
                    {
                        type: 'Stat',
                        data: {
                            label: 'In Progress',
                            value: mockData.lanes.find(l => l.variant === 'inprogress')?.cards.length || 0,
                            trend: '+2 today',
                            variant: 'positive'
                        }
                    },
                    {
                        type: 'Stat',
                        data: {
                            label: 'Blocked',
                            value: mockData.lanes.find(l => l.variant === 'blocked')?.cards.length || 0,
                            trend: 'needs attention',
                            variant: 'negative'
                        }
                    }
                ]
            },
            {
                title: 'Velocity Trends',
                description: 'Workflow throughput over time',
                components: [
                    {
                        type: 'Chart',
                        data: {
                            title: 'Cards Completed',
                            type: 'line',
                            data: [
                                { label: 'Week 1', value: 3 },
                                { label: 'Week 2', value: 5 },
                                { label: 'Week 3', value: 4 },
                                { label: 'Week 4', value: 6 },
                            ],
                            variant: 'trending_up'
                        }
                    },
                    {
                        type: 'Trend',
                        data: {
                            label: 'Weekly Velocity',
                            current: 6,
                            previous: 4,
                            direction: 'rising',
                            variant: 'rising'
                        }
                    }
                ]
            },
            {
                title: 'Physics Properties',
                description: 'How visual topology emerges from physics',
                components: [
                    {
                        type: 'Card',
                        data: {
                            title: 'Mass → Size',
                            body: '<p>Cube size ranges from 0.6 (low priority) to 1.5 (urgent). Urgent tasks physically occupy more space in your visual field.</p>',
                            variant: 'outlined'
                        }
                    },
                    {
                        type: 'Card',
                        data: {
                            title: 'Temperature → Color',
                            body: '<p>Color intensity maps to thermal states: void (gray) → cold (blue) → warm (green) → hot (orange) → critical (red) → fusion (purple).</p>',
                            variant: 'outlined'
                        }
                    },
                    {
                        type: 'Card',
                        data: {
                            title: 'Density → Opacity',
                            body: '<p>Material opacity reflects state solidity: gas (0.5) → liquid (0.7) → solid (0.9) → dense (1.0). Ephemeral tasks are translucent.</p>',
                            variant: 'outlined'
                        }
                    },
                    {
                        type: 'Card',
                        data: {
                            title: 'Friction → Rotation',
                            body: '<p>Rotation damping indicates "stuckness". Blocked tasks have friction=2.0 and rotate slower, visually representing impedance.</p>',
                            variant: 'outlined'
                        }
                    }
                ]
            },
            {
                title: 'Lane States',
                description: 'Workflow phases with distinct physics profiles',
                components: [
                    {
                        type: 'Badge',
                        data: {
                            label: 'Backlog',
                            variant: 'info',
                            description: 'gas | mass: 0.5 | temp: void'
                        }
                    },
                    {
                        type: 'Badge',
                        data: {
                            label: 'To Do',
                            variant: 'info',
                            description: 'liquid | mass: 0.8 | temp: cold'
                        }
                    },
                    {
                        type: 'Badge',
                        data: {
                            label: 'In Progress',
                            variant: 'warning',
                            description: 'solid | mass: 1.2 | temp: hot'
                        }
                    },
                    {
                        type: 'Badge',
                        data: {
                            label: 'Review',
                            variant: 'success',
                            description: 'solid | mass: 1.0 | temp: warm'
                        }
                    },
                    {
                        type: 'Badge',
                        data: {
                            label: 'Done',
                            variant: 'premium',
                            description: 'dense | mass: 1.5 | temp: fusion'
                        }
                    },
                    {
                        type: 'Badge',
                        data: {
                            label: 'Blocked',
                            variant: 'danger',
                            description: 'solid | mass: 1.3 | temp: critical'
                        }
                    }
                ]
            }
        ]
    };

    return [{
        type: 'Gallery3',
        data: galleryData,
        intent: 'laboratory'
    }];
};

export default world;