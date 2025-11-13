

import { GoogleGenAI, Type } from "@google/genai";
import type { Question, QuestionGenerationParams } from '../types';

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
        const params: QuestionGenerationParams = req.body;
        const ai = new GoogleGenAI({ apiKey });
        
        const allQuestions: Question[] = [];
        const maxAttempts = params.questionCount + 5; // Add a safety net for failed attempts
        let currentAttempts = 0;

        // Keep generating until we have the desired number of questions
        while (allQuestions.length < params.questionCount && currentAttempts < maxAttempts) {
            currentAttempts++;
            try {
                // We ask for one question at a time to improve reliability
                const userPrompt = createPrompt(params); 
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: userPrompt,
                    config: {
                        systemInstruction: systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: questionSchema
                    }
                });

                const jsonString = response.text;
                const question: Question = JSON.parse(jsonString);

                // Basic validation and ensure we don't add duplicates on retries
                if (question && question.soru_metni && question.dogru_cevap) {
                    const isDuplicate = allQuestions.some(q => q.soru_metni === question.soru_metni);
                    if (!isDuplicate) {
                        allQuestions.push(question);
                    }
                }
            } catch (e) {
                console.warn(`Soru üretme denemesi #${currentAttempts} başarısız oldu:`, e);
                // We just log the error and continue the loop to try again
            }
        }

        if (allQuestions.length < params.questionCount) {
             return res.status(500).json({ error: `İstenen sayıda soru üretilemedi. ${params.questionCount} sorudan yalnızca ${allQuestions.length} tanesi başarıyla oluşturuldu. Lütfen tekrar deneyin.` });
        }
        
        return res.status(200).json(allQuestions);

    } catch (error: any) {
        console.error("Error in /api/generate:", error);
        return res.status(500).json({ error: "Soru üretilirken sunucu tarafında bir hata oluştu.", details: error.message });
    }
}

// Define the schema for the question object to ensure structured output
const questionSchema = {
    type: Type.OBJECT,
    properties: {
        sinif: { type: Type.INTEGER },
        unite_adi: { type: Type.STRING },
        unite_no: { type: Type.INTEGER },
        kazanim_kodu: { type: Type.STRING },
        kazanim_metni: { type: Type.STRING },
        soru_tipi: { type: Type.STRING, enum: ['coktan_secmeli', 'dogru_yanlis', 'bosluk_doldurma'] },
        paragraf_metni: { type: Type.STRING, nullable: true },
        soru_metni: { type: Type.STRING },
        secenekler: { 
            type: Type.OBJECT,
            properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
            },
            nullable: true 
        },
        dogru_cevap: { type: Type.STRING },
        yanlis_secenek_tipleri: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            nullable: true 
        },
        gercek_yasam_baglantisi: { type: Type.STRING },
        seviye: { type: Type.STRING, enum: ['temel', 'orta', 'ileri'] },
        cozum_anahtari: { type: Type.STRING },
    },
    required: ['sinif', 'unite_adi', 'unite_no', 'kazanim_kodu', 'kazanim_metni', 'soru_tipi', 'soru_metni', 'dogru_cevap', 'gercek_yasam_baglantisi', 'seviye', 'cozum_anahtari']
};

const systemInstruction = `Sen, Türk Dili ve Edebiyatı alanında uzmanlaşmış, ölçme-değerlendirme ve bilişsel pedagoji konularında derinlemesine bilgi sahibi bir Türk Dili Profesörüsün. Temel görevin, 2025 Millî Eğitim Bakanlığı (MEB) Türkçe Dersi Öğretim Programı'nın ruhuna ve hedeflerine sadık kalarak, ortaokul seviyesindeki (4-8. sınıflar) öğrenciler için akademik geçerliliği ve güvenirliği yüksek, özgün ve yenilikçi sorular tasarlamaktır. Hazırlayacağın her soru, sadece müfredat kazanımlarını ölçmekle kalmamalı, aynı zamanda öğrencilerin üst düzey düşünme becerilerini (analiz, sentez, değerlendirme), eleştirel okuryazarlık yetilerini ve metinlerarası bağlantı kurma kapasitelerini de harekete geçirmelidir. Çıktıların, talep edilen JSON formatına harfiyen uymalı; format dışında hiçbir yorum, açıklama veya ek metin içermemelidir. Akademik titizlik ve pedagojik mükemmellik, çalışmalarının temelini oluşturmalıdır.`;

