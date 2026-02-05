/**
 * worlds/kanban3d.js
 * THE PROJECT TOPOLOGY MANIFEST
 * Groups cards → cubes (6 each) → lanes → 3D board
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load raw card data
const mockData = JSON.parse(
    readFileSync(join(__dirname, '../data/mockdata/kanban3d_data.json'), 'utf-8')
);

export const world = {
    id: 'kanban3d',
    title: 'Project Topology (3D)',
    intent: 'workspace',
};

/**
 * Group cards into cubes of 6
 */
function groupIntoCubes(cards) {
    const cubes = [];
    for (let i = 0; i < cards.length; i += 6) {
        cubes.push({
            type: 'KanbanCube3D',
            data: {
                cards: cards.slice(i, i + 6) // Take 6 cards
            }
        });
    }
    return cubes;
}

/**
 * Build lane with cubes as children
 */
function buildLane(laneData) {
    // Group cards into cubes
    const cubes = groupIntoCubes(laneData.cards || []);

    return {
        type: 'KanbanLane3D',
        data: {
            title: laneData.title,
            variant: laneData.variant
        },
        children: cubes  // Cubes bond to lane
    };
}

export const Manifest = async (bridge, params) => {
    // Get lanes from mock data
    const lanes = mockData.lanes || [];

    // Build field structure: lanes with cubes as children
    const laneFields = lanes.map(lane => buildLane(lane));

    // Top-level organism with lanes as children
    return [{
        type: 'Kanban3D',
        data: {
            title: 'Φ PROJECT TOPOLOGY',
            camera: mockData.camera,
            controls: mockData.controls
        },
        children: laneFields  // Lanes bond to board
    }];
};

export default world;