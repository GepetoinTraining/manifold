/**
 * manifold/matter/primitives/organism/threedee.js
 * THE PROJECTION ENGINE (Isotope 109)
 * Unified 3D Functional: Geometry → Transform → Manifestation
 */
import { Text } from '../atomic/text.js';

// --- CORE 3D PROJECTION FUNCTIONAL ---
const ThreeDee = {
    /**
     * Projects 3D geometry into CSS transform space
     * @param {Array} vertices - [{x, y, z}, ...]
     * @param {Array} faces - [[v1, v2, v3], ...] indices into vertices
     * @param {Object} rotation - {x, y, z} degrees
     * @param {Object} physics - {temperature, mass, etc}
     */
    project: (vertices, faces, rotation, physics) => {
        const temperature = physics?.temperature || 'warm';
        const mass = physics?.mass ?? 1.0;

        // PHYSICS → COLOR
        const colorMap = {
            cold: '#3b82f6',
            warm: '#4ade80',
            hot: '#f59e0b',
            critical: '#ef4444',
            fusion: '#8b5cf6'
        };
        const color = colorMap[temperature];

        // MASS → SCALE
        const scale = 0.5 + (mass * 0.5);

        // VERTICES → HTML
        const points = vertices.map((v, i) => {
            const size = 4 + (v.z + 50) / 20; // Perspective scaling
            return `
            <div style="
                position: absolute;
                left: 50%; top: 50%;
                width: ${size * scale}px; 
                height: ${size * scale}px;
                background: ${color};
                border-radius: 50%;
                transform: translate3d(${v.x * 2}px, ${v.y * 2}px, ${v.z * 2}px);
                box-shadow: 0 0 ${size * 2}px ${color};
                opacity: 0.8;
            "></div>`;
        }).join('');

        // FACES → HTML (if topology provided)
        const faceElements = faces.map(f => {
            const [v1, v2, v3] = f.map(i => vertices[i]);
            // Calculate face center and normal for CSS positioning
            const cx = (v1.x + v2.x + v3.x) / 3;
            const cy = (v1.y + v2.y + v3.y) / 3;
            const cz = (v1.z + v2.z + v3.z) / 3;

            return `
            <div style="
                position: absolute;
                width: 100px; height: 100px;
                background: ${color};
                opacity: 0.1;
                border: 1px solid ${color};
                transform: translate3d(${cx}px, ${cy}px, ${cz}px);
            "></div>`;
        }).join('');

        return { points, faces: faceElements, color };
    },

    // --- GEOMETRY GENERATORS ---
    geometries: {
        scatter: (count, bounds) => {
            const vertices = Array.from({ length: count }, () => ({
                x: Math.random() * bounds - bounds / 2,
                y: Math.random() * bounds - bounds / 2,
                z: Math.random() * bounds - bounds / 2
            }));
            return { vertices, faces: [] };
        },

        cube: (size) => {
            const s = size / 2;
            const vertices = [
                { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s },
                { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
                { x: -s, y: -s, z: s }, { x: s, y: -s, z: s },
                { x: s, y: s, z: s }, { x: -s, y: s, z: s }
            ];
            const faces = [
                [0, 1, 2, 3], [4, 5, 6, 7], // front/back
                [0, 1, 5, 4], [2, 3, 7, 6], // top/bottom
                [0, 3, 7, 4], [1, 2, 6, 5]  // left/right
            ];
            return { vertices, faces };
        },

        pyramid: (base, height) => {
            const b = base / 2;
            const vertices = [
                { x: -b, y: 0, z: -b }, { x: b, y: 0, z: -b },
                { x: b, y: 0, z: b }, { x: -b, y: 0, z: b },
                { x: 0, y: -height, z: 0 } // apex
            ];
            const faces = [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [0, 1, 2, 3]];
            return { vertices, faces };
        },

        prism: (sides, radius, height) => {
            const vertices = [];
            const angleStep = (Math.PI * 2) / sides;

            // Bottom ring
            for (let i = 0; i < sides; i++) {
                vertices.push({
                    x: Math.cos(i * angleStep) * radius,
                    y: height / 2,
                    z: Math.sin(i * angleStep) * radius
                });
            }
            // Top ring
            for (let i = 0; i < sides; i++) {
                vertices.push({
                    x: Math.cos(i * angleStep) * radius,
                    y: -height / 2,
                    z: Math.sin(i * angleStep) * radius
                });
            }

            const faces = [];
            for (let i = 0; i < sides; i++) {
                const next = (i + 1) % sides;
                faces.push([i, next, next + sides, i + sides]);
            }
            return { vertices, faces };
        },

        sphere: (radius, segments) => {
            const vertices = [];
            for (let lat = 0; lat <= segments; lat++) {
                const theta = (lat * Math.PI) / segments;
                for (let lon = 0; lon <= segments; lon++) {
                    const phi = (lon * 2 * Math.PI) / segments;
                    vertices.push({
                        x: radius * Math.sin(theta) * Math.cos(phi),
                        y: radius * Math.cos(theta),
                        z: radius * Math.sin(theta) * Math.sin(phi)
                    });
                }
            }
            return { vertices, faces: [] };
        },

        surface: (size, waveFn) => {
            const vertices = [];
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const z = waveFn(x, y);
                    vertices.push({
                        x: (x - size / 2) * 20,
                        y: (y - size / 2) * 20,
                        z: z
                    });
                }
            }
            return { vertices, faces: [] };
        }
    }
};

