import { GoogleGenAI, Type } from "@google/genai";
import type { Question, QuestionGenerationParams } from '../src/types';

// Vercel Serverless Function for Node.js runtime
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: "API anahtarı sunucuda yapılandırılmamış." });
        return;
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        const params: QuestionGenerationParams = req.body;
        const ai = new GoogleGenAI({ apiKey });

        const batchPrompt = createBatchQuestionPrompt(params);
        
        const batchQuestionSchema = {
            type: Type.ARRAY,
            items: questionSchema,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: batchPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: batchQuestionSchema,
            }
        });

        let jsonString = response.text?.trim();
        
        if (jsonString) {
            // Cleanup: Remove markdown code blocks if the model includes them
            jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            
            try {
                // Parse the entire array of questions
                const questions: Question[] = JSON.parse(jsonString);
                
                // Stream each question individually to the client
                for (const question of questions) {
                    res.write(JSON.stringify(question) + '\n');
                }
            } catch (e) {
                 console.error(`Failed to parse the batch JSON response.`, jsonString, e);
            }
        } else {
            console.error(`Empty response from API for batch request.`);
        }

    } catch (error: any) {
        console.error("Error in /api/generate:", error);
    } finally {
        res.end();
    }
}


const questionSchema = {
    type: Type.OBJECT,
    properties: {
        sinif: { type: Type.INTEGER, description: "Sorunun ait olduğu sınıf düzeyi (örn: 5)" },
        unite_adi: { type: Type.STRING, description: "Sorunun ait olduğu ünitenin tam adı" },
        unite_no: { type: Type.INTEGER, description: "Sorunun ait olduğu ünitenin numarası" },
        kazanim_kodu: { type: Type.STRING, description: "MEB müfredatındaki tam kazanım kodu (örn: 'T.5.3.5.')" },
        kazanim_metni: { type: Type.STRING, description: "Kazanımın tam metni" },
        soru_tipi: { type: Type.STRING, enum: ['coktan_secmeli', 'dogru_yanlis', 'bosluk_doldurma'], description: "Sorunun tipi" },
        paragraf_metni: { type: Type.STRING, nullable: true, description: "Soruya temel oluşturan paragraf. Gerekli değilse null olabilir." },
        soru_metni: { type: Type.STRING, description: "Sorunun tam metni" },
        secenekler: {
            type: Type.OBJECT,
            properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
            },
            nullable: true,
            description: "Çoktan seçmeli sorular için 4 seçenek. Diğer tipler için null."
        },
        dogru_cevap: { type: Type.STRING, description: "Doğru olan seçeneğin harfi ('A', 'B', 'C', 'D'), metni ('Doğru'/'Yanlış') veya kelimesi." },
        yanlis_secenek_tipleri: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            nullable: true,
            description: "Çoktan seçmeli sorulardaki çeldiricilerin pedagojik türleri. Diğer tipler için null."
        },
        gercek_yasam_baglantisi: { type: Type.STRING, description: "Kazanımın günlük hayattaki önemini açıklayan kısa cümle." },
        seviye: { type: Type.STRING, enum: ['temel', 'orta', 'ileri'], description: "Sorunun zorluk seviyesi (Bloom taksonomisine göre)" },
        cozum_anahtari: { type: Type.STRING, description: "Sorunun nasıl çözüleceğini açıklayan kısa metin." },
    },
    required: [
        "sinif", "unite_adi", "unite_no", "kazanim_kodu", "kazanim_metni",
        "soru_tipi", "soru_metni", "dogru_cevap", "gercek_yasam_baglantisi",
        "seviye", "cozum_anahtari"
    ]
};

