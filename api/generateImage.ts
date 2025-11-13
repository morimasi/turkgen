
import { GoogleGenAI, Modality } from "@google/genai";

// Vercel Serverless Function for Node.js runtime
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "API anahtarı sunucuda yapılandırılmamış." });
    }

    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Görsel oluşturmak için bir metin istemi gereklidir." });
        }
        
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const firstPart = response.candidates?.[0]?.content?.parts?.[0];

        if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
            const base64ImageBytes: string = firstPart.inlineData.data;
            return res.status(200).json({ image: base64ImageBytes });
        } else {
            console.error("No image data in Gemini response:", JSON.stringify(response, null, 2));
            throw new Error("Yapay zeka modelinden görsel verisi alınamadı.");
        }

    } catch (error: any) {
        console.error("Error in /api/generateImage:", error);
        return res.status(500).json({ error: "Görsel üretilirken sunucu tarafında bir hata oluştu.", details: error.message });
    }
}
