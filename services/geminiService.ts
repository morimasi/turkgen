

import type { Question, QuestionGenerationParams, ImageOptions } from '../types';

export const generateQuestions = async (
    params: QuestionGenerationParams,
    onQuestion: (question: Question) => void,
    onError: (error: Error) => void,
    onComplete: () => void
): Promise<void> => {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(`Sunucu hatası: ${errorData.error || 'Bilinmeyen bir hata oluştu.'}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = async () => {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (buffer.trim()) {
                       try {
                           const question: Question = JSON.parse(buffer);
                           onQuestion(question);
                       } catch (e) {
                           console.error("Failed to parse final question JSON from stream:", e, "Line:", buffer);
                       }
                    }
                    break;
                }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    try {
                        const question: Question = JSON.parse(line);
                        onQuestion(question);
                    } catch (e) {
                        console.error("Failed to parse question JSON from stream:", e, "Line:", line);
                    }
                }
            }
        };

        await processStream();
        onComplete();
    } catch (error) {
        console.error("Soru üretme akışı hatası:", error);
        const err = error instanceof Error
            ? new Error(`Soru üretilirken bir ağ hatası oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.`)
            : new Error("Soru üretilirken bilinmeyen bir ağ hatası oluştu.");
        onError(err);
    }
};


export const generateImage = async (prompt: string, options: ImageOptions): Promise<string> => {
    try {
        const response = await fetch('/api/generateImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, options }),
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