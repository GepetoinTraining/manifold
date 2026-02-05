import { ATOMS } from '../atoms.js';

// We don't have a specific atom for SchoolShell yet, so we construct it from primitives.
// Or we assume 'SchoolShell' is a known type in the frontend renderer.
// Based on app.js, it seems to be a container type.

export const SchoolShell = ({ user, activeTab, content }) => {
    // 1. TOPOLOGY DEFINITION
    const SideMap = {
        title: 'EcOS ADMIN',
        links: [
            { label: 'Dashboard', href: '/?q=dashboard', icon: '⚡', active: activeTab === 'Dashboard' },
            { label: 'Physics Lab', href: '/?q=lab', icon: '⚛️', active: activeTab === 'Physics Lab' },
            { label: 'Students', href: '/?q=students', icon: '🎓', active: activeTab === 'Students' },
            { label: 'Faculty', href: '/?q=faculty', icon: '🍎', active: activeTab === 'Faculty' },
            { label: 'Finance', href: '/?q=finance', icon: '💰', active: activeTab === 'Finance' },
            { label: 'God Mode', href: '/?q=admin', icon: '⚙️', active: activeTab === 'Admin' }
        ]
    };

    const TopMap = {
        brand: 'EcOS KERNEL v5.1',
        links: [
            { label: 'Docs', href: '/?q=docs' },
            { label: 'Logout', href: '/?q=login' }
        ]
    };

    // 2. ATOMIC CONSTRUCTION
    // We return the raw atom structure expected by the renderer.
    return {
        type: 'SchoolShell',
        data: {
            sidebar: SideMap,
            header: TopMap,
            user: user
        },
        children: Array.isArray(content) ? content : [content]
    };
};
