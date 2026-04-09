import { GoogleGenAI, Type } from "@google/genai";
import { OMRCorrection } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function correctOMRSheet(base64Image: string, numQuestions: number, choicesCount: number): Promise<OMRCorrection> {
  const prompt = `
    Analyze this OMR (Optical Mark Recognition) answer sheet.
    The sheet has ${numQuestions} questions, each with ${choicesCount} alternatives (A, B, C, D, E...).
    Identify which bubbles are filled for each question.
    Also identify the student name and student code if written or marked.
    
    Return the data in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(',')[1] || base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING },
            studentCode: { type: Type.STRING },
            answers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: `Array of ${numQuestions} strings, each being the marked alternative (e.g., "A", "B", or "" if none).`
            },
            confidence: { type: Type.NUMBER }
          },
          required: ["studentName", "answers"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result as OMRCorrection;
  } catch (error) {
    console.error("Gemini Correction Error:", error);
    throw error;
  }
}
