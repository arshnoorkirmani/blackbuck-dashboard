import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSheetTabs } from '@/lib/google';

/** GET /api/fetch-sheet-tabs?url=... — used by the Settings page */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated. Please sign in.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url') ?? '';

    if (!url || !url.includes('docs.google.com/spreadsheets')) {
      return NextResponse.json({ error: 'Invalid or missing Google Sheet URL.' }, { status: 400 });
    }

    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match?.[1] ?? null;
    if (!sheetId) {
      return NextResponse.json({ error: 'Could not extract Sheet ID from URL.' }, { status: 400 });
    }

    const tabs = await getSheetTabs(session.accessToken, sheetId);
    return NextResponse.json({ success: true, tabs });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[fetch-sheet-tabs GET] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST /api/fetch-sheet-tabs — body: { url } */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'No session found. Please sign in.' }, { status: 401 });
        }
        if (!session.accessToken) {
            return NextResponse.json({ error: 'Session exists but no accessToken. Try signing out and back in.' }, { status: 401 });
        }

        const { url } = await req.json();

        if (!url || typeof url !== 'string' || !url.includes('docs.google.com/spreadsheets')) {
            return NextResponse.json({ error: 'Invalid Google Sheet URL.' }, { status: 400 });
        }

        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const sheetId = match?.[1] ?? null;

        if (!sheetId) {
            return NextResponse.json({ error: 'Could not extract Sheet ID from URL.' }, { status: 400 });
        }

        const tabs = await getSheetTabs(session.accessToken, sheetId);

        return NextResponse.json({ success: true, tabs });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('[fetch-sheet-tabs] Error:', error);
        return NextResponse.json(
            { error: msg },
            { status: 500 }
        );
    }
}
