import { NextRequest, NextResponse } from 'next/server';

import { auth } from "@/lib/auth";
import { getSheetData } from '@/lib/google';

export async function POST(req: NextRequest) {
    try {

        const session = await auth();
        console.log("[fetch-sheet] session:", JSON.stringify(session, null, 2));

        if (!session) {
            return NextResponse.json({ error: 'No session found. Please sign in.' }, { status: 401 });
        }
        if (!session.accessToken) {
            return NextResponse.json({ error: 'Session exists but no accessToken. Try signing out and back in.', sessionKeys: Object.keys(session) }, { status: 401 });
        }

        const body = await req.json();
        const { url, tab } = body;

        if (!url || typeof url !== 'string' || !url.includes('docs.google.com/spreadsheets')) {
            return NextResponse.json({ error: 'Invalid Google Sheet URL provided.' }, { status: 400 });
        }

        // Extract sheet ID from url
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const sheetId = match ? match[1] : null;

        if (!sheetId) {
            return NextResponse.json({ error: 'Could not extract Sheet ID from URL.' }, { status: 400 });
        }

        const parsedData = await getSheetData(session.accessToken, sheetId, tab ?? undefined);

        return NextResponse.json({ success: true, data: parsedData });

    } catch (error: any) {
        console.error("Detailed API Error:", error);

        return NextResponse.json(
            {
                error: error.message || "Unknown error occurred",
                details: error.toString()
            },
            { status: 500 }
        );
    }
}