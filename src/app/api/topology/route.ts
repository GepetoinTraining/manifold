import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isValidTopology, type Topology } from "@/lib/manifold/topology";

// In-memory storage for v1 (replace with Vercel KV in production)
const topologies = new Map<string, {
    id: string;
    userId: string;
    name: string;
    topology: Topology;
    createdAt: string;
    updatedAt: string;
}>();

export async function GET(request: NextRequest) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const userTopologies = Array.from(topologies.values())
        .filter((t) => t.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ topologies: userTopologies });
}

export async function POST(request: NextRequest) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    try {
        const { name, topology } = await request.json();

        if (!isValidTopology(topology)) {
            return NextResponse.json({ error: "Invalid topology" }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const record = {
            id,
            userId,
            name: name || `Topology ${topologies.size + 1}`,
            topology,
            createdAt: now,
            updatedAt: now,
        };

        topologies.set(id, record);

        return NextResponse.json({ topology: record });
    } catch (error) {
        console.error("Topology POST error:", error);
        return NextResponse.json({ error: "Failed to save topology" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const record = topologies.get(id);
    if (!record || record.userId !== userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    topologies.delete(id);

    return NextResponse.json({ success: true });
}
