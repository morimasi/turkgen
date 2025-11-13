import React, { useState, useRef, useEffect } from 'react';
import type { Question, PrintSettings, NotificationData } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateImage } from '../services/geminiService';

interface QuestionDisplayProps {
  questions: Question[];
  setNotification: (notification: NotificationData | null) => void;
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
                    <ToggleButton label="Sade Zemin" iconOn="fa-file" iconOff="fa-palette" isOn={settings.useWhiteBackground} onClick={() => handleSettingChange('useWhiteBackground', !settings.useWhiteBackground)} />
                </div>
                <div className="h-6 w-px bg-border hidden lg:block"></div>
                 {/* Biçim Ayarları */}
                <div className="flex items-center gap-x-4 flex-wrap gap-y-3">
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
                     <div className="flex items-center" title="Satır Aralığı">
                        <i className="fas fa-align-left text-text-secondary mr-2"></i>
                        <input type="range" min="1.2" max="2.5" step="0.1" value={settings.lineHeight} onChange={(e) => handleSettingChange('lineHeight', parseFloat(e.target.value))} className="w-24 h-2 bg-worksheet-surface rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-mono text-text-secondary w-10 text-right">{settings.lineHeight.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center" title="Sorular Arası Boşluk">
                        <i className="fas fa-arrows-alt-v text-text-secondary mr-2"></i>
                        <input type="range" min="8" max="64" step="4" value={settings.questionSpacing} onChange={(e) => handleSettingChange('questionSpacing', parseInt(e.target.value, 10))} className="w-24 h-2 bg-worksheet-surface rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-mono text-text-secondary w-12 text-right">{settings.questionSpacing}px</span>
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
        <div className="border-2 border-dashed border-border rounded-lg p-4 mb-8 break-inside-avoid">
            <h2 className="font-bold text-text-primary mb-2">{grade}. Sınıf Türkçe</h2>
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

// --- GÖRSEL AYARLARI ---
type ImageStyle = 'Çizgi Film' | 'Gerçekçi' | 'Suluboya' | 'Çizgi Roman';
type ImagePalette = 'Canlı Renkler' | 'Pastel Tonlar' | 'Siyah-Beyaz';
type ImageQuality = 'high' | 'fast';

interface ImageSettings {
    style: ImageStyle;
    palette: ImagePalette;
    quality: ImageQuality;
}

const PopoverRadioGroup: React.FC<{
    label: string;
    options: string[];
    selectedValue: string;
    onChange: (value: any) => void;
}> = ({ label, options, selectedValue, onChange }) => (
    <div>
        <label className="block text-xs font-semibold text-text-secondary mb-2">{label}</label>
        <div className="flex items-center gap-2">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        selectedValue === option
                            ? 'bg-primary-600 text-on-primary border-primary-600'
                            : 'bg-surface text-text-secondary hover:bg-worksheet-surface border-border'
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
);

const ImageSettingsPopover: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (settings: ImageSettings) => void;
    settings: ImageSettings;
    setSettings: React.Dispatch<React.SetStateAction<ImageSettings>>;
    anchorRef: React.RefObject<HTMLDivElement>;
}> = ({ isOpen, onClose, onGenerate, settings, setSettings, anchorRef }) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                anchorRef.current &&
                !anchorRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, anchorRef]);

    if (!isOpen) return null;

    return (
        <div ref={popoverRef} className="absolute bottom-full right-0 mb-2 w-72 z-20 bg-surface rounded-lg shadow-xl border border-border p-4 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-text-primary">Görsel Ayarları</h4>
                <button onClick={onClose} className="text-text-secondary hover:text-text-primary">&times;</button>
            </div>
            <div className="space-y-4">
                <PopoverRadioGroup
                    label="Stil"
                    options={['Çizgi Film', 'Gerçekçi', 'Suluboya', 'Çizgi Roman']}
                    selectedValue={settings.style}
                    onChange={(value) => setSettings(s => ({ ...s, style: value }))}
                />
                 <PopoverRadioGroup
                    label="Renk Paleti"
                    options={['Canlı Renkler', 'Pastel Tonlar', 'Siyah-Beyaz']}
                    selectedValue={settings.palette}
                    onChange={(value) => setSettings(s => ({ ...s, palette: value }))}
                />
                 <PopoverRadioGroup
                    label="Kalite ve Hız"
                    options={['Yüksek', 'Hızlı']}
                    selectedValue={settings.quality === 'high' ? 'Yüksek' : 'Hızlı'}
                    onChange={(value) => setSettings(s => ({ ...s, quality: value === 'Yüksek' ? 'high' : 'fast' }))}
                />
            </div>
             <button
                onClick={() => onGenerate(settings)}
                className="w-full mt-5 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-on-primary bg-primary-600 hover:bg-primary-700"
            >
                <i className="fas fa-magic mr-2"></i> Oluştur
            </button>
        </div>
    );
};


