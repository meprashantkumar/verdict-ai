import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Case from "@/models/Case";
import AIChat from "@/models/AIChat";
import { chatWithAI } from "@/lib/gemini";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const chat = await AIChat.findOne({ caseId: id, userId: session.user.id }).lean();
  return NextResponse.json(chat?.messages ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const caseDoc = await Case.findOne({ _id: id, userId: session.user.id }).populate(
    "clientId",
    "name"
  );
  if (!caseDoc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let chat = await AIChat.findOne({ caseId: id, userId: session.user.id });
  if (!chat) {
    chat = await AIChat.create({ caseId: id, userId: session.user.id, messages: [] });
  }

  const caseContext = `Case: ${caseDoc.title}\nType: ${caseDoc.caseType}\nClient: ${(caseDoc.clientId as { name: string }).name}\nDescription: ${caseDoc.description}`;
  const history = chat.messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "model",
    content: m.content,
  }));

  chat.messages.push({ role: "user", content: message, timestamp: new Date() });
  const aiReply = await chatWithAI([...history, { role: "user", content: message }], caseContext);
  chat.messages.push({ role: "assistant", content: aiReply, timestamp: new Date() });

  await chat.save();
  return NextResponse.json({ reply: aiReply });
}
