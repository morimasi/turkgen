


import { GoogleGenAI } from "@google/genai";
import type { ImageOptions } from '../types';

const constructEnhancedPrompt = (basePrompt: string, options: ImageOptions): string => {
    let styleText = '';
    switch (options.style) {
        case 'cizgi-film': styleText = 'Çocukların seveceği, neşeli bir çizgi film tarzında, '; break;
        case 'gercekci': styleText = 'Fotogerçekçi bir tarzda, '; break;
        case 'suluboya': styleText = 'Yumuşak geçişli bir suluboya tablo tarzında, '; break;
        case 'cizgi-roman': styleText = 'Canlı ve belirgin çizgilere sahip bir çizgi roman panelinden fırlamış gibi, '; break;
    }

    let paletteText = '';
    switch (options.palette) {
        case 'canli': paletteText = 'canlı ve parlak renkler kullanarak, '; break;
        case 'pastel': paletteText = 'pastel ve yumuşak renk tonları kullanarak, '; break;
        case 'siyah-beyaz': paletteText = 'siyah-beyaz ve gölgeli olarak, '; break;
    }
    
    let qualityText = '';
    switch (options.quality) {
        case 'hizli': qualityText = 'basit ve anlaşılır bir çizimle, '; break;
        case 'yuksek-kalite': qualityText = 'yüksek detaylı ve kaliteli bir illüstrasyonla, '; break;
    }

    const prefix = `${styleText}${paletteText}${qualityText}`;
    return `${prefix}aşağıdaki metni anlatan bir görsel oluştur: "${basePrompt}"`;
}

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
        const { prompt, options } = req.body;
        if (!prompt || !options) {
            return res.status(400).json({ error: "Görsel oluşturmak için bir metin istemi ve seçenekler gereklidir." });
        }
        
        const ai = new GoogleGenAI({ apiKey });
        
        const enhancedPrompt = constructEnhancedPrompt(prompt, options);

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: enhancedPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
            },
        });

        const firstImage = response.generatedImages?.[0];

        if (firstImage && firstImage.image.imageBytes) {
            const base64ImageBytes: string = firstImage.image.imageBytes;
            return res.status(200).json({ image: base64ImageBytes });
        } else {
            console.error("No image data in Imagen response:", JSON.stringify(response, null, 2));
            throw new Error("Yapay zeka modelinden görsel verisi alınamadı.");
        }

    } catch (error: any) {
        console.error("Error in /api/generateImage:", error);
        return res.status(500).json({ error: "Görsel üretilirken sunucu tarafında bir hata oluştu.", details: error.message });
    }
}