const QuestionPreview: React.FC<{ 
    question: Question; 
    settings: PrintSettings; 
    index: number;
    onFeedback: (feedback: string) => void;
    onGenerateImage: (index: number, prompt: string, quality: ImageQuality) => void;
    generatedImage?: string;
    isImageLoading?: boolean;
    className?: string;
    style?: React.CSSProperties;
}> = ({ question, settings, index, onFeedback, onGenerateImage, generatedImage, isImageLoading, className = '', style }) => {
  const [isFeedbackPopoverOpen, setIsFeedbackPopoverOpen] = useState(false);
  const [isImageSettingsOpen, setIsImageSettingsOpen] = useState(false);
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
      style: 'Çizgi Film',
      palette: 'Canlı Renkler',
      quality: 'high',
  });
  const imageButtonRef = useRef<HTMLDivElement>(null);

  
  const handleFeedbackClick = (feedback: string) => {
    onFeedback(feedback);
    setIsFeedbackPopoverOpen(false);
  };
  
  const constructImagePrompt = (baseText: string, settings: ImageSettings): string => {
    let promptParts: string[] = [];
    switch (settings.style) {
        case 'Çizgi Film': promptParts.push("Çocukların seveceği, neşeli bir çizgi film tarzında, basit ve net hatlarla,"); break;
        case 'Gerçekçi': promptParts.push("Yüksek detaylı, fotogerçekçi bir tarzda,"); break;
        case 'Suluboya': promptParts.push("Yumuşak renk geçişlerine sahip, estetik bir suluboya resim tarzında,"); break;
        case 'Çizgi Roman': promptParts.push("Canlı ve dinamik bir çizgi roman paneli gibi, belirgin dış hatlarla,"); break;
    }
    switch (settings.palette) {
        case 'Canlı Renkler': promptParts.push("canlı ve parlak renkler kullanarak"); break;
        case 'Pastel Tonlar': promptParts.push("yumuşak ve dinlendirici pastel tonlar kullanarak"); break;
        case 'Siyah-Beyaz': promptParts.push("siyah-beyaz tonlarda, ışık ve gölge oyunlarını vurgulayarak"); break;
    }
    return `${promptParts.join(' ')} şu metni anlatan bir illüstrasyon oluştur: "${baseText}"`;
  };

  const handleStartImageGeneration = (selectedSettings: ImageSettings) => {
    const baseText = question.paragraf_metni || question.soru_metni;
    if (!baseText) return;

    const finalPrompt = constructImagePrompt(baseText, selectedSettings);
    onGenerateImage(index, finalPrompt, selectedSettings.quality);
    setIsImageSettingsOpen(false);
  };

  const combinedClasses = `bg-surface text-left break-inside-avoid ${settings.showBorders ? 'border border-border rounded-lg p-6 shadow-sm' : 'p-2'} ${className}`;

  return (
    <div className={combinedClasses} style={style}>
        
        {/* Image and Paragraph Section */}
        {question.paragraf_metni && (
            <div className="mb-5">
                {/* Image Display Area */}
                {isImageLoading && !generatedImage && (
                    <div className="p-4 bg-background rounded-lg animate-pulse flex items-center justify-center h-48 border border-border">
                        <i className="fas fa-image fa-3x text-border"></i>
                    </div>
                )}
                {generatedImage && (
                    <div className="p-2 bg-background border border-border rounded-lg shadow-sm">
                        <img 
                            src={`data:image/png;base64,${generatedImage}`} 
                            alt={`Soru ${index + 1} için oluşturulan görsel`}
                            className="w-full h-auto object-contain max-h-80 rounded-md"
                        />
                    </div>
                )}
                <p className="mt-4 p-4 bg-background border-l-4 border-border text-text-primary leading-relaxed">{question.paragraf_metni}</p>
            </div>
        )}
        
        {/* Question Text and Image Generation Button */}
        <div className="flex justify-between items-start mb-5">
            <p className="font-bold text-text-primary leading-snug flex-grow">
                 {settings.showQuestionNumbers && <strong className="mr-2">{index + 1}.</strong>}
                {question.soru_metni}
            </p>
            {(question.paragraf_metni) && !generatedImage && (
                 <div ref={imageButtonRef} className="no-print ml-4 flex-shrink-0 relative">
                     <button 
                        onClick={() => setIsImageSettingsOpen(prev => !prev)}
                        disabled={isImageLoading}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors shadow-sm bg-surface text-text-secondary hover:bg-worksheet-surface border border-border disabled:opacity-50 disabled:cursor-wait"
                        title="Soru için görsel oluştur"
                    >
                        {isImageLoading ? (
                            <><i className="fas fa-spinner fa-spin fa-fw"></i><span>Oluşturuluyor...</span></>
                        ) : (
                            <><i className="fas fa-magic fa-fw"></i><span>Görselleştir</span></>
                        )}
                    </button>
                     <ImageSettingsPopover
                        isOpen={isImageSettingsOpen}
                        onClose={() => setIsImageSettingsOpen(false)}
                        onGenerate={handleStartImageGeneration}
                        settings={imageSettings}
                        setSettings={setImageSettings}
                        anchorRef={imageButtonRef}
                    />
                 </div>
            )}
        </div>
        
        {/* Multiple Choice Options */}
        {question.soru_tipi === 'coktan_secmeli' && question.secenekler && (
            <div className="space-y-3">
                {Object.entries(question.secenekler).map(([key, value]) => {
                     const isCorrect = key === question.dogru_cevap;
                     const optionClasses = settings.hideAnswers
                         ? 'bg-surface border-border text-text-primary hover:bg-worksheet-surface'
                         : isCorrect
                             ? 'bg-success-50 border-success-400 text-success-900 font-medium'
                             : 'bg-surface border-border text-text-primary hover:bg-worksheet-surface';

                    return (
                        <div key={key} className={`flex items-start p-3 border rounded-lg transition-colors correct-answer-indicator ${optionClasses}`}>
                            <span className="font-bold mr-3">{key})</span> 
                            <span className="flex-1">{value}</span>
                        </div>
                    );
                })}
            </div>
        )}

        {/* True/False Answer */}
        {!settings.hideAnswers && question.soru_tipi === 'dogru_yanlis' && (
             <div className="mt-4">
                <p className={`font-semibold p-3 border rounded-lg inline-block
                    ${question.dogru_cevap === 'Doğru' 
                        ? 'bg-success-50 border-success-400 text-success-900' 
                        : 'bg-danger-50 border-danger-400 text-danger-900'}`
                }>
                    Doğru Cevap: {question.dogru_cevap}
                </p>
             </div>
        )}

        {/* Fill in the blank Answer */}
        {!settings.hideAnswers && question.soru_tipi === 'bosluk_doldurma' && (
            <div className="mt-4">
                <p className="font-semibold p-3 border rounded-lg bg-success-50 border-success-400 text-success-900 inline-block">
                    Doğru Cevap: {question.dogru_cevap}
                </p>
            </div>
        )}

        {/* Details section */}
        <div className="mt-6 pt-4 border-t border-border">
            <details open>
                <summary className="cursor-pointer font-semibold text-text-secondary hover:text-text-primary">
                    Çözüm ve Pedagojik Detaylar <i className="fas fa-chevron-down fa-xs ml-1"></i>
                </summary>
                <div className="mt-3 space-y-3 p-4 bg-primary-100/50 rounded-md border border-primary-100">
                    <p><strong className="font-semibold text-text-primary">Çözüm Anahtarı:</strong> <span className="text-text-secondary">{question.cozum_anahtari}</span></p>
                    <p><strong className="font-semibold text-text-primary">Gerçek Yaşam Bağlantısı:</strong> <span className="text-text-secondary">{question.gercek_yasam_baglantisi}</span></p>
                </div>
            </details>
        </div>
        
        {/* Feedback section */}
        <div className="no-print mt-4 pt-4 border-t border-border flex justify-end items-center relative">
            <div>
                <button 
                    onClick={() => setIsFeedbackPopoverOpen(!isFeedbackPopoverOpen)}
                    className="text-sm text-text-secondary hover:text-primary-600 font-medium py-1 px-3 rounded-md bg-worksheet-surface hover:opacity-80 transition-colors"
                >
                    <i className="fas fa-star mr-2"></i> Soruyu Değerlendir
                </button>
                {isFeedbackPopoverOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface rounded-lg shadow-xl border z-10 animate-scale-in">
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
        </div>
    </div>
  );
};


