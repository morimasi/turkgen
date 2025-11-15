


import type { Question, QuestionGenerationParams } from '../types';

export const generateQuestions = async (
  params: QuestionGenerationParams,
  onQuestionReceived: (question: Question) => void
): Promise<void> => {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Sunucu hatası: ${errorData.error || 'Bilinmeyen bir hata oluştu.'}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
            // Process any remaining data in the buffer when the stream is done
            if (buffer.trim()) {
                try {
                    const question = JSON.parse(buffer);
                    onQuestionReceived(question);
                } catch (e) {
                    console.error("Error parsing final chunk of stream:", e, "Buffer content:", buffer);
                }
            }
            break; // Exit the loop
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // The last item in the array might be an incomplete line, so we keep it in the buffer.
        buffer = lines.pop() || ''; 

        for (const line of lines) {
            if (line.trim()) {
                try {
                    const question = JSON.parse(line);
                    onQuestionReceived(question);
                } catch (e) {
                    console.error("Error parsing streamed JSON line:", e, "Line content:", line);
                    // Skip malformed lines and continue processing the stream
                }
            }
        }
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
