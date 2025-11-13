import { GoogleGenAI } from "@google/genai";
import type { ImageOptions } from '../types';

export const config = {
    runtime: 'edge',
};

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

// Vercel Edge Function
export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(`Method ${req.method} Not Allowed`, { status: 405, headers: { 'Allow': 'POST' } });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: "API anahtarı sunucuda yapılandırılmamış." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { prompt, options } = await req.json();
        if (!prompt || !options) {
            return new Response(JSON.stringify({ error: "Görsel oluşturmak için bir metin istemi ve seçenekler gereklidir." }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
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
            return new Response(JSON.stringify({ image: base64ImageBytes }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            console.error("No image data in Imagen response:", JSON.stringify(response, null, 2));
            throw new Error("Yapay zeka modelinden görsel verisi alınamadı.");
        }

    } catch (error: any) {
        console.error("Error in /api/generateImage:", error);
        return new Response(JSON.stringify({ error: "Görsel üretilirken sunucu tarafında bir hata oluştu.", details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
