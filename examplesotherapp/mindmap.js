/**
 * worlds/mindmap.js
 * THE ORACLE v2.1 (Hemisphere B)
 * Visualization of thoughts as nodes in infinite space.
 */

// 1. TOPOLOGY (Metadata for Reference)
export const Topology = {
    type: 'SchoolShell',
    data: {
        sidebar: {
            title: 'EcOS TOOLBOX',
            active: 'Mind Maps',
            links: [
                { label: 'Dashboard', href: '/?q=dashboard', icon: '⚡' },
                { label: 'Mind Maps', href: '/?q=mindmap', icon: '🧠' },
                { label: 'Physics Lab', href: '/?q=lab', icon: '⚛️' }
            ]
        },
        header: {
            brand: 'CEREBRAL INTERFACE',
            links: [{ label: '+ New Map', href: '/?q=mindmap' }]
        }
    },
    children: []
};

// 2. MANIFEST REALITY
export const Manifest = async (bridge, params) => {
    const userId = params.user?.id;
    const mapId = params.id;
    const viewMode = params.view;

    // A. FETCH DATA: The Library (Saved Maps)
    // We use the bridge to safely query the Genesis Engine
    const savedMaps = userId ? await bridge.query('MindMap', 'findMany', {
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        // select: { id: true, title: true } // Genesis v1 returns full objects
    }) : [];

    // Map to simplified list for the Sidebar
    const mapList = savedMaps.map(m => ({
        id: m.id,
        title: m.title
    }));

    // B. FETCH DATA: The Active Thought
    let activeMap = {
        mapId: '',
        title: 'Untitled Idea',
        activeColor: '#f59e0b',
        nodes: [{ x: 0, y: 0, label: 'Central Idea', shape: 'circle', mass: 1.5, color: '#0ea5e9' }],
        connections: []
    };

    if (mapId) {
        const loaded = await bridge.query('MindMap', 'findUnique', { where: { id: mapId } });
        if (loaded) {
            activeMap = {
                mapId: loaded.id,
                title: loaded.title,
                activeColor: '#f59e0b',
                nodes: loaded.nodes,
                connections: loaded.connections
            };
        }
    }

    // C. FETCH DATA: History (Conditional)
    let historyData = [];
    if (viewMode === 'history' && mapId) {
        console.log(`[WORLD] ⏳ Fetching temporal logs for ${mapId}`);
        const rawLogs = await bridge.query('SystemLog', 'findMany', {
            where: {
                source: 'MINDMAP_HISTORY',
                message: { contains: mapId } // Simple string match in Genesis
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        historyData = rawLogs.map(log => {
            try {
                const d = JSON.parse(log.message);
                return { action: d.action || 'UNKNOWN', timestamp: log.createdAt };
            } catch (e) {
                return { action: 'CORRUPTED_SIGNAL', timestamp: log.createdAt };
            }
        });
    }

    // 3. NUCLEATE ATOMS
    return [
        {
            id: 'mindmap_oracle',
            type: 'MindMap', // Isotope 89
            data: {
                activeMap: activeMap,
                savedMaps: mapList,
                history: historyData
            },
            physics: {
                mass: 1.0,
                density: 'void',
                height: '100%'
            }
        }
    ];
};