const createPrompt = (params: QuestionGenerationParams): string => {
  const unitsText = params.units.map(u => `- ${u.no}. Ünite: ${u.name}`).join('\n');
  const objectivesText = params.objectives.map(o => `- ${o.code} ${o.text}`).join('\n');

  return `
Aşağıdaki kriterlere ve kurallara göre **1 adet** Türkçe sorusu oluştur ve cevabını **yalnızca tek bir JSON nesnesi** formatında döndür. JSON nesnesi dışında başka hiçbir metin, açıklama veya markdown formatı kullanma.

**Kriterler:**
- Sınıf: ${params.grade}
- Kapsamdaki Üniteler (bunlardan birini seçerek soru hazırla):
${unitsText}
- Kapsamdaki Kazanımlar (seçtiğin üniteye ait kazanımlardan birini seç):
${objectivesText}
- Soru Tipi: "${params.questionType}"
- Zorluk Seviyesi: "${params.difficulty}"
${params.customInstructions ? `- Ek Talimatlar: "${params.customInstructions}"` : ''}

**Kurallar:**
1.  **Paragraf:** Anlama dayalı kazanımlar için kısa, özgün, seviyeye uygun bir paragraf yaz. Dilbilgisi gibi paragrafa ihtiyaç duymayan kazanımlar için "paragraf_metni" alanı null olmalıdır.
2.  **Özgünlük:** Tüm soru, paragraf ve seçenekler tamamen özgün olmalıdır. Önceki cevaplarında kullandığın sorulardan farklı bir soru oluştur.
3.  **Soru Tiplerine Göre:**
    -   'coktan_secmeli': 'secenekler' bir obje, 'yanlis_secenek_tipleri' bir dizi ve 'dogru_cevap' doğru seçeneğin harfi (A, B, C, D) olmalıdır. Çeldiriciler mantıklı ve güçlü olmalı. Doğru cevap şıkkını rastgele dağıt.
    -   'dogru_yanlis': 'secenekler' ve 'yanlis_secenek_tipleri' null olmalı. 'soru_metni' bir yargı cümlesi olmalı. 'dogru_cevap' "Doğru" veya "Yanlış" metni olmalıdır.
    -   'bosluk_doldurma': 'secenekler' ve 'yanlis_secenek_tipleri' null olmalı. 'soru_metni' içindeki boşluk '___' ile belirtilmeli. 'dogru_cevap' boşluğa gelecek doğru ifade olmalıdır.
4.  **Pedagojik Derinlik:**
    -   \`yanlis_secenek_tipleri\`: Her bir çeldiricinin hangi bilişsel hatayı hedeflediğini veya ne tür bir yanıltmaca olduğunu açıkla (Örn: "Yakın anlamlı çeldirici", "Zıt anlamlı çeldirici").
    -   \`gercek_yasam_baglantisi\`: Kazanımın günlük hayattaki önemini veya kullanımını, bir velinin dahi anlayabileceği netlikte tek bir cümleyle ifade et.
    -   \`cozum_anahtari\`: Bir öğretmenin konuyu özetleyebileceği veya çözüm yolunu gösterebileceği 1-2 cümlelik net bir açıklama olsun.
5.  **Seviye Açıklaması:** 'seviye' alanını, kazanımın Bloom taksonomisindeki basamağına göre ata:
    -   'temel': "tanır, bulur, belirtir, sıralar" gibi bilgi ve kavrama düzeyindeki kazanımlar.
    -   'orta': "yorumlar, ana fikri bulur, karşılaştırır, neden-sonuç ilişkisi kurar" gibi uygulama ve analiz düzeyindeki kazanımlar.
    -   'ileri': "çıkarımda bulunur, metin yazar, değerlendirir, eleştirel bakar" gibi sentez ve değerlendirme düzeyindeki kazanımlar.
6.  **Dil ve Üslup:** Tamamen Türkçe dilbilgisi, imla ve noktalama kurallarına uy. Metinlerde kullanılan özel isimler (Ahmet, Zeynep vb.) çeşitli olsun.

Lütfen şimdi istenen soruyu JSON nesnesi olarak oluştur.`;
};
