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
  fontFamily: 'Inter' | 'OpenDyslexic';
  columns: 1 | 2;
  hideAnswers: boolean;
  hideDetails: boolean;
  showBorders: boolean;
}

export interface ArchivedExam {
    id: string;
    name: string;
    date: string;
    questions: Question[];
}