
import React, { useState, useRef } from 'react';
import type { Question, PrintSettings } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface QuestionDisplayProps {
  questions: Question[];
}


// --- Yeni ve Geliştirilmiş Ayarlar Araç Çubuğu ---
interface PrintSettingsToolbarProps {
    settings: PrintSettings;
    setSettings: React.Dispatch<React.SetStateAction<PrintSettings>>;
    onSaveToArchive: () => void;
    onPrint: () => void;
    onDownloadPdf: () => void;
    isPdfProcessing: boolean;
}

const PrintSettingsToolbar: React.FC<PrintSettingsToolbarProps> = ({ 
    settings, 
    setSettings, 
    onSaveToArchive,
    onPrint,
    onDownloadPdf,
    isPdfProcessing
}) => {
    
    const handleSettingChange = (key: keyof PrintSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const ToggleButton: React.FC<{
        labelOn: string;
        labelOff: string;
        iconOn: string;
        iconOff: string;
        isOn: boolean;
        onClick: () => void;
    }> = ({ labelOn, labelOff, iconOn, iconOff, isOn, onClick }) => (
        <button 
            onClick={onClick} 
            title={isOn ? labelOn : labelOff} 
            aria-pressed={isOn}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                isOn 
                ? 'bg-blue-100 text-blue-700 font-semibold' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            } border border-slate-300 shadow-sm`}
        >
            <i className={`fas ${isOn ? iconOn : iconOff} fa-fw`}></i>
            <span className="hidden sm:inline">{isOn ? labelOn : labelOff}</span>
        </button>
    );
    
    const ActionButton: React.FC<{
        label: string;
        icon: string;
        onClick: () => void;
        disabled?: boolean;
        className?: string;
    }> = ({ label, icon, onClick, disabled = false, className = ''}) => (
        <button
            onClick={onClick}
            title={label}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-wait ${className}`}
        >
            <i className={`fas ${icon} fa-fw`}></i>
            <span className="hidden md:inline">{label}</span>
        </button>
    );

    return (
        <div className="no-print p-3 bg-slate-100 border border-slate-200 rounded-lg mb-4 flex flex-wrap items-center justify-between gap-4 shadow-inner">
            {/* Sol & Orta: Ayarlar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {/* Section 1: Metin Biçimi */}
                <div className="flex items-center gap-x-4">
                    <div className="flex items-center" title="Yazı Tipi Boyutu">
                        <i className="fas fa-text-height text-slate-500 mr-2"></i>
                        <input
                            type="number"
                            id="fontSize"
                            aria-label="Yazı tipi boyutu"
                            value={settings.fontSize}
                            onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                            className="w-16 border-slate-300 rounded-md shadow-sm text-sm p-1.5 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="flex items-center" title="Yazı Tipi Ailesi">
                        <i className="fas fa-font text-slate-500 mr-2"></i>
                        <select 
                            id="fontFamily" 
                            aria-label="Yazı tipi ailesi"
                            value={settings.fontFamily} 
                            onChange={(e) => handleSettingChange('fontFamily', e.target.value as 'Inter' | 'Atkinson Hyperlegible')}
                            className="border-slate-300 rounded-md shadow-sm text-sm p-1.5 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Inter">Normal</option>
                            <option value="Atkinson Hyperlegible">Disleksi Dostu</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center" title="Sütun Sayısı">
                        <i className="fas fa-columns text-slate-500 mr-2"></i>
                        <div className="flex items-center rounded-md shadow-sm border border-slate-300">
                            <button onClick={() => handleSettingChange('columns', 1)} className={`px-3 py-1 text-sm rounded-l-md transition ${settings.columns === 1 ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-100'}`} aria-pressed={settings.columns === 1}>1</button>
                            <button onClick={() => handleSettingChange('columns', 2)} className={`px-3 py-1 text-sm rounded-r-md border-l border-slate-300 transition ${settings.columns === 2 ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-100'}`} aria-pressed={settings.columns === 2}>2</button>
                        </div>
                    </div>
                </div>
                
                {/* Divider */}
                <div className="h-6 w-px bg-slate-300 hidden lg:block"></div>

                {/* Section 2: Görünürlük */}
                <div className="flex items-center gap-2">
                    <ToggleButton 
                        labelOn="Cevaplar Görünür" labelOff="Cevaplar Gizli" 
                        iconOn="fa-eye" iconOff="fa-eye-slash" 
                        isOn={!settings.hideAnswers} 
                        onClick={() => handleSettingChange('hideAnswers', !settings.hideAnswers)} 
                    />
                    <ToggleButton 
                        labelOn="Detaylar Görünür" labelOff="Detaylar Gizli" 
                        iconOn="fa-info-circle" iconOff="fa-eye-slash" 
                        isOn={!settings.hideDetails} 
                        onClick={() => handleSettingChange('hideDetails', !settings.hideDetails)} 
                    />
                    <ToggleButton 
                        labelOn="Kenarlık Var" labelOff="Kenarlık Yok" 
                        iconOn="fa-border-all" iconOff="fa-border-none" 
                        isOn={settings.showBorders} 
                        onClick={() => handleSettingChange('showBorders', !settings.showBorders)} 
                    />
                </div>
            </div>

            {/* Sağ: Eylemler */}
            <div className="flex items-center gap-2">
                <ActionButton label="Arşive Kaydet" icon="fa-save" onClick={onSaveToArchive} className="bg-white text-slate-600 hover:bg-slate-100 border border-slate-300"/>
                <ActionButton label="Yazdır" icon="fa-print" onClick={onPrint} className="bg-slate-600 text-white hover:bg-slate-700"/>
                <ActionButton label={isPdfProcessing ? 'İşleniyor...' : 'PDF İndir'} icon={isPdfProcessing ? 'fa-spinner fa-spin' : 'fa-file-pdf'} onClick={onDownloadPdf} disabled={isPdfProcessing} className="bg-blue-600 text-white hover:bg-blue-700"/>
            </div>
        </div>
    );
};