const systemInstruction = `Sen, Türk Dili ve Edebiyatı alanında uzman, ölçme-değerlendirme ve bilişsel pedagoji bilgisi yüksek bir Türk Dili Profesörüsün. Görevin, 2025 MEB Türkçe Dersi Öğretim Programı'na tam uyumlu, sınıf seviyesine göre gerçekçi ve pedagojik değeri yüksek sorular üretmek. Tüm çıktıların **yalnızca JSON** olmalı, format dışı hiçbir metin eklenmemeli.

Üretim Playbooku:
- Seviye kalibrasyonu: "temel" (hatırlama-anlama, doğrudan kazanım), "orta" (uygulama-analiz, iki adımlı akıl yürütme), "ileri" (değerlendirme-yaratma, transfer ve çoklu ipucu).
- Kazanım eşlemesi: Her soru tek bir kazanım kodu ve metniyle birebir örtüşmeli; başka kazanımları ölçen ifadeler ekleme.
- Ünite tutarlılığı: Senaryo, metin ve bağlam seçilen ünitenin temasıyla uyumlu, öğrencinin günlük yaşamına yakın olmalı.
- Dil ve yaş düzeyi: Sınıf seviyesine uygun, açık ve ölçmeye odaklı cümleler kullan.
- Soru tipi kuralları: Tip gereksinimlerine uy, çeldiricileri yaygın yanılgılara dayandır, cevap tek ve tartışmasız olsun.

Kalite kontrol (iç denetim): JSON üretmeden önce her soru için şu kontrol listesini uygula:
1) sınıf, ünite, kazanım kodu/metni verilen listeden ve aynı sınıf seviyesinde mi?
2) soru_tipi ve secenek yapısı tip kurallarına uyuyor mu?
3) zorluk seviyesi verilen hedefle uyumlu bilişsel talep barındırıyor mu?
4) gercek_yasam_baglantisi ve cozum_anahtari sahici, kısa ve uygulanabilir mi?
5) paragraf_metni gerekiyorsa doğal, tekrarsız ve yaşa uygun mu?
Kontrolden geçmeyen soruyu düzelt, JSON'a ekleme.`;

const createBatchQuestionPrompt = (params: QuestionGenerationParams): string => {
  const objectivesText = params.objectives.map(o => `- ${o.code} ${o.text}`).join('\n');
  const unitsText = params.units.map(u => `- ${u.no}. Ünite: ${u.name}`).join('\n');

  return `
Aşağıdaki kriterlere göre **${params.questionCount} adet** Türkçe sorusu tasarla ve cevabı **tek bir JSON dizisi** olarak döndür.

Kriterler:
- Sınıf: ${params.grade}
- Üniteler:\n${unitsText}
- Kazanımlar:\n${objectivesText}
- Soru Tipi: "${params.questionType}" (tüm sorular için)
- Zorluk Seviyesi: "${params.difficulty}" (tüm sorular için)
${params.customInstructions ? `- Ek Talimatlar: "${params.customInstructions}"` : ''}

Zorluk tanımları:
- "temel": bilgi/hatırlama, doğrudan kazanım ifadesi, tek adımlı akıl yürütme.
- "orta": uygulama/analiz, metin veya senaryodan ipucu çekme, iki adım.
- "ileri": değerlendirme/yorumlama/yaratma, transfer, birden çok ipucu ve çeldirici kontrolü.

Üretim adımları:
1. Her soru için sağlanan kazanımlardan **yalnızca birini** seç, \`kazanim_kodu\` ve \`kazanim_metni\` alanını aynen kullan.
2. Seçtiğin kazanım ve ünitenin temasına uygun, öğrencinin günlük yaşamına benzeyen kısa bir bağlam belirle (paragraf_metni gerekiyorsa doğal ve sınıf seviyesine uygun olsun).
3. Zorluk tanımına göre bilişsel talebi ayarla; çok kolay ya da sınıf üstü kavram ekleme.
4. Soru metnini açık, ölçmeye dönük ve tipine uygun yaz.
5. Çeldiricileri (coktan_secmeli) yaygın yanılgılara dayandır, birbirinden ve doğru cevaptan net ayr.

Tip kuralları:
- 'coktan_secmeli': 'secenekler' 4 seçenekli obje, 'yanlis_secenek_tipleri' 3 pedagojik çeldirici açıklaması, 'dogru_cevap' harf (A, B, C, D).
- 'dogru_yanlis': 'secenekler' ve 'yanlis_secenek_tipleri' null, 'soru_metni' yargı cümlesi, 'dogru_cevap' "Doğru" ya da "Yanlış".
- 'bosluk_doldurma': 'secenekler' ve 'yanlis_secenek_tipleri' null, 'soru_metni' içindeki boşluk '___', 'dogru_cevap' boşluğu dolduran ifade.

Son kontroller:
- Her soru farklı ve tekrar içermiyor.
- Gerçek_yasam_baglantisi ve cozum_anahtari kısa ama sahici.
- JSON dizi dışında hiçbir şey yazma; tam olarak ${params.questionCount} nesne üret.`;
};
