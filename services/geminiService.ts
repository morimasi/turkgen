import { GoogleGenAI } from "@google/genai";
import type { Question, QuestionGenerationParams } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `Sen, Türk Dili ve Edebiyatı alanında uzman bir profesörsün. Aynı zamanda Türkiye Millî Eğitim Bakanlığı (MEB) Talim ve Terbiye Kurulu'nda görev almış bir ölçme-değerlendirme duayenisin. Görevin, 2025 yılı MEB Türkçe Dersi Öğretim Programı'nı temel alarak, akademik titizlik ve pedagojik derinlikle, belirtilen kriterlere uygun, özgün ve nitelikli sorular hazırlamaktır. Ürettiğin sorular, sadece dilbilgisel doğruluğu değil, aynı zamanda öğrencinin eleştirel düşünme ve anlama becerilerini de ölçmelidir. Çıktın, yalnızca istenen JSON formatında, bir dizi (array) içinde olmalı, başka hiçbir metin, açıklama veya markdown içermemelidir.`;

const createPrompt = (params: QuestionGenerationParams): string => {
  const jsonStructure = {
    sinif: params.grade,
    unite_adi: params.unitName,
    unite_no: params.unitNo,
    kazanim_kodu: params.objectiveCode,
    kazanim_metni: params.objectiveText,
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

  return `
Aşağıdaki kriterlere ve kurallara göre ${params.questionCount} adet Türkçe sorusu oluştur ve cevabını yalnızca her bir soru nesnesini içeren tek bir JSON dizisi (array) formatında döndür.

**Kriterler:**
- Sınıf: ${params.grade}
- Ünite: "${params.unitName}"
- Kazanım: "${params.objectiveCode} - ${params.objectiveText}"
- Soru Tipi: "${params.questionType}"
- Zorluk Seviyesi: "${params.difficulty}"
${params.customInstructions ? `- Ek Talimatlar: "${params.customInstructions}"` : ''}

**Kurallar:**
1.  **JSON Yapısı:** Çıktın, aşağıdaki yapıya uyan soru nesnelerinden oluşan bir JSON dizisi \`[...]\` olmalıdır.
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
    -   \`yanlis_secenek_tipleri\`: Çeldiricilerin mantığını açıklayan kısa ifadeler kullan (Örn: "Zıt anlamlı çeldirici", "Yakın anlamlı çeldirici").
    -   \`gercek_yasam_baglantisi\`: Kazanımın günlük hayattaki önemini tek cümleyle açıkla.
    -   \`cozum_anahtari\`: Çözüm yolunu 1-2 cümleyle net bir şekilde anlat.
    -   \`seviye\`: Kazanımın Bloom taksonomisine göre zorluğunu yansıtmalı ('temel', 'orta', 'ileri').

Lütfen şimdi istenen sayıda soruyu oluştur.`;
};


export const generateQuestions = async (params: QuestionGenerationParams): Promise<Question[]> => {
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