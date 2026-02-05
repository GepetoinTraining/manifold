/**
 * worlds/gallery3.js
 * THE OBSERVATORY
 * Temporal systems, data visualization, 3D projection, and hyperdimensional collapse
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load mock data synchronously
const mockData = JSON.parse(
    readFileSync(join(__dirname, '../data/mockdata/gallery3_data.json'), 'utf-8')
);

export const world = {
    id: 'gallery3',
    title: 'Observatory',
    intent: 'laboratory',
};

export const Manifest = async (bridge, params) => {
    return [{
        type: 'Gallery3',
        data: {
            title: 'Φ OBSERVATORY',
            subtitle: 'Temporal physics, data projection, 3D transforms, and dimensional collapse',
            mockData: mockData
        },
        intent: 'laboratory'
    }];
};

export default world;