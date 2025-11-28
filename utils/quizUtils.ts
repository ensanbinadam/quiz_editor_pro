import { Question, BaseQuestion, Item } from "../types";

export const stripHtml = (html: string | null | undefined): string => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

export const moveItem = <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
  if (
    fromIndex < 0 ||
    fromIndex >= array.length ||
    toIndex < 0 ||
    toIndex >= array.length
  ) {
    return array;
  }
  const newArray = [...array];
  const [movedItem] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, movedItem);
  return newArray;
};

export const ensureQuestionSanity = (q: any): Question => {
  const baseQuestion: BaseQuestion = {
    type: q.type || "multiple-choice",
    reading: q.reading || { text: "", image: null, audio: null },
    question: q.question || { text: "", image: null },
    feedback: q.feedback || "",
  };

  switch (baseQuestion.type) {
    case "multiple-choice": {
      const typedQ = q;
      const options = (typedQ.options || []).map((opt: any) => ({
        text: "",
        image: null,
        ...opt,
      }));
      return {
        ...baseQuestion,
        type: "multiple-choice",
        options: options,
        correct: typedQ.correct || 0,
      };
    }
    case "fill-in-the-blank":
      return {
        ...baseQuestion,
        type: "fill-in-the-blank",
        correctAnswer: q.correctAnswer || "",
      };
    case "true-false":
      return {
        ...baseQuestion,
        type: "true-false",
        correctAnswer: q.correctAnswer === false ? false : true,
      };
    case "short-answer":
      return {
        ...baseQuestion,
        type: "short-answer",
        correctAnswer: q.correctAnswer || "",
      };
    case "connecting-lines":
    case "matching": {
      const typedQ = q;
      const prompts = Array.isArray(typedQ.prompts) ? typedQ.prompts : [];
      const answers = Array.isArray(typedQ.answers) ? typedQ.answers : [];
      let pairs = Array.isArray(typedQ.pairs) ? typedQ.pairs : [];

      if (prompts.length > 0 && pairs.length === 0) {
        pairs = prompts.map((p: any, i: number) => ({
          prompt: p || { text: "", image: null },
          answer: answers[i] || { text: "", image: null },
        }));
      }

      return {
        ...baseQuestion,
        type: baseQuestion.type as 'matching' | 'connecting-lines',
        pairs: pairs.map((p: any) => ({
          prompt: { text: "", image: null, ...p.prompt },
          answer: { text: "", image: null, ...p.answer },
        })),
      };
    }
    case "ordering": {
      const items = Array.isArray(q.items) ? q.items : [];
      const sanitizedItems = items.map((item: any) =>
        typeof item === "string"
          ? { text: item, image: null }
          : item || { text: "", image: null }
      );
      return {
        ...baseQuestion,
        type: "ordering",
        items: sanitizedItems,
      };
    }
    case "classification": {
      const typedQ = q;
      const groups = Array.isArray(typedQ.groups) ? typedQ.groups : [];
      const items = Array.isArray(typedQ.items) ? typedQ.items : [];

      const sanitizedGroups = groups.map((g: any, i: number) => ({
        id: g.id || `group-${i}-${Date.now()}`,
        text: g.text || "",
      }));

      const sanitizedItems = items.map((item: any) => ({
        text: "",
        image: null,
        ...item,
        groupId: item.groupId || "",
      }));

      return {
        ...baseQuestion,
        type: "classification",
        groups: sanitizedGroups,
        items: sanitizedItems,
      };
    }
    default:
      return ensureQuestionSanity({ type: "multiple-choice" });
  }
};