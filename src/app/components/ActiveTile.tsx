'use client';

import { ActiveDto } from "@/types/active";
import { useEffect, useState } from 'react';

const MAX_PLOTS = 150_000
export default function ActiveTile() {
    const [activeLatest, setActiveLatest] = useState<ActiveDto | null>(null);

    useEffect(() => {
        fetch('/api/active/latest')
            .then(res => res.json())
            .then(setActiveLatest)
            .catch(console.error);
    }, []);

    return (
        <>
            <div className="card bg-base-100 shadow-md p-4">
                <h2 className="text-lg font-bold mb-2">Active Data Latest</h2>
                <ul className="list-disc list-inside">
                    <li>{((activeLatest?.activeBasedOnPp ?? 0) / MAX_PLOTS * 100).toFixed(1)}%</li>

                </ul>
            </div>
        </>
    );
}
