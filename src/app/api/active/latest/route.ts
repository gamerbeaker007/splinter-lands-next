import {getLatestActiveEntry} from "@/lib/api/internal/active_data";
import {NextResponse} from "next/server";
import {toActiveDto} from "@/lib/mappers/activeMapper";

export async function GET() {
    try {
        const latest = await getLatestActiveEntry();
        if (!latest) return NextResponse.json({ error: 'No data found' }, { status: 404 });

        const dto = toActiveDto(latest);
        return NextResponse.json(dto);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to load latest data' }, { status: 501 });
    }
}
