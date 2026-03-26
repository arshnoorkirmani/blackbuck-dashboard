import { NextResponse } from 'next/server';
import { auth } from '@/auth'; 
import dbConnect from '@/lib/mongodb';
import Disposition from '@/lib/models/Disposition';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized operation" }, { status: 401 });
    }

    await dbConnect();

    const data = await req.json();
    
    // Inject agent security boundary dynamically leveraging session payloads instead of trusting client
    const authenticatedRecord = {
      ...data,
      agentEmail: session.user.email
    };

    const record = await Disposition.create(authenticatedRecord);

    return NextResponse.json({ success: true, id: record._id }, { status: 201 });
  } catch (error: any) {
    console.error("Disposition Post Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
