export interface Turma {
  id: string;
  name: string;
  ownerId: string;
  createdAt: any; // Firestore Timestamp
}

export interface Gabarito {
  id: string;
  turmaId: string;
  name: string;
  answers: string[];
  choicesCount: number;
  ownerId: string;
  createdAt: any; // Firestore Timestamp
}

export interface AnswerKey {
  t: string; // title
  a: string[]; // answers array
  c: number; // choices count (e.g., 5 for A,B,C,D,E)
}

export interface GradingResult {
  score: number;
  total: number;
  studentName?: string;
  details: {
    question: number;
    marked: string;
    correct: boolean;
  }[];
}
