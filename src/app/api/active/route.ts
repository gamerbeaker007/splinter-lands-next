import {getAllActiveData} from "@/lib/api/internal/active_data";
import {NextResponse} from "next/server";
import {toActiveDtoList} from "@/lib/mappers/activeMapper";

export async function GET() {
    try {
        const data = await getAllActiveData();
        const dto = toActiveDtoList(data);
        return NextResponse.json(dto, { status: 200 });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to load data' }, { status: 501 });
    }
}
