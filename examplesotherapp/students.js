/**
 * worlds/students.js
 * THE STUDENT BODY (Hemisphere B)
 * Pure Content. No Shell.
 */

// 1. MANIFEST REALITY
export const Manifest = async (bridge, params) => {

    // A. BRIDGE THE GAP (Fetch Data)
    const students = await bridge.query('Student', 'findMany', {
        include: {
            user: true,
            varkProfile: true
        },
        take: 20
    });

    // B. TRANSMUTE DATA TO MATTER
    const tableRows = students.map(s => {
        // DEFENSIVE PHYSICS: Handle missing data (Vacuum)
        const gpa = s.academicGPA !== undefined ? s.academicGPA : 0.0;
        const balance = s.financialBalance !== undefined ? s.financialBalance : 0.0;
        const attendance = s.attendanceRate !== undefined ? s.attendanceRate : 100.0;
        const email = s.user && s.user.email ? s.user.email : 'unknown@void.com';

        return {
            id: s.referralCode || 'VOID',
            name: email.split('@')[0],
            gpa: Number(gpa).toFixed(2),
            balance: `$${Number(balance).toFixed(2)}`,
            attendance: `${attendance}%`,
            archetype: getDominantVark(s.varkProfile),
            // --- THE LINK (Wormhole to Cortex) ---
            action: `<a href="/?q=node_detail&id=${s.referralCode}" 
                        style="color:var(--energy); text-decoration:none; font-weight:bold; font-size:0.8rem;">
                        ⚡ ACCESS NODE
                     </a>`
        };
    });

    // C. CALCULATE AGGREGATE COGNITION (For the Radar)
    const count = students.length || 1;
    const avgVark = students.reduce((acc, s) => {
        const p = s.varkProfile || { visual: 0, aural: 0, readWrite: 0, kinesthetic: 0 };
        acc.visual += (p.visual || 0);
        acc.aural += (p.aural || 0);
        acc.read += (p.readWrite || 0);
        acc.kin += (p.kinesthetic || 0);
        return acc;
    }, { visual: 0, aural: 0, read: 0, kin: 0 });

    const radarData = [
        { label: 'VISUAL', value: Math.round((avgVark.visual / count) * 100) },
        { label: 'AURAL', value: Math.round((avgVark.aural / count) * 100) },
        { label: 'READING', value: Math.round((avgVark.read / count) * 100) },
        { label: 'KINETIC', value: Math.round((avgVark.kin / count) * 100) }
    ];

    // D. NUCLEATE ATOMS (Direct Return)
    return [
        // ROW 1: COGNITIVE OVERVIEW
        {
            type: 'Row',
            physics: { mass: 0.4, gap: 20 },
            children: [
                {
                    type: 'Card',
                    data: 'Cohort Cognitive Profile',
                    physics: { mass: 1, density: 'dense' },
                    children: [
                        {
                            type: 'RadarChart',
                            data: {
                                label: 'VARK Aggregate',
                                metrics: radarData
                            },
                            physics: { temperature: 'warm' }
                        }
                    ]
                },
                {
                    type: 'Card',
                    data: 'Enrollment Stats',
                    physics: { mass: 1, density: 'dense' },
                    children: [
                        { type: 'Stat', data: { label: 'Total Students', value: `${count}` } },
                        { type: 'Stat', data: { label: 'Avg GPA', value: '3.4', trend: '+0.2' }, physics: { temperature: 'hot' } }
                    ]
                }
            ]
        },

        // ROW 2: THE ROSTER
        {
            type: 'Card',
            data: 'Active Matrix',
            physics: { mass: 1.0, density: 'solid' },
            children: [
                {
                    type: 'Table',
                    data: {
                        headers: ['ID', 'NAME', 'GPA', 'BALANCE', 'ATTENDANCE', 'ARCHETYPE', 'ACTION'],
                        rows: tableRows
                    },
                    physics: { density: 'dense' }
                }
            ]
        }
    ];
};

// Helper: Determine learning style
function getDominantVark(profile) {
    if (!profile) return 'N/A';
    const map = {
        'Visual': profile.visual || 0,
        'Aural': profile.aural || 0,
        'Read': profile.readWrite || 0,
        'Kinetic': profile.kinesthetic || 0
    };
    return Object.keys(map).reduce((a, b) => map[a] > map[b] ? a : b);
}