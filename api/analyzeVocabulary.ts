import { GoogleGenAI, Type } from "@google/genai";

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(`Method ${req.method} Not Allowed`, { status: 405, headers: { 'Allow': 'POST' } });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: "API anahtarı sunucuda yapılandırılmamış." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { words, grade } = await req.json();
        if (!words || !Array.isArray(words) || words.length === 0 || !grade) {
            return new Response(JSON.stringify({ error: "Geçerli kelime listesi ve sınıf seviyesi gereklidir." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const ai = new GoogleGenAI({ apiKey });

        const vocabularySchema = {
            type: Type.OBJECT,
            properties: {
                kelime: { type: Type.STRING, description: "Analiz edilen kelime." },
                tanim: { type: Type.STRING, description: `Kelimenin ${grade}. sınıf öğrencisi için uygun, basit ve anlaşılır tanımı.` },
                es_anlam: { type: Type.STRING, description: "Kelimenin yaygın bir eş anlamlısı. Yoksa boş bırakılabilir." },
                ornek_cumle: { type: Type.STRING, description: `Kelimenin içinde geçtiği, bağlamını açıklayan özgün bir örnek cümle.` },
            },
            required: ["kelime", "tanim", "es_anlam", "ornek_cumle"],
        };
        
        const responseSchema = {
            type: Type.ARRAY,
            items: vocabularySchema,
        };

        const prompt = `Aşağıdaki Türkçe kelime listesini ${grade}. sınıf seviyesindeki bir öğrenci için analiz et. Her kelime için basit bir tanım, yaygın bir eş anlamlı ve kelimenin kullanıldığı özgün bir örnek cümle sağla. Kelimeler: ${words.join(', ')}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "Sen, ortaokul öğrencileri için eğitici materyaller hazırlayan bir Türkçe dili uzmanısın. Görevin, verilen kelimeleri analiz etmektir.",
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonString = response.text;
        
        // Return the JSON response directly
        return new Response(jsonString, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Error in /api/analyzeVocabulary:", error);
        return new Response(JSON.stringify({ error: "Kelime analizi sırasında sunucu tarafında bir hata oluştu.", details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
