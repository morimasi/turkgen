
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

        // Generate N questions in parallel
        const questionPromises = Array.from({ length: params.questionCount }, () => {
            const singleQuestionPrompt = createSingleQuestionPrompt(params);
            return ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: singleQuestionPrompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: questionSchema,
                }
            });
        });

        const results = await Promise.allSettled(questionPromises);

        const successfulQuestions: Question[] = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                try {
                    const jsonString = result.value.text.trim();
                    const question = JSON.parse(jsonString);
                    successfulQuestions.push(question);
                } catch (e) {
                    console.error(`Soru ${index + 1} için JSON ayrıştırma hatası:`, e);
                    console.error('Gelen Hatalı Metin:', result.value.text);
                }
            } else {
                console.error(`Soru ${index + 1} üretilemedi:`, result.reason);
            }
        });

        if (successfulQuestions.length < params.questionCount) {
             const errorMessage = `İstenen sayıda soru üretilemedi. ${params.questionCount} sorudan yalnızca ${successfulQuestions.length} tanesi başarıyla oluşturuldu. Lütfen tekrar deneyin.`;
             return res.status(500).json({ error: errorMessage });
        }

        return res.status(200).json(successfulQuestions);

    } catch (error: any) {
        console.error("Error in /api/generate:", error);
        return res.status(500).json({ error: "Soru üretilirken sunucu tarafında genel bir hata oluştu.", details: error.message });
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


const systemInstruction = `Sen, Türk Dili ve Edebiyatı alanında uzmanlaşmış, ölçme-değerlendirme ve bilişsel pedagoji konularında derinlemesine bilgi sahibi bir Türk Dili Profesörüsün. Temel görevin, 2025 Millî Eğitim Bakanlığı (MEB) Türkçe Dersi Öğretim Programı'nın ruhuna ve hedeflerine sadık kalarak, ortaokul seviyesindeki (4-8. sınıflar) öğrenciler için akademik geçerliliği ve güvenirliği yüksek, özgün ve yenilikçi sorular tasarlamaktır. Hazırlayacağın her soru, sadece müfredat kazanımlarını ölçmekle kalmamalı, aynı zamanda öğrencilerin üst düzey düşünme becerilerini (analiz, sentez, değerlendirme), eleştirel okuryazarlık yetilerini ve metinlerarası bağlantı kurma kapasitelerini de harekete geçirmelidir. Çıktıların, talep edilen JSON formatına harfiyen uymalı; format dışında hiçbir yorum, açıklama veya ek metin içermemelidir. Akademik titizlik ve pedagojik mükemmellik, çalışmalarının temelini oluşturmalıdır.`;

const createSingleQuestionPrompt = (params: QuestionGenerationParams): string => {
  const randomObjective = params.objectives[Math.floor(Math.random() * params.objectives.length)];
  const randomUnit = params.units[Math.floor(Math.random() * params.units.length)];

  return `
Aşağıdaki kriterlere ve kurallara göre **1 (bir) adet** Türkçe sorusu oluştur ve cevabını yalnızca bu tek soru nesnesini içeren bir JSON formatında döndür.

**Kriterler:**
- Sınıf: ${params.grade}
- Ünite: ${randomUnit.no}. Ünite: ${randomUnit.name} (Bu ünite genel bir bağlamdır, asıl odak aşağıdaki kazanımdır.)
- Odaklanılacak Kazanım: ${randomObjective.code} ${randomObjective.text}
- Soru Tipi: "${params.questionType}"
- Zorluk Seviyesi: "${params.difficulty}"
${params.customInstructions ? `- Ek Talimatlar: "${params.customInstructions}"` : ''}

**Kurallar:**
1.  **JSON Yapısı:** Çıktın, **sadece tek bir soru nesnesi** olmalıdır. Dizi (\`[]\`) içinde olmamalıdır ve schema'ya tam uymalıdır.
2.  **Özgünlük:** Soru, paragraf ve seçenekler tamamen özgün olmalıdır. Daha önce üretilenlerden farklı bir soru oluştur.
3.  **Soru Tiplerine Göre:**
    -   'coktan_secmeli': 'secenekler' bir obje, 'yanlis_secenek_tipleri' 3 elemanlı bir dizi ve 'dogru_cevap' doğru seçeneğin harfi (A, B, C, D) olmalıdır. Çeldiriciler mantıklı ve güçlü olmalı.
    -   'dogru_yanlis': 'secenekler' ve 'yanlis_secenek_tipleri' null olmalı. 'soru_metni' bir yargı cümlesi olmalı. 'dogru_cevap' "Doğru" veya "Yanlış" metni olmalıdır.
    -   'bosluk_doldurma': 'secenekler' ve 'yanlis_secenek_tipleri' null olmalı. 'soru_metni' içindeki boşluk '___' ile belirtilmeli. 'dogru_cevap' boşluğa gelecek doğru ifade olmalıdır.
4.  **Pedagojik Derinlik:**
    -   \`yanlis_secenek_tipleri\`: Her bir çeldiricinin hangi bilişsel hatayı hedeflediğini veya ne tür bir yanıltmaca olduğunu açıkla (Örn: "Yakın anlamlı çeldirici").
    -   \`gercek_yasam_baglantisi\`: Kazanımın günlük hayattaki önemini veya kullanımını, bir velinin dahi anlayabileceği netlikte tek bir cümleyle ifade et.
    -   \`cozum_anahtari\`: Bir öğretmenin konuyu özetleyebileceği veya çözüm yolunu gösterebileceği 1-2 cümlelik net bir açıklama olsun.
5.  **Dil ve Üslup:** Tamamen Türkçe dilbilgisi, imla ve noktalama kurallarına uy.

Lütfen şimdi istenen 1 (bir) adet soruyu oluştur.`;
};