export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ questions, setNotification }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');
  const [copied, setCopied] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [generatedImages, setGeneratedImages] = useState<{ [key: number]: string }>({});
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: number]: boolean }>({});


  const handleFeedback = (rating: string) => {
    setNotification({ message: 'Değerlendirmeniz için teşekkürler!', type: 'success' });
  };

  const handleGenerateImage = async (questionIndex: number, prompt: string, quality: 'high' | 'fast') => {
    if (imageLoadingStates[questionIndex]) return;

    setImageLoadingStates(prev => ({ ...prev, [questionIndex]: true }));
    try {
        const base64Image = await generateImage(prompt, quality);
        setGeneratedImages(prev => ({ ...prev, [questionIndex]: base64Image }));
        setNotification({ message: 'Görsel başarıyla oluşturuldu.', type: 'success' });
    } catch (error) {
        console.error("Görsel oluşturulamadı:", error);
        const errorMessage = error instanceof Error ? error.message : "Görsel oluşturulurken bir hata oluştu.";
        setNotification({ message: errorMessage, type: 'error' });
    } finally {
        setImageLoadingStates(prev => ({ ...prev, [questionIndex]: false }));
    }
  };


  const [printSettings, setPrintSettings] = useState<PrintSettings>({
      fontSize: 12,
      fontFamily: 'Inter',
      columns: 2,
      hideAnswers: false,
      hideDetails: false,
      showBorders: true,
      showQuestionNumbers: true,
      showWorksheetHeader: true,
      showExamTitle: true,
      examTitle: 'Türkçe Dersi Çalışma Kağıdı',
      useWhiteBackground: true,
      lineHeight: 1.6,
      questionSpacing: 24,
  });

  const jsonString = JSON.stringify(questions, null, 2);
  const jsonlString = questions.map(q => JSON.stringify(q)).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonlString);
    setCopied(true);
    setNotification({ message: 'JSONL başarıyla kopyalandı!', type: 'success' });
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
        setNotification({ message: 'PDF oluşturulurken bir hata oluştu.', type: 'error' });
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
        setNotification({ message: `"${examName}" başarıyla arşive kaydedildi!`, type: 'success' });
    } catch (error) {
        console.error("Arşive kaydederken hata oluştu:", error);
        setNotification({ message: 'Arşive kaydederken bir hata oluştu. Tarayıcınızda yeterli alan olmayabilir.', type: 'error' });
    }
  };

  const printAreaClasses = [
    printSettings.fontFamily === 'Atkinson Hyperlegible' ? 'font-atkinson-hyperlegible' : 'font-inter',
    printSettings.hideAnswers ? 'answer-hidden' : '',
    printSettings.hideDetails ? 'details-hidden' : '',
    printSettings.useWhiteBackground ? 'bg-white' : 'bg-surface',
  ].join(' ');
  
  const printAreaStyles: React.CSSProperties = {
      fontSize: `${printSettings.fontSize}pt`,
      columnCount: printSettings.columns,
      columnGap: '20px',
      lineHeight: printSettings.lineHeight,
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
                    onGenerateImage={handleGenerateImage}
                    generatedImage={generatedImages[index]}
                    isImageLoading={imageLoadingStates[index]}
                    className="animate-fade-in-blur"
                    style={{ 
                        marginBottom: `${printSettings.questionSpacing}px`,
                        animationDelay: `${index * 100}ms` 
                    }}
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