
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
