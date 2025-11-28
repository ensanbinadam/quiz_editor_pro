
export type QuestionType =
  | 'multiple-choice'
  | 'fill-in-the-blank'
  | 'true-false'
  | 'short-answer'
  | 'matching'
  | 'ordering'
  | 'connecting-lines'
  | 'classification';

export interface MediaContent {
  text: string;
  image: string | null;
}

export interface ReadingContent extends MediaContent {
  audio: string | null;
}

export interface Option extends MediaContent {}

export interface Pair {
  prompt: MediaContent;
  answer: MediaContent;
}

export interface Item extends MediaContent {
    groupId?: string; // For classification
}

export interface BaseQuestion {
  type: QuestionType;
  reading: ReadingContent;
  question: MediaContent;
  feedback: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: Option[];
  correct: number;
}

export interface FillInTheBlankQuestion extends BaseQuestion {
  type: 'fill-in-the-blank';
  correctAnswer: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  correctAnswer: string;
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching' | 'connecting-lines';
  pairs: Pair[];
}

export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering';
  items: Item[];
}

export interface ClassificationGroup {
    id: string;
    text: string;
}

export interface ClassificationQuestion extends BaseQuestion {
    type: 'classification';
    groups: ClassificationGroup[];
    items: Item[];
}

export type Question =
  | MultipleChoiceQuestion
  | FillInTheBlankQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | MatchingQuestion
  | OrderingQuestion
  | ClassificationQuestion;

export type DisplayQuestion = Question & {
  originalIndex: number;
};

export interface ExportOptions {
    headerText: string;
    includeQuestionNumbers: boolean;
    includeAnswers: boolean;
    randomizeOrderItems: boolean;
    forceRtl: boolean;
    questionPerPage: boolean;
}

export interface WorksheetConfig {
    title: string;
    instructions: string;
    footer: string;
    logo: string | null;
    logoAlt: string;
    numeralType: "eastern" | "western";
    teacherName: string;
    seal: string | null;
    useTimer: boolean;
    timerDuration: number; // Total duration in minutes for Worksheet
    questionTime?: number; // Time per question in seconds for Interactive Quiz
    showPrintButton: boolean;
}
