import React, { useState, useRef } from 'react';
import type { Question, PrintSettings } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface QuestionDisplayProps {
  questions: Question[];
}

const PrintSettingsToolbar: React.FC<{ settings: PrintSettings, setSettings: React.Dispatch<React.SetStateAction<PrintSettings>>, onSaveToArchive: () => void }> = ({ settings, setSettings, onSaveToArchive }) => {
    
    const handleSettingChange = (key: keyof PrintSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const SettingButton: React.FC<{icon: string, label: string, onClick: () => void, isActive?: boolean}> = ({icon, label, onClick, isActive = false}) => (
        <button onClick={onClick} title={label} className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            <i className={`fas ${icon} fa-fw`}></i>
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    return (
        <div className="no-print p-3 bg-gray-100 rounded-lg mb-4 flex flex-wrap items-center gap-3 border border-gray-200">
            <div className="flex items-center space-x-2">
                <label htmlFor="fontSize" className="text-sm font-medium text-gray-700">Punto:</label>
                <input
                    type="number"
                    id="fontSize"
                    value={settings.fontSize}
                    onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                    className="w-16 border-gray-300 rounded-md shadow-sm text-sm p-1"
                />
            </div>
             <div className="flex items-center space-x-2">
                <label htmlFor="fontFamily" className="text-sm font-medium text-gray-700">Font:</label>
                <select 
                    id="fontFamily" 
                    value={settings.fontFamily} 
                    onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm text-sm p-1"
                >
                    <option value="Inter">Normal</option>
                    <option value="OpenDyslexic">Disleksi Dostu</option>
                </select>
            </div>
             <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sütun:</label>
                <SettingButton icon="fa-minus" label="1" onClick={() => handleSettingChange('columns', 1)} isActive={settings.columns === 1} />
                <SettingButton icon="fa-columns" label="2" onClick={() => handleSettingChange('columns', 2)} isActive={settings.columns === 2} />
            </div>
            <div className="flex items-center space-x-2">
                 <SettingButton icon={settings.hideAnswers ? "fa-eye-slash" : "fa-eye"} label="Cevaplar" onClick={() => handleSettingChange('hideAnswers', !settings.hideAnswers)} isActive={!settings.hideAnswers} />
                 <SettingButton icon={settings.hideDetails ? "fa-eye-slash" : "fa-eye"} label="Detaylar" onClick={() => handleSettingChange('hideDetails', !settings.hideDetails)} isActive={!settings.hideDetails} />
                 <SettingButton icon="fa-border-all" label="Kenarlık" onClick={() => handleSettingChange('showBorders', !settings.showBorders)} isActive={settings.showBorders} />
            </div>
             <div className="flex items-center">
                 <button onClick={onSaveToArchive} title="Arşive Kaydet" className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-green-600 text-white hover:bg-green-700">
                    <i className="fas fa-save fa-fw"></i>
                    <span className="hidden sm:inline">Arşive Kaydet</span>
                </button>
            </div>
        </div>
    );
};


const QuestionPreview: React.FC<{ question: Question, settings: PrintSettings }> = ({ question, settings }) => {
  return (
    <div className={`bg-white text-left mb-6 break-inside-avoid ${settings.showBorders ? 'border border-gray-200 rounded-lg p-6 shadow-sm' : 'p-2'}`}>
        {/* Header */}
        <div className="mb-4 border-b border-gray-200 pb-3">
            <p className="text-sm font-semibold text-blue-700">{question.sinif}. Sınıf &bull; {question.unite_adi}</p>
            <p className="text-xs text-gray-500 mt-1">{question.kazanim_kodu} {question.kazanim_metni}</p>
        </div>
        
        {/* Paragraph */}
        {question.paragraf_metni && (
            <p className="mb-5 p-4 bg-slate-50 border-l-4 border-slate-300 text-gray-800 leading-relaxed text-base">{question.paragraf_metni}</p>
        )}
        
        {/* Question Text */}
        <p className="font-bold text-lg text-gray-900 mb-5 leading-snug">{question.soru_metni}</p>
        
        {/* Multiple Choice Options */}
        {question.soru_tipi === 'coktan_secmeli' && question.secenekler && (
            <div className="space-y-3">
                {Object.entries(question.secenekler).map(([key, value]) => (
                    <div key={key} className={`flex items-start p-3 border rounded-lg transition-colors text-base correct-answer-indicator
                        ${key === question.dogru_cevap 
                            ? 'bg-green-50 border-green-400 text-green-900 font-medium' 
                            : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-300'}`
                        }
                    >
                        <span className="font-bold mr-3">{key})</span> 
                        <span className="flex-1">{value}</span>
                    </div>
                ))}
            </div>
        )}

        {/* True/False Answer */}
        {question.soru_tipi === 'dogru_yanlis' && (
             <div className="mt-4">
                <p className={`font-semibold p-3 border rounded-lg inline-block correct-answer-indicator-text
                    ${question.dogru_cevap === 'Doğru' 
                        ? 'bg-green-50 border-green-400 text-green-900' 
                        : 'bg-red-50 border-red-400 text-red-900'}`
                }>
                    Doğru Cevap: {question.dogru_cevap}
                </p>
             </div>
        )}

        {/* Fill in the blank Answer */}
        {question.soru_tipi === 'bosluk_doldurma' && (
            <div className="mt-4">
                <p className="font-semibold p-3 border rounded-lg bg-green-50 border-green-400 text-green-900 inline-block correct-answer-indicator-text">
                    Doğru Cevap: {question.dogru_cevap}
                </p>
            </div>
        )}

        {/* Details section */}
        <div className="mt-6 pt-4 border-t border-gray-200">
            <details open>
                <summary className="cursor-pointer text-sm font-semibold text-gray-600 hover:text-gray-900">
                    Çözüm ve Pedagojik Detaylar <i className="fas fa-chevron-down fa-xs ml-1"></i>
                </summary>
                <div className="mt-3 text-sm space-y-3 p-4 bg-blue-50/50 rounded-md border border-blue-100">
                    <p><strong className="font-semibold text-gray-800">Çözüm Anahtarı:</strong> <span className="text-gray-700">{question.cozum_anahtari}</span></p>
                    <p><strong className="font-semibold text-gray-800">Gerçek Yaşam Bağlantısı:</strong> <span className="text-gray-700">{question.gercek_yasam_baglantisi}</span></p>
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
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
      fontSize: 12,
      fontFamily: 'Inter',
      columns: 1,
      hideAnswers: false,
      hideDetails: false,
      showBorders: true,
  });

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
  
  const handleSaveToArchive = () => {
    try {
        const examName = prompt("Bu sınav setine bir ad verin:", `Sınav - ${new Date().toLocaleDateString('tr-TR')}`);
        if (!examName) return;

        const archive = JSON.parse(localStorage.getItem('turkceSoruArsivi') || '[]');
        const newExam = {
            id: `exam-${Date.now()}`,
            name: examName,
            date: new Date().toISOString(),
            questions: questions
        };
        archive.push(newExam);
        localStorage.setItem('turkceSoruArsivi', JSON.stringify(archive));
        alert(`"${examName}" başarıyla arşive kaydedildi!`);
    } catch (error) {
        console.error("Arşive kaydederken hata oluştu:", error);
        alert("Arşive kaydederken bir hata oluştu. Tarayıcınızda yeterli alan olmayabilir.");
    }
  };

  const printAreaClasses = [
    printSettings.fontFamily === 'OpenDyslexic' ? 'font-opendyslexic' : '',
    printSettings.hideAnswers ? 'answer-hidden' : '',
    printSettings.hideDetails ? 'details-hidden' : '',
    'bg-white', // Ensure white background for PDF
  ].join(' ');
  
  const printAreaStyles: React.CSSProperties = {
      fontSize: `${printSettings.fontSize}pt`,
      columnCount: printSettings.columns,
      columnGap: '20px'
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
          <>
            <PrintSettingsToolbar settings={printSettings} setSettings={setPrintSettings} onSaveToArchive={handleSaveToArchive} />
            <div id="print-area" ref={printAreaRef} className={printAreaClasses} style={printAreaStyles}>
              {questions.map((q, index) => (
                  <QuestionPreview key={index} question={q} settings={printSettings} />
              ))}
            </div>
          </>
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