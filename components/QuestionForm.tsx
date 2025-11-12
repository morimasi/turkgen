import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MEB_CURRICULUM } from '../constants';
import type { QuestionGenerationParams, QuestionType, Difficulty } from '../types';

interface QuestionFormProps {
  onGenerate: (params: QuestionGenerationParams) => void;
  isLoading: boolean;
}

// Tarayıcı SpeechRecognition API'sini değişkene atayalım
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'tr-TR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
}


export const QuestionForm: React.FC<QuestionFormProps> = ({ onGenerate, isLoading }) => {
  const [grade, setGrade] = useState<string>('5');
  const [unitNo, setUnitNo] = useState<string>('');
  const [objectiveCode, setObjectiveCode] = useState<string>('');
  const [questionType, setQuestionType] = useState<QuestionType>('coktan_secmeli');
  const [difficulty, setDifficulty] = useState<Difficulty>('orta');
  const [questionCount, setQuestionCount] = useState<number>(1);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);

  const availableUnits = useMemo(() => MEB_CURRICULUM[grade]?.units || [], [grade]);
  const availableObjectives = useMemo(() => {
    return availableUnits.find(u => u.no.toString() === unitNo)?.objectives || [];
  }, [availableUnits, unitNo]);

  useEffect(() => {
    if (availableUnits.length > 0 && !availableUnits.some(u => u.no.toString() === unitNo)) {
      setUnitNo(availableUnits[0].no.toString());
    } else if (availableUnits.length === 0) {
      setUnitNo('');
    }
  }, [availableUnits, unitNo]);

  useEffect(() => {
    if (availableObjectives.length > 0 && !availableObjectives.some(o => o.code === objectiveCode)) {
      setObjectiveCode(availableObjectives[0].code);
    } else if (availableObjectives.length === 0) {
      setObjectiveCode('');
    }
  }, [availableObjectives, objectiveCode]);
  
  const parseVoiceCommand = useCallback((transcript: string) => {
      console.log("Sesli Komut:", transcript);
      const lowerTranscript = transcript.toLowerCase();

      // Sınıf
      const gradeMatch = lowerTranscript.match(/(\d)\.?\s*sınıf/);
      if (gradeMatch && MEB_CURRICULUM[gradeMatch[1]]) {
          setGrade(gradeMatch[1]);
      }

      // Soru Tipi
      if (lowerTranscript.includes("çoktan seçmeli")) setQuestionType('coktan_secmeli');
      if (lowerTranscript.includes("doğru yanlış")) setQuestionType('dogru_yanlis');
      if (lowerTranscript.includes("boşluk doldurma")) setQuestionType('bosluk_doldurma');

      // Soru Sayısı
      const countMatch = lowerTranscript.match(/(\d+)\s*(tane|adet)/);
      if (countMatch) {
          const count = parseInt(countMatch[1], 10);
          if (count > 0 && count <= 10) setQuestionCount(count);
      }
      alert("Sesli komut işlendi. Lütfen ünite ve kazanımı manuel olarak seçiniz.");

  }, []);

  const handleListen = () => {
    if (!recognition) {
        alert("Üzgünüz, tarayıcınız sesli komut özelliğini desteklemiyor.");
        return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
    }

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        parseVoiceCommand(transcript);
    };
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedUnit = availableUnits.find(u => u.no.toString() === unitNo);
    const selectedObjective = availableObjectives.find(o => o.code === objectiveCode);

    if (selectedUnit && selectedObjective) {
      onGenerate({
        grade: parseInt(grade),
        unitNo: selectedUnit.no,
        unitName: selectedUnit.name,
        objectiveCode: selectedObjective.code,
        objectiveText: selectedObjective.text,
        questionType,
        difficulty,
        questionCount,
        customInstructions,
      });
    }
  };
  
  const renderSelect = (id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value: string, label: string}[], disabled: boolean = false) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled || isLoading}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSelect('grade-select', 'Sınıf', grade, e => setGrade(e.target.value), Object.keys(MEB_CURRICULUM).map(g => ({value: g, label: `${g}. Sınıf`})))}
        {renderSelect('type-select', 'Soru Tipi', questionType, e => setQuestionType(e.target.value as QuestionType), [
          {value: 'coktan_secmeli', label: 'Çoktan Seçmeli'},
          {value: 'dogru_yanlis', label: 'Doğru / Yanlış'},
          {value: 'bosluk_doldurma', label: 'Boşluk Doldurma'},
        ])}
      </div>
      {renderSelect('unit-select', 'Ünite', unitNo, e => setUnitNo(e.target.value), availableUnits.map(u => ({value: u.no.toString(), label: `${u.no}. Ünite: ${u.name}`})), availableUnits.length === 0)}
      {renderSelect('objective-select', 'Kazanım', objectiveCode, e => setObjectiveCode(e.target.value), availableObjectives.map(o => ({value: o.code, label: `${o.code} - ${o.text}`})), availableObjectives.length === 0)}
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSelect('difficulty-select', 'Zorluk Seviyesi', difficulty, e => setDifficulty(e.target.value as Difficulty), [
            {value: 'temel', label: 'Temel'},
            {value: 'orta', label: 'Orta'},
            {value: 'ileri', label: 'İleri'},
        ])}
         <div>
            <label htmlFor="question-count" className="block text-sm font-medium text-gray-700 mb-1">Soru Sayısı</label>
            <input 
                type="number"
                id="question-count"
                value={questionCount}
                onChange={e => setQuestionCount(Math.max(1, Math.min(10, parseInt(e.target.value, 10)) || 1))}
                min="1"
                max="10"
                disabled={isLoading}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
            />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="custom-instructions" className="block text-sm font-medium text-gray-700 mb-1">Ek Talimatlar (İsteğe Bağlı)</label>
        <textarea
          id="custom-instructions"
          rows={2}
          value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          disabled={isLoading}
          placeholder="Örn: Paragraf bir fabl olsun."
          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
        ></textarea>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button 
          type="submit" 
          disabled={isLoading || !objectiveCode}
          className="w-full flex-grow flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Oluşturuluyor...
            </>
          ) : (
            <><i className="fas fa-magic mr-2"></i>Soru Oluştur</>
          )}
        </button>
        <button
          type="button"
          onClick={handleListen}
          disabled={isLoading || !SpeechRecognition}
          title={!SpeechRecognition ? "Tarayıcınız bu özelliği desteklemiyor." : "Sesli Komut"}
          className={`w-full sm:w-auto px-4 py-3 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
            ${isListening 
                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 focus:ring-red-400' 
                : 'bg-gray-700 text-white border-gray-700 hover:bg-gray-800 focus:ring-gray-500'
            }
            disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {isListening ? <i className="fas fa-microphone-slash animate-pulse"></i> : <i className="fas fa-microphone"></i>}
        </button>
      </div>

    </form>
  );
};