// --- UNIFIED 3D COMPONENT ---
export const ThreeD = {
    type: 'ThreeD',
    isotope: 109,
    material: 'organism',

    render: (data, id, tensorOrEntropy, children, legacyPhysics) => {
        const isTensor = tensorOrEntropy?.css !== undefined;
        const tensor = isTensor ? tensorOrEntropy : null;
        const entropy = isTensor ? tensor.entropy : (tensorOrEntropy || 0);
        const physics = tensor?.physics || legacyPhysics || {};

        // EXTRACT CONFIGURATION
        const geometry = data?.geometry || 'scatter';
        const label = data?.label || '3D Space';
        const rotation = data?.rotation || { x: 20, y: 0, z: 0 };
        const animationSpeed = data?.animationSpeed || 20;

        // GENERATE GEOMETRY
        let geo;
        switch (geometry) {
            case 'scatter':
                const points = data?.points || null;
                geo = points ? { vertices: points, faces: [] } :
                    ThreeDee.geometries.scatter(data?.count || 30, data?.bounds || 100);
                break;
            case 'cube':
                geo = ThreeDee.geometries.cube(data?.size || 100);
                break;
            case 'pyramid':
                geo = ThreeDee.geometries.pyramid(data?.base || 100, data?.height || 100);
                break;
            case 'prism':
                geo = ThreeDee.geometries.prism(data?.sides || 6, data?.radius || 60, data?.height || 120);
                break;
            case 'sphere':
                geo = ThreeDee.geometries.sphere(data?.radius || 60, data?.segments || 8);
                break;
            case 'surface':
                const waveFn = data?.waveFn || ((x, y) => Math.sin(x * 0.5) * Math.cos(y * 0.5) * 20 + 20);
                geo = ThreeDee.geometries.surface(data?.size || 10, waveFn);
                break;
            default:
                geo = ThreeDee.geometries.scatter(30, 100);
        }

        // PROJECT GEOMETRY
        const projection = ThreeDee.project(geo.vertices, geo.faces, rotation, physics);

        const baseStyle = tensor?.css || `
            width: 100%; 
            height: 300px; 
            perspective: 800px; 
            overflow: hidden; 
            display: flex; 
            flex-direction: column; 
            align-items: center;
        `;

        return `
        <div style="${baseStyle}">
            ${Text.render(label, null, tensor || 'h3')}
            <div style="
                position: relative; 
                width: 200px; height: 200px;
                transform-style: preserve-3d;
                animation: rotate3d_${id} ${animationSpeed}s infinite linear;
                top: 40px;
            ">
                <!-- Axis guides -->
                <div style="position: absolute; width: 200px; height: 1px; background: rgba(255,255,255,0.1); top: 100px;"></div>
                <div style="position: absolute; width: 1px; height: 200px; background: rgba(255,255,255,0.1); left: 100px;"></div>
                <div style="position: absolute; width: 1px; height: 200px; background: rgba(255,255,255,0.1); left: 100px; transform: rotateX(90deg);"></div>
                
                ${projection.points}
                ${projection.faces}
            </div>
            <style>
                @keyframes rotate3d_${id} { 
                    from { transform: rotateY(0deg) rotateX(${rotation.x}deg); } 
                    to { transform: rotateY(360deg) rotateX(${rotation.x}deg); } 
                }
            </style>
        </div>
        `;
    }
};