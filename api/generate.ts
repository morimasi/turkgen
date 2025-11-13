
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

        const bulkPrompt = createBulkQuestionPrompt(params);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Switched to the faster model for bulk generation
            contents: bulkPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: bulkQuestionSchema,
            }
        });

        const jsonString = response.text.trim();
        const questions: Question[] = JSON.parse(jsonString);
        
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("API'den beklenen formatta (JSON dizisi) bir yanıt alınamadı.");
        }

        if (questions.length < params.questionCount) {
             const errorMessage = `İstenen sayıda soru üretilemedi. ${params.questionCount} sorudan yalnızca ${questions.length} tanesi başarıyla oluşturuldu. Lütfen tekrar deneyin.`;
             return res.status(500).json({ error: errorMessage });
        }
        
        return res.status(200).json(questions);

    } catch (error: any) {
        console.error("Error in /api/generate:", error);
        if (error instanceof SyntaxError) {
             return res.status(500).json({ error: "Soru üretilirken yapay zekadan gelen yanıt ayrıştırılamadı. Lütfen tekrar deneyin.", details: error.message });
        }
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

const bulkQuestionSchema = {
    type: Type.ARRAY,
    description: "Oluşturulan tüm soruları içeren bir dizi.",
    items: questionSchema
};

const systemInstruction = `Sen, Türk Dili ve Edebiyatı alanında uzmanlaşmış, ölçme-değerlendirme ve bilişsel pedagoji konularında derinlemesine bilgi sahibi bir Türk Dili Profesörüsün. Temel görevin, 2025 Millî Eğitim Bakanlığı (MEB) Türkçe Dersi Öğretim Programı'nın ruhuna ve hedeflerine sadık kalarak, ortaokul seviyesindeki (4-8. sınıflar) öğrenciler için akademik geçerliliği ve güvenirliği yüksek, özgün ve yenilikçi sorular tasarlamaktır. Hazırlayacağın her soru, sadece müfredat kazanımlarını ölçmekle kalmamalı, aynı zamanda öğrencilerin üst düzey düşünme becerilerini (analiz, sentez, değerlendirme), eleştirel okuryazarlık yetilerini ve metinlerarası bağlantı kurma kapasitelerini de harekete geçirmelidir. Çıktıların, talep edilen JSON formatına harfiyen uymalı; format dışında hiçbir yorum, açıklama veya ek metin içermemelidir. Akademik titizlik ve pedagojik mükemmellik, çalışmalarının temelini oluşturmalıdır.`;

const createBulkQuestionPrompt = (params: QuestionGenerationParams): string => {
  const objectivesText = params.objectives.map(o => `- ${o.code} ${o.text}`).join('\n');
  const unitsText = params.units.map(u => `- ${u.no}. Ünite: ${u.name}`).join('\n');

  return `
Aşağıdaki kriterlere ve kurallara göre **toplam ${params.questionCount} adet** Türkçe sorusu oluştur ve cevabını bu soruları içeren **tek bir JSON dizisi (array)** formatında döndür.

**Kriterler:**
- Sınıf: ${params.grade}
- Kapsamdaki Üniteler:\n${unitsText}
- Kapsamdaki Kazanımlar:\n${objectivesText}
- Soru Tipi: "${params.questionType}" (Tüm sorular bu tipte olmalı)
- Zorluk Seviyesi: "${params.difficulty}" (Tüm sorular bu seviyede olmalı)
${params.customInstructions ? `- Ek Talimatlar: "${params.customInstructions}"` : ''}

**Önemli Kurallar:**
1.  **JSON Dizisi:** Çıktın, **sadece ve sadece ${params.questionCount} adet soru nesnesi içeren tek bir JSON dizisi** olmalıdır. Dizi dışında hiçbir metin, açıklama veya not içermemelidir. Schema'ya tam uy.
2.  **Kazanım Dağılımı:** Soruları, sağlanan "Kapsamdaki Kazanımlar" listesindeki farklı kazanımlara dengeli bir şekilde dağıtmaya çalış. Her sorunun \`kazanim_kodu\` ve \`kazanim_metni\` alanları listedeki kazanımlardan biriyle eşleşmelidir.
3.  **Özgünlük:** Her bir soru, paragraf ve seçenekler tamamen özgün olmalıdır. Dizideki sorular birbirinden farklı olmalıdır.
4.  **Soru Tiplerine Göre:**
    -   'coktan_secmeli': 'secenekler' bir obje, 'yanlis_secenek_tipleri' 3 elemanlı bir dizi ve 'dogru_cevap' doğru seçeneğin harfi (A, B, C, D) olmalıdır. Çeldiriciler mantıklı ve güçlü olmalı. Doğru cevap şıkkını (A, B, C, D) sorular arasında rastgele dağıt.
    -   'dogru_yanlis': 'secenekler' ve 'yanlis_secenek_tipleri' null olmalı. 'soru_metni' bir yargı cümlesi olmalı. 'dogru_cevap' "Doğru" veya "Yanlış" metni olmalıdır.
    -   'bosluk_doldurma': 'secenekler' ve 'yanlis_secenek_tipleri' null olmalı. 'soru_metni' içindeki boşluk '___' ile belirtilmeli. 'dogru_cevap' boşluğa gelecek doğru ifade olmalıdır.
5.  **Pedagojik Derinlik:** Her soru nesnesi, \`yanlis_secenek_tipleri\`, \`gercek_yasam_baglantisi\`, \`cozum_anahtari\` gibi pedagojik alanları eksiksiz ve kaliteli bir şekilde doldurmalıdır.

Lütfen şimdi istenen ${params.questionCount} adet soruyu içeren JSON dizisini oluştur.`;
};
