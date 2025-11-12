import React, { useState, useRef } from 'react';
import type { Question } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface QuestionDisplayProps {
  questions: Question[];
}

const QuestionPreview: React.FC<{ question: Question }> = ({ question }) => {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 text-left mb-4 break-inside-avoid">
        <div className="mb-4">
            <p className="text-sm text-gray-600 font-medium">{question.sinif}. Sınıf &bull; {question.unite_adi}</p>
            <p className="text-xs text-gray-500">{question.kazanim_kodu} {question.kazanim_metni}</p>
        </div>
        
        {question.paragraf_metni && (
            <p className="mb-4 p-3 bg-white border-l-4 border-blue-200 italic text-gray-700">{question.paragraf_metni}</p>
        )}
        
        <p className="font-semibold mb-4">{question.soru_metni}</p>
        
        {question.soru_tipi === 'coktan_secmeli' && question.secenekler && (
            <div className="space-y-2">
                {Object.entries(question.secenekler).map(([key, value]) => (
                    <div key={key} className={`p-2 border rounded-md ${key === question.dogru_cevap ? 'bg-green-100 border-green-300' : 'bg-white'}`}>
                        <span className="font-bold">{key})</span> {value}
                    </div>
                ))}
            </div>
        )}

        {question.soru_tipi === 'dogru_yanlis' && (
             <p className={`font-bold p-2 border rounded-md ${question.dogru_cevap === 'Doğru' ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>Doğru Cevap: {question.dogru_cevap}</p>
        )}

        {question.soru_tipi === 'bosluk_doldurma' && (
             <p className="font-bold p-2 border rounded-md bg-green-100 border-green-300">Doğru Cevap: {question.dogru_cevap}</p>
        )}

        <div className="mt-4 pt-3 border-t">
            <details>
                <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">Çözüm ve Detaylar</summary>
                <div className="mt-2 text-sm space-y-2">
                    <p><strong className="font-semibold">Çözüm:</strong> {question.cozum_anahtari}</p>
                    <p><strong className="font-semibold">Gerçek Yaşam Bağlantısı:</strong> {question.gercek_yasam_baglantisi}</p>
                </div>
            </details>
        </div>

    </div>
  );
};


export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ questions }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');
  const [copied, setCopied] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const jsonString = JSON.stringify(questions, null, 2);
  const jsonlString = questions.map(q => JSON.stringify(q)).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonlString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsProcessingPdf(true);
    try {
        const canvas = await html2canvas(printAreaRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        const imgWidth = pdfWidth - 20; // 10mm margin on each side
        const imgHeight = imgWidth / ratio;
        
        let heightLeft = imgHeight;
        let position = 10; // top margin

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);

        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10; // reset top position
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);
        }
        
        pdf.save(`turkce-sorular-${Date.now()}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("PDF oluşturulurken bir hata oluştu.");
    } finally {
        setIsProcessingPdf(false);
    }
  };


  return (
    <div className="w-full">
      <div className="no-print mb-4 border-b border-gray-200 flex justify-between items-center">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`${activeTab === 'preview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
          >
            Önizleme
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`${activeTab === 'json' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
          >
            JSON
          </button>
        </nav>
        {activeTab === 'preview' && (
            <div className="flex items-center space-x-2">
                 <button onClick={handlePrint} className="text-gray-600 hover:text-blue-600 p-2 rounded-md transition-colors" title="Yazdır"><i className="fas fa-print"></i></button>
                 <button onClick={handleDownloadPdf} disabled={isProcessingPdf} className="text-gray-600 hover:text-blue-600 p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait" title="PDF İndir">
                    {isProcessingPdf ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
                </button>
            </div>
        )}
      </div>

      <div>
        {activeTab === 'preview' ? (
          <div id="print-area" ref={printAreaRef}>
            {questions.map((q, index) => (
                <QuestionPreview key={index} question={q} />
            ))}
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 bg-gray-700 text-white px-3 py-1 rounded-md text-xs hover:bg-gray-600 transition-colors no-print"
            >
              {copied ? <><i className="fas fa-check mr-1"></i>Kopyalandı!</> : <><i className="fas fa-copy mr-1"></i>JSONL Kopyala</>}
            </button>
            <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
              <code>{jsonString}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};