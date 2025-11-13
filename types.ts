export interface Question {
  sinif: number;
  unite_adi: string;
  unite_no: number;
  kazanim_kodu: string;
  kazanim_metni: string;
  soru_tipi: QuestionType;
  paragraf_metni: string | null;
  soru_metni: string;
  secenekler: { [key: string]: string } | null;
  dogru_cevap: string;
  yanlis_secenek_tipleri: string[] | null;
  gercek_yasam_baglantisi: string;
  seviye: Difficulty;
  cozum_anahtari: string;
}

export type QuestionType = 'coktan_secmeli' | 'dogru_yanlis' | 'bosluk_doldurma';
export type Difficulty = 'temel' | 'orta' | 'ileri';

export interface Objective {
  code: string;
  text: string;
}

export interface Unit {
  no: number;
  name: string;
  objectives: Objective[];
}

export interface GradeData {
  units: Unit[];
}

export interface Curriculum {
  [key: string]: GradeData;
}

export interface QuestionGenerationParams {
  grade: number;
  units: { no: number, name: string }[];
  objectives: { code: string, text: string }[];
  questionType: QuestionType;
  difficulty: Difficulty;
  questionCount: number;
  customInstructions: string;
}

export interface PrintSettings {
  fontSize: number;
  fontFamily: 'Inter' | 'Atkinson Hyperlegible';
  columns: 1 | 2;
  hideAnswers: boolean;
  hideDetails: boolean;
  showBorders: boolean;
  showQuestionNumbers: boolean;
  showExamTitle: boolean;
  examTitle: string;
  showWorksheetHeader: boolean;
  useWhiteBackground: boolean;
  lineHeight: number;
  questionSpacing: number;
}

export interface ArchivedExam {
    id: string;
    name: string;
    date: string;
    questions: Question[];
    // Fix: Add optional 'isSample' property to allow differentiating sample exams.
    isSample?: boolean;
}

export type Theme = 'sky' | 'emerald' | 'rose' | 'indigo' | 'slate' | 'coffee';

export interface ImageOptions {
  style: 'cizgi-film' | 'gercekci' | 'suluboya' | 'cizgi-roman';
  palette: 'canli' | 'pastel' | 'siyah-beyaz';
  quality: 'hizli' | 'yuksek-kalite';
}