const QuestionPreview: React.FC<{ 
    question: Question; 
    settings: PrintSettings; 
    index: number;
    onFeedback: (index: number, feedback: string) => void;
    feedbackStatus?: string;
}> = ({ question, settings, index, onFeedback, feedbackStatus }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const handleFeedbackClick = (feedback: string) => {
    onFeedback(index, feedback);
    setIsPopoverOpen(false);
  };

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
        
        {/* Feedback section */}
        <div className="no-print mt-4 pt-4 border-t border-gray-200 flex justify-end items-center relative">
            {feedbackStatus ? (
                <span className="text-sm font-medium text-green-600"><i className="fas fa-check-circle mr-2"></i>Değerlendirmeniz için teşekkürler!</span>
            ) : (
                <div>
                    <button 
                        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                        className="text-sm text-gray-600 hover:text-blue-600 font-medium py-1 px-3 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <i className="fas fa-star mr-2"></i> Soruyu Değerlendir
                    </button>
                    {isPopoverOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border z-10">
                            <button onClick={() => handleFeedbackClick('harika')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800">
                                <i className="fas fa-thumbs-up fa-fw mr-3 text-green-500"></i> Harika
                            </button>
                            <button onClick={() => handleFeedbackClick('duzeltilmeli')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-800">
                                <i className="fas fa-pencil fa-fw mr-3 text-yellow-500"></i> Düzeltilmeli
                            </button>
                            <button onClick={() => handleFeedbackClick('ise_yaramaz')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-800">
                                <i className="fas fa-thumbs-down fa-fw mr-3 text-red-500"></i> İşe Yaramaz
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};


export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ questions }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');
  const [copied, setCopied] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<{ [key: number]: string }>({});

  const handleFeedback = (questionIndex: number, rating: string) => {
    setFeedback(prev => ({ ...prev, [questionIndex]: rating }));
  };

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
        
        pdf.save(`turkgen-sorular-${Date.now()}.pdf`);
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

        const archive = JSON.parse(localStorage.getItem('turkGenSoruArsivi') || '[]');
        const newExam = {
            id: `exam-${Date.now()}`,
            name: examName,
            date: new Date().toISOString(),
            questions: questions
        };
        archive.push(newExam);
        localStorage.setItem('turkGenSoruArsivi', JSON.stringify(archive));
        alert(`"${examName}" başarıyla arşive kaydedildi!`);
    } catch (error) {
        console.error("Arşive kaydederken hata oluştu:", error);
        alert("Arşive kaydederken bir hata oluştu. Tarayıcınızda yeterli alan olmayabilir.");
    }
  };

  const printAreaClasses = [
    printSettings.fontFamily === 'Atkinson Hyperlegible' ? 'font-atkinson-hyperlegible' : 'font-inter',
    printSettings.hideAnswers ? 'answer-hidden' : '',
    printSettings.hideDetails ? 'details-hidden' : '',
    'bg-white', // PDF için beyaz arka planı garantile
  ].join(' ');
  
  const printAreaStyles: React.CSSProperties = {
      fontSize: `${printSettings.fontSize}pt`,
      columnCount: printSettings.columns,
      columnGap: '20px'
  };

  return (
    <div className="w-full">
      <div className="no-print mb-4 border-b border-gray-200">
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
      </div>

      <div>
        {activeTab === 'preview' ? (
          <>
            <PrintSettingsToolbar 
                settings={printSettings} 
                setSettings={setPrintSettings} 
                onSaveToArchive={handleSaveToArchive}
                onPrint={handlePrint}
                onDownloadPdf={handleDownloadPdf}
                isPdfProcessing={isProcessingPdf}
            />
            <div id="print-area" ref={printAreaRef} className={printAreaClasses} style={printAreaStyles}>
              {questions.map((q, index) => (
                  <QuestionPreview 
                    key={index} 
                    question={q} 
                    settings={printSettings} 
                    index={index}
                    onFeedback={handleFeedback}
                    feedbackStatus={feedback[index]}
                  />
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