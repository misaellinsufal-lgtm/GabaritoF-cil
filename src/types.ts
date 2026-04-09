import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Turma {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
}

export interface Exam {
  id: string;
  title: string;
  turmaId: string;
  ownerId: string;
  numQuestions: number;
  choicesCount: number; // e.g., 5 for A-E
  answerKey: string[]; // ['A', 'B', 'C', ...]
  createdAt: Timestamp;
}

export interface Result {
  id: string;
  examId: string;
  studentName: string;
  studentCode?: string;
  answers: string[];
  score: number;
  totalQuestions: number;
  scannedAt: Timestamp;
  imageUrl?: string;
}

export interface OMRCorrection {
  studentName: string;
  studentCode: string;
  answers: string[];
  confidence: number;
}
