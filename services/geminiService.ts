import { GoogleGenAI } from "@google/genai";
import type { Question, QuestionGenerationParams } from '../types';

const systemInstruction = `Sen, Türkiye Millî Eğitim Bakanlığı (MEB) müfredatına hakim, deneyimli bir ortaokul Türkçe öğretmeni ve ölçme-değerlendirme uzmanısın. Görevin, 2025 yılı MEB Türkçe Dersi Öğretim Programı'nı temel alarak, akademik titizlik ve pedagojik derinlikle, belirtilen kriterlere uygun, özgün ve nitelikli sorular hazırlamaktır. Ürettiğin sorular, sadece dilbilgisel doğruluğu değil, aynı zamanda öğrencinin eleştirel düşünme, anlama ve yorumlama becerilerini de ölçmelidir. Çıktın, daima istenen JSON formatında, bir dizi (array) içinde olmalı, başka hiçbir metin, açıklama veya markdown içermemelidir.`;

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
Aşağıdaki kriterlere ve kurallara göre ${params.questionCount} adet Türkçe sorusu oluştur ve cevabını yalnızca her bir soru nesnesini içeren tek bir JSON dizisi (array) formatında döndür.

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
1.  **JSON Yapısı:** Çıktın, aşağıdaki yapıya uyan soru nesnelerinden oluşan bir JSON dizisi \`[...]\` olmalıdır. Her sorunun ünite ve kazanım bilgilerini, sorunun ait olduğu spesifik ünite/kazanım ile doldur.
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
8.  **Soru Dağılımı:** Toplam ${params.questionCount} adet soruyu, yukarıda listelenen kazanımlar arasında anlamlı ve dengeli bir şekilde dağıtarak oluştur.

Lütfen şimdi istenen sayıda soruyu oluştur.`;
};


export const generateQuestions = async (params: QuestionGenerationParams): Promise<Question[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API anahtarı (API_KEY) yapılandırılmamış. Lütfen Vercel proje ayarlarından API_KEY ortam değişkenini ekleyip dağıtımı yeniden başlattığınızdan emin olun.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = createPrompt(params);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    const jsonString = response.text;
    const questions: Question[] = JSON.parse(jsonString);
    // Bazen model tek soru istendiğinde array yerine object dönebiliyor, bunu düzeltelim.
    if (!Array.isArray(questions)) {
        return [questions];
    }
    return questions;
  } catch (error) {
    console.error("Error generating question(s):", error);
    if (error instanceof SyntaxError) {
        console.error("Failed to parse JSON response from AI.");
        throw new Error("Yapay zeka geçerli bir formatta soru üretemedi. Lütfen tekrar deneyin. Modelden gelen yanıtın formatı bozuk olabilir.");
    }
    throw new Error("Soru üretilirken bir hata oluştu. Lütfen API anahtarınızı kontrol edin veya daha sonra tekrar deneyin.");
  }
};
