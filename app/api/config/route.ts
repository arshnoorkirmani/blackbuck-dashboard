import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import UserConfig from '@/lib/models/UserConfig';
import { DEFAULT_CONFIG } from '@/lib/services/config.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await auth();
    // Default config acts as graceful fallback before an Admin syncs their preferences
    if (!session?.user?.email) return NextResponse.json({ config: DEFAULT_CONFIG }, { status: 200 });

    await dbConnect();
    const record = await UserConfig.findOne({ email: session.user.email });

    if (record && record.config) {
      return NextResponse.json({ config: record.config }, { status: 200 });
    }
    return NextResponse.json({ config: DEFAULT_CONFIG }, { status: 200 });
  } catch (error: any) {
    console.error("Config GET Error:", error);
    return NextResponse.json({ config: DEFAULT_CONFIG }, { status: 200 }); // Graceful failure yielding form interactivity irrespective of DB drops
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { config } = await req.json();

    const record = await UserConfig.findOneAndUpdate(
      { email: session.user.email },
      { config },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, config: record.config }, { status: 200 });
  } catch (error: any) {
    console.error("Config POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
