

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
        const { prompt, quality } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Görsel oluşturmak için bir metin istemi gereklidir." });
        }
        
        const ai = new GoogleGenAI({ apiKey });
        let base64ImageBytes: string | undefined;

        if (quality === 'fast') {
            // Use the faster model for speed
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part && part.inlineData) {
                base64ImageBytes = part.inlineData.data;
            }
        
        } else {
            // Use the high-quality model by default
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/png',
                },
            });
            const firstImage = response.generatedImages?.[0];
            if (firstImage && firstImage.image.imageBytes) {
                base64ImageBytes = firstImage.image.imageBytes;
            }
        }


        if (base64ImageBytes) {
            return res.status(200).json({ image: base64ImageBytes });
        } else {
            throw new Error("Yapay zeka modelinden görsel verisi alınamadı.");
        }

    } catch (error: any) {
        console.error("Error in /api/generateImage:", error);
        return res.status(500).json({ error: "Görsel üretilirken sunucu tarafında bir hata oluştu.", details: error.message });
    }
}
