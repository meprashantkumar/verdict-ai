import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getGeminiModel(modelName = "gemini-2.5-flash") {
  return genAI.getGenerativeModel({ model: modelName });
}

export async function analyzeCaseWithAI(caseData: {
  title: string;
  description: string;
  caseType: string;
  clientName: string;
  documents?: string[];
}) {
  const model = getGeminiModel();

  const prompt = `You are an expert legal analyst. Analyze the following legal case and provide a comprehensive analysis.

Case Title: ${caseData.title}
Case Type: ${caseData.caseType}
Client: ${caseData.clientName}
Description: ${caseData.description}
${caseData.documents?.length ? `Documents: ${caseData.documents.join(", ")}` : ""}

Provide a detailed JSON analysis with the following structure:
{
  "summary": "Brief case summary",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "missingEvidence": ["evidence1", "evidence2"],
  "applicableLaws": ["law1", "law2"],
  "strategy": "Recommended legal strategy",
  "riskLevel": "LOW|MEDIUM|HIGH",
  "confidence": 85,
  "nextSteps": ["step1", "step2"]
}

Return ONLY valid JSON, no markdown.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("Failed to parse AI analysis response");
  }
}

export async function chatWithAI(
  messages: { role: "user" | "model"; content: string }[],
  caseContext: string
) {
  const model = getGeminiModel();

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [
          {
            text: `You are an expert AI legal assistant. You are helping a lawyer with the following case:\n\n${caseContext}\n\nProvide helpful, accurate legal insights. Always remind that your advice supplements but does not replace professional legal judgment.`,
          },
        ],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I'm ready to assist with this case. How can I help?" }],
      },
      ...messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ],
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

export async function generateDraft(params: {
  type: string;
  caseDetails: string;
  clientName: string;
  lawyerName: string;
  additionalInfo?: string;
}) {
  const model = getGeminiModel();

  const prompt = `You are a professional legal document drafter. Generate a complete, professional ${params.type} document.

Case Details: ${params.caseDetails}
Client Name: ${params.clientName}
Lawyer/Advocate: ${params.lawyerName}
Additional Information: ${params.additionalInfo ?? "None"}

Generate a complete, properly formatted legal document. Include all standard clauses, proper legal language, and placeholders where specific information needs to be filled in (use [PLACEHOLDER] format).

Return the document as plain HTML with proper formatting using <h1>, <h2>, <p>, <ol>, <ul>, <strong> tags for structure.`;

  const result = await model.generateContent(prompt);
  let html = result.response.text().trim();
  html = html.replace(/^```(?:html)?\n?/i, "").replace(/\n?```$/i, "").trim();
  return html;
}
