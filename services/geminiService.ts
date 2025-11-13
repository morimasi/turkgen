
import type { Question, QuestionGenerationParams } from '../types';

export const generateQuestions = async (params: QuestionGenerationParams): Promise<Question[]> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      // Sunucudan gelen hata mesajını ayrıştırmaya çalış
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Sunucu hatası: ${errorData.error || 'Bilinmeyen bir hata oluştu.'}`);
    }

    const questions: Question[] = await response.json();
    return questions;

  } catch (error) {
    console.error("Soru üretme hatası:", error);
    if (error instanceof Error) {
        // Kullanıcıya daha anlaşılır bir mesajla hatayı yeniden fırlat
        throw new Error(`Soru üretilirken bir ağ hatası oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.`);
    }
    throw new Error("Soru üretilirken bilinmeyen bir ağ hatası oluştu.");
  }
};

export const generateImage = async (prompt: string, quality: 'high' | 'fast'): Promise<string> => {
    try {
        const response = await fetch('/api/generateImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, quality }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(`Sunucu hatası: ${errorData.error || 'Bilinmeyen bir hata oluştu.'}`);
        }

        const data = await response.json();
        if (!data.image) {
            throw new Error("API'den geçerli bir görsel verisi alınamadı.");
        }
        return data.image;

    } catch (error) {
        console.error("Görsel üretme hatası:", error);
        if (error instanceof Error) {
            throw new Error(`Görsel üretilirken bir ağ hatası oluştu. Lütfen tekrar deneyin.`);
        }
        throw new Error("Görsel üretilirken bilinmeyen bir ağ hatası oluştu.");
    }
};