import { openDB, DBSchema } from 'idb';
import { Question, WorksheetConfig } from '../types';

interface QuizDB extends DBSchema {
  quizState: {
    key: string;
    value: {
      questions: Question[];
      currentQuestionIndex: number;
    };
  };
  config: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'quiz-editor-db';
const STORE_NAME = 'quizState';
const CONFIG_STORE = 'config';

const getDb = async () => {
  return openDB<QuizDB>(DB_NAME, 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        db.createObjectStore(STORE_NAME);
      }
      if (oldVersion < 2) {
        db.createObjectStore(CONFIG_STORE);
      }
    },
  });
};

export const dbSet = async (value: { questions: Question[]; currentQuestionIndex: number }) => {
  const db = await getDb();
  await db.put(STORE_NAME, value, 'currentState');
};

export const dbGet = async () => {
  const db = await getDb();
  return db.get(STORE_NAME, 'currentState');
};

export const dbClear = async () => {
  const db = await getDb();
  await db.delete(STORE_NAME, 'currentState');
};

export const saveWorksheetConfig = async (config: WorksheetConfig) => {
  const db = await getDb();
  await db.put(CONFIG_STORE, config, 'worksheetConfig');
};

export const getWorksheetConfig = async (): Promise<WorksheetConfig | undefined> => {
  const db = await getDb();
  return db.get(CONFIG_STORE, 'worksheetConfig');
};

export const clearWorksheetConfig = async () => {
  const db = await getDb();
  await db.delete(CONFIG_STORE, 'worksheetConfig');
};