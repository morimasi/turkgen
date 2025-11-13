import { GoogleGenAI } from "@google/genai";
import type { Question, QuestionGenerationParams } from '../types';

export const config = {
    runtime: 'edge',
};

// Vercel Edge Function
export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(`Method ${req.method} Not Allowed`, { status: 405, headers: { 'Allow': 'POST' } });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: "API anahtarı sunucuda yapılandırılmamış." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const params: QuestionGenerationParams = await req.json();
        const ai = new GoogleGenAI({ apiKey });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                // Soruları paralel olarak değil, sırayla (sequential) oluştur.
                // Bu, API hız limitlerine takılma riskini azaltır ve daha güvenilir sonuçlar verir.
                for (let i = 0; i < params.questionCount; i++) {
                    try {
                        const prompt = createPrompt(params);
                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-pro',
                            contents: prompt,
                            config: {
                                systemInstruction: systemInstruction,
                            }
                        });

                        const jsonString = response.text;
                        const cleanedJsonString = jsonString.replace(/^```json\s*|```$/g, '').trim();

                        // Kalite Kontrolü: AI'dan boş bir yanıt gelmediğinden emin ol.
                        if (cleanedJsonString) {
                            const question: Question = JSON.parse(cleanedJsonString);
                            
                            // Soru metninin varlığını ve boş olmadığını kontrol et.
                            // Bu, "içeriği olmayan boş soru" sorununu önler.
                            if (question && question.soru_metni && question.soru_metni.trim() !== '') {
                                // Soru geçerliyse, stream'e gönder.
                                controller.enqueue(encoder.encode(JSON.stringify(question) + '\n'));
                            } else {
                                // Soru geçersizse, konsola bir uyarı yaz ve atla.
                                console.warn("Skipping invalid/empty question from AI:", cleanedJsonString);
                            }
                        } else {
                             console.warn("Received empty response from AI for a question.");
                        }

                    } catch (error) {
                        // Bir soru üretilirken hata olursa, işlemi durdurma, sadece hatayı logla ve devam et.
                        console.error(`Error generating question ${i + 1} of ${params.questionCount}:`, error);
                    }
                }
                
                // Tüm sorular istendikten sonra stream'i kapat.
                controller.close();
            },
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'application/x-ndjson' },
        });

    } catch (error: any) {
        console.error("Error in /api/generate handler:", error);
        return new Response(JSON.stringify({ error: "Soru üretilirken sunucu tarafında bir hata oluştu.", details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}


const systemInstruction = `Sen, Türk Dili ve Edebiyatı alanında uzmanlaşmış, ölçme-değerlendirme ve bilişsel pedagoji konularında derinlemesine bilgi sahibi bir Türk Dili Profesörüsün. Temel görevin, 2025 Millî Eğitim Bakanlığı (MEB) Türkçe Dersi Öğretim Programı'nın ruhuna ve hedeflerine sadık kalarak, ortaokul seviyesindeki (4-8. sınıflar) öğrenciler için akademik geçerliliği ve güvenirliği yüksek, özgün ve yenilikçi sorular tasarlamaktır. Hazırlayacağın her soru, sadece müfredat kazanımlarını ölçmekle kalmamalı, aynı zamanda öğrencilerin üst düzey düşünme becerilerini (analiz, sentez, değerlendirme), eleştirel okuryazarlık yetilerini ve metinlerarası bağlantı kurma kapasitelerini de harekete geçirmelidir. Çıktıların, talep edilen JSON formatına harfiyen uymalı; format dışında hiçbir yorum, açıklama veya ek metin içermemelidir. Akademik titizlik ve pedagojik mükemmellik, çalışmalarının temelini oluşturmalıdır.`;

const createPrompt = (params: QuestionGenerationParams): string => {
  const jsonStructure = {
    sinif: params.grade,
    unite_adi: "Sorunun ilgili olduğu ünite adı",
    unite_no: "Sorunun ilgili olduğu ünite numarası",
    kazanim_kodu: "Sorunun ilgili olduğu kazanım kodu",
    kazanim_metni: "Sorunun ilgili olduğu kazanım metni",
    soru_tipi: params.questionType,
    paragraf_metni: "...",
    soru_metni: "...",
    secenekler: params.questionType === 'coktan_secmeli' ? { "A": "...", "B": "...", "C": "...", "D": "..." } : null,
    dogru_cevap: "...",
    yanlis_secenek_tipleri: params.questionType === 'coktan_secmeli' ? ["...", "..."] : null,
    gercek_yasam_baglantisi: "...",
    seviye: params.difficulty,
    cozum_anahtari: "..."
  };
  
  const unitsText = params.units.map(u => `- ${u.no}. Ünite: ${u.name}`).join('\n');
  const objectivesText = params.objectives.map(o => `- ${o.code} ${o.text}`).join('\n');


  return `
Aşağıdaki kriterlere ve kurallara göre 1 adet Türkçe sorusu oluştur ve cevabını yalnızca tek bir soru nesnesi içeren JSON formatında döndür. Yanıtın bir JSON dizisi \`[]\` içinde OLMAMALIDIR.

**Kriterler:**
- Sınıf: ${params.grade}
- Kapsamdaki Üniteler:
${unitsText}
- Kapsamdaki Kazanımlar:
${objectivesText}
- Soru Tipi: "${params.questionType}"
- Zorluk Seviyesi: "${params.difficulty}"
${params.customInstructions ? `- Ek Talimatlar: "${params.customInstructions}"` : ''}

**Kurallar:**
1.  **JSON Yapısı:** Çıktın, aşağıdaki yapıya uyan TEK BİR JSON nesnesi olmalıdır.
    \`\`\`json
    ${JSON.stringify(jsonStructure, null, 2)}
    \`\`\`
2.  **Paragraf:** Anlama dayalı kazanımlar için kısa, özgün, seviyeye uygun bir paragraf yaz. Dilbilgisi gibi paragrafa ihtiyaç duymayan kazanımlar için "paragraf_metni" alanı null olmalıdır.
3.  **Özgünlük:** Tüm sorular, paragraflar ve seçenekler tamamen özgün olmalıdır.
4.  **Soru Tiplerine Göre:**
    -   'coktan_secmeli': 'secenekler' bir obje, 'yanlis_secenek_tipleri' bir dizi ve 'dogru_cevap' doğru seçeneğin harfi (A, B, C, D) olmalıdır. Çeldiriciler mantıklı ve güçlü olmalı. Doğru cevap şıkkını rastgele dağıt.
    -   'dogru_yanlis': 'secenekler' ve 'yanlis_secenek_tipleri' null olmalı. 'soru_metni' bir yargı cümlesi olmalı. 'dogru_cevap' "Doğru" veya "Yanlış" metni olmalıdır.
    -   'bosluk_doldurma': 'secenekler' ve 'yanlis_secenek_tipleri' null olmalı. 'soru_metni' içindeki boşluk '___' ile belirtilmeli. 'dogru_cevap' boşluğa gelecek doğru ifade olmalıdır.
5.  **Pedagojik Derinlik:**
    -   \`yanlis_secenek_tipleri\`: Her bir çeldiricinin hangi bilişsel hatayı hedeflediğini veya ne tür bir yanıltmaca olduğunu açıkla (Örn: "Yakın anlamlı çeldirici", "Zıt anlamlı çeldirici").
    -   \`gercek_yasam_baglantisi\`: Kazanımın günlük hayattaki önemini veya kullanımını, bir velinin dahi anlayabileceği netlikte tek bir cümleyle ifade et.
    -   \`cozum_anahtari\`: Bir öğretmenin konuyu özetleyebileceği veya çözüm yolunu gösterebileceği 1-2 cümlelik net bir açıklama olsun.
6.  **Seviye Açıklaması:** 'seviye' alanını, kazanımın Bloom taksonomisindeki basamağına göre ata:
    -   'temel': "tanır, bulur, belirtir, sıralar" gibi bilgi ve kavrama düzeyindeki kazanımlar.
    -   'orta': "yorumlar, ana fikri bulur, karşılaştırır, neden-sonuç ilişkisi kurar" gibi uygulama ve analiz düzeyindeki kazanımlar.
    -   'ileri': "çıkarımda bulunur, metin yazar, değerlendirir, eleştirel bakar" gibi sentez ve değerlendirme düzeyindeki kazanımlar.
7.  **Dil ve Üslup:** Tamamen Türkçe dilbilgisi, imla ve noktalama kurallarına uy. Metinlerde kullanılan özel isimler (Ahmet, Zeynep vb.) çeşitli olsun.
8.  **Soru Dağılımı:** Bu tek soruyu, yukarıda listelenen kazanımlardan BİR TANESİNİ kullanarak oluştur.

Lütfen şimdi istenen tek soruyu oluştur.`;
};
