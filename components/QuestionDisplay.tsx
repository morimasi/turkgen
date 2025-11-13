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
        label: string;
        iconOn: string;
        iconOff: string;
        isOn: boolean;
        onClick: () => void;
    }> = ({ label, iconOn, iconOff, isOn, onClick }) => (
        <button 
            onClick={onClick} 
            title={label} 
            aria-pressed={isOn}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                isOn 
                ? 'bg-primary-100 text-primary-700 font-semibold' 
                : 'bg-surface text-text-secondary hover:bg-worksheet-surface'
            } border border-border shadow-sm`}
        >
            <i className={`fas ${isOn ? iconOn : iconOff} fa-fw`}></i>
            <span className="hidden sm:inline">{label}</span>
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
        <div className="no-print p-3 bg-background border border-border rounded-lg mb-4 flex flex-col gap-4 shadow-inner">
             {/* Üst Satır: Başlık ve Eylemler */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-grow" title="Sınav Başlığı">
                    <i className="fas fa-heading text-text-secondary fa-fw text-lg"></i>
                    <input
                        type="text"
                        id="examTitle"
                        placeholder="Sınav Başlığı Girin..."
                        value={settings.examTitle}
                        onChange={(e) => handleSettingChange('examTitle', e.target.value)}
                        className="flex-grow bg-surface border-border rounded-md shadow-sm text-base p-1.5 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <ActionButton label="Arşive Kaydet" icon="fa-save" onClick={onSaveToArchive} className="bg-surface text-text-secondary hover:bg-worksheet-surface border border-border"/>
                    <ActionButton label="Yazdır" icon="fa-print" onClick={onPrint} className="bg-text-secondary text-surface hover:opacity-80"/>
                    <ActionButton label={isPdfProcessing ? 'İşleniyor...' : 'PDF İndir'} icon={isPdfProcessing ? 'fa-spinner fa-spin' : 'fa-file-pdf'} onClick={onDownloadPdf} disabled={isPdfProcessing} className="bg-primary-600 text-on-primary hover:bg-primary-700"/>
                </div>
            </div>

            {/* Alt Satır: Ayarlar ve Görünürlük */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 border-t border-border">
                {/* Görünürlük Ayarları */}
                <div className="flex items-center gap-2">
                    <ToggleButton label="Başlık" iconOn="fa-eye" iconOff="fa-eye-slash" isOn={settings.showExamTitle} onClick={() => handleSettingChange('showExamTitle', !settings.showExamTitle)} />
                    <ToggleButton label="Kazanımlar" iconOn="fa-info-circle" iconOff="fa-eye-slash" isOn={settings.showWorksheetHeader} onClick={() => handleSettingChange('showWorksheetHeader', !settings.showWorksheetHeader)} />
                    <ToggleButton label="Soru No" iconOn="fa-list-ol" iconOff="fa-eye-slash" isOn={settings.showQuestionNumbers} onClick={() => handleSettingChange('showQuestionNumbers', !settings.showQuestionNumbers)} />
                    <ToggleButton label="Cevaplar" iconOn="fa-key" iconOff="fa-eye-slash" isOn={!settings.hideAnswers} onClick={() => handleSettingChange('hideAnswers', !settings.hideAnswers)} />
                    <ToggleButton label="Detaylar" iconOn="fa-book-open" iconOff="fa-eye-slash" isOn={!settings.hideDetails} onClick={() => handleSettingChange('hideDetails', !settings.hideDetails)} />
                    <ToggleButton label="Kenarlık" iconOn="fa-border-all" iconOff="fa-border-none" isOn={settings.showBorders} onClick={() => handleSettingChange('showBorders', !settings.showBorders)} />
                </div>
                <div className="h-6 w-px bg-border hidden lg:block"></div>
                 {/* Biçim Ayarları */}
                <div className="flex items-center gap-x-4">
                    <div className="flex items-center" title="Yazı Tipi Boyutu">
                        <i className="fas fa-text-height text-text-secondary mr-2"></i>
                        <input type="number" id="fontSize" value={settings.fontSize} onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))} className="w-16 bg-surface border-border rounded-md shadow-sm text-sm p-1.5"/>
                    </div>
                    <div className="flex items-center" title="Yazı Tipi Ailesi">
                        <i className="fas fa-font text-text-secondary mr-2"></i>
                        <select id="fontFamily" value={settings.fontFamily} onChange={(e) => handleSettingChange('fontFamily', e.target.value as 'Inter' | 'Atkinson Hyperlegible')} className="bg-surface border-border rounded-md shadow-sm text-sm p-1.5">
                            <option value="Inter">Normal</option>
                            <option value="Atkinson Hyperlegible">Disleksi Dostu</option>
                        </select>
                    </div>
                    <div className="flex items-center" title="Sütun Sayısı">
                        <i className="fas fa-columns text-text-secondary mr-2"></i>
                        <div className="flex items-center rounded-md shadow-sm border border-border">
                            <button onClick={() => handleSettingChange('columns', 1)} className={`px-3 py-1 text-sm rounded-l-md transition ${settings.columns === 1 ? 'bg-primary-600 text-on-primary' : 'bg-surface hover:bg-worksheet-surface'}`}>1</button>
                            <button onClick={() => handleSettingChange('columns', 2)} className={`px-3 py-1 text-sm rounded-r-md border-l border-border transition ${settings.columns === 2 ? 'bg-primary-600 text-on-primary' : 'bg-surface hover:bg-worksheet-surface'}`}>2</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const WorksheetHeader: React.FC<{ questions: Question[] }> = ({ questions }) => {
    if (!questions || questions.length === 0) return null;

    const firstQuestion = questions[0];
    const grade = firstQuestion.sinif;

    const uniqueUnits = [...new Map(questions.map(q => [q.unite_no, q.unite_adi])).values()].join(', ');
    
    return (
        <div className="border-2 border-dashed border-border rounded-lg p-4 mb-8 text-sm break-inside-avoid">
            <h2 className="text-lg font-bold text-text-primary mb-2">{grade}. Sınıf Türkçe</h2>
            <div className="space-y-2">
                <p><strong className="font-semibold text-text-secondary">Üniteler:</strong> {uniqueUnits}</p>
                <div>
                    <strong className="font-semibold text-text-secondary">Kazanımlar:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        {[...new Map(questions.map(item => [item.kazanim_kodu, item.kazanim_metni])).entries()].map(([code, text]) => (
                            <li key={code} className="text-text-secondary">{code} {text}</li>
                        ))}
                    </ul>
                </div>
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
    <div className={`bg-surface text-left mb-6 break-inside-avoid ${settings.showBorders ? 'border border-border rounded-lg p-6 shadow-sm' : 'p-2'}`}>
        {/* Paragraph */}
        {question.paragraf_metni && (
            <p className="mb-5 p-4 bg-background border-l-4 border-border text-text-primary leading-relaxed text-base">{question.paragraf_metni}</p>
        )}
        
        {/* Question Text */}
        <p className="font-bold text-lg text-text-primary mb-5 leading-snug">
             {settings.showQuestionNumbers && <strong className="mr-2">{index + 1}.</strong>}
            {question.soru_metni}
        </p>
        
        {/* Multiple Choice Options */}
        {question.soru_tipi === 'coktan_secmeli' && question.secenekler && (
            <div className="space-y-3">
                {Object.entries(question.secenekler).map(([key, value]) => (
                    <div key={key} className={`flex items-start p-3 border rounded-lg transition-colors text-base correct-answer-indicator
                        ${key === question.dogru_cevap 
                            ? 'bg-success-50 border-success-400 text-success-900 font-medium' 
                            : 'bg-surface border-border text-text-primary hover:bg-worksheet-surface'}`
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
                        ? 'bg-success-50 border-success-400 text-success-900' 
                        : 'bg-danger-50 border-danger-400 text-danger-900'}`
                }>
                    Doğru Cevap: {question.dogru_cevap}
                </p>
             </div>
        )}

        {/* Fill in the blank Answer */}
        {question.soru_tipi === 'bosluk_doldurma' && (
            <div className="mt-4">
                <p className="font-semibold p-3 border rounded-lg bg-success-50 border-success-400 text-success-900 inline-block correct-answer-indicator-text">
                    Doğru Cevap: {question.dogru_cevap}
                </p>
            </div>
        )}

        {/* Details section */}
        <div className="mt-6 pt-4 border-t border-border">
            <details open>
                <summary className="cursor-pointer text-sm font-semibold text-text-secondary hover:text-text-primary">
                    Çözüm ve Pedagojik Detaylar <i className="fas fa-chevron-down fa-xs ml-1"></i>
                </summary>
                <div className="mt-3 text-sm space-y-3 p-4 bg-primary-100/50 rounded-md border border-primary-100">
                    <p><strong className="font-semibold text-text-primary">Çözüm Anahtarı:</strong> <span className="text-text-secondary">{question.cozum_anahtari}</span></p>
                    <p><strong className="font-semibold text-text-primary">Gerçek Yaşam Bağlantısı:</strong> <span className="text-text-secondary">{question.gercek_yasam_baglantisi}</span></p>
                </div>
            </details>
        </div>
        
        {/* Feedback section */}
        <div className="no-print mt-4 pt-4 border-t border-border flex justify-end items-center relative">
            {feedbackStatus ? (
                <span className="text-sm font-medium text-green-600"><i className="fas fa-check-circle mr-2"></i>Değerlendirmeniz için teşekkürler!</span>
            ) : (
                <div>
                    <button 
                        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                        className="text-sm text-text-secondary hover:text-primary-600 font-medium py-1 px-3 rounded-md bg-worksheet-surface hover:opacity-80 transition-colors"
                    >
                        <i className="fas fa-star mr-2"></i> Soruyu Değerlendir
                    </button>
                    {isPopoverOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface rounded-lg shadow-xl border z-10">
                            <button onClick={() => handleFeedbackClick('harika')} className="w-full text-left flex items-center px-4 py-2 text-sm text-text-primary hover:bg-green-50 hover:text-green-800">
                                <i className="fas fa-thumbs-up fa-fw mr-3 text-green-500"></i> Harika
                            </button>
                            <button onClick={() => handleFeedbackClick('duzeltilmeli')} className="w-full text-left flex items-center px-4 py-2 text-sm text-text-primary hover:bg-yellow-50 hover:text-yellow-800">
                                <i className="fas fa-pencil fa-fw mr-3 text-yellow-500"></i> Düzeltilmeli
                            </button>
                            <button onClick={() => handleFeedbackClick('ise_yaramaz')} className="w-full text-left flex items-center px-4 py-2 text-sm text-text-primary hover:bg-red-50 hover:text-red-800">
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
      showQuestionNumbers: true,
      showWorksheetHeader: true,
      showExamTitle: true,
      examTitle: 'Türkçe Dersi Çalışma Kağıdı',
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
    'bg-surface', // PDF için beyaz arka planı garantile
  ].join(' ');
  
  const printAreaStyles: React.CSSProperties = {
      fontSize: `${printSettings.fontSize}pt`,
      columnCount: printSettings.columns,
      columnGap: '20px'
  };

  return (
    <div className="w-full">
      <div className="no-print mb-4 border-b border-border">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`${activeTab === 'preview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
          >
            Önizleme
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`${activeTab === 'json' ? 'border-primary-500 text-primary-600' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
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
              {printSettings.showExamTitle && printSettings.examTitle && (
                  <h1 className="text-2xl font-bold text-center mb-6 break-after-avoid">{printSettings.examTitle}</h1>
              )}
              {printSettings.showWorksheetHeader && <WorksheetHeader questions={questions} />}
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