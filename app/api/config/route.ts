import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import UserConfig from '@/lib/models/UserConfig';
import { DEFAULT_CONFIG } from '@/lib/services/config.service';
import { DEFAULT_DASHBOARD_CONFIG } from '@/lib/types/dashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    const session = await auth();

    if (type === 'dashboard') {
      // Dashboard config is global (not per-user) — stored on a sentinel document
      await dbConnect();
      const record = await UserConfig.findOne({ email: '__dashboard__' });
      const dashboardConfig = record?.config ?? DEFAULT_DASHBOARD_CONFIG;
      return NextResponse.json({ dashboardConfig }, { status: 200 });
    }

    // Default: form config (per-user)
    if (!session?.user?.email) {
      return NextResponse.json({ config: DEFAULT_CONFIG }, { status: 200 });
    }

    await dbConnect();
    const record = await UserConfig.findOne({ email: session.user.email });

    if (record?.config) {
      return NextResponse.json({ config: record.config }, { status: 200 });
    }
    return NextResponse.json({ config: DEFAULT_CONFIG }, { status: 200 });
  } catch (error: unknown) {
    console.error("Config GET Error:", error);
    if (type === 'dashboard') {
      return NextResponse.json({ dashboardConfig: DEFAULT_DASHBOARD_CONFIG }, { status: 200 });
    }
    return NextResponse.json({ config: DEFAULT_CONFIG }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    if (body.type === 'dashboard') {
      // Role guard: Only admins can modify the global dashboard configuration
      if (session.role !== 'ADMIN') {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }

      const record = await UserConfig.findOneAndUpdate(
        { email: '__dashboard__' },
        { config: body.dashboardConfig },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json({ success: true, dashboardConfig: record.config }, { status: 200 });
    }

    // Default: form config
    const { config } = body;
    const record = await UserConfig.findOneAndUpdate(
      { email: session.user.email },
      { config },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, config: record.config }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Config POST Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
