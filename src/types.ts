export interface AnswerKey {
  t: string; // title
  a: string[]; // answers array
  c: number; // choices count (e.g., 5 for A,B,C,D,E)
}

export interface GradingResult {
  score: number;
  total: number;
  details: {
    question: number;
    marked: string;
    correct: boolean;
  }[];
}
