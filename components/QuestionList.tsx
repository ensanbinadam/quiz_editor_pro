import React, { useState } from 'react';
import { GripVertical, Edit, Copy, Plus, Trash2 } from './Icons';
import { Question } from '../types';
import { stripHtml } from '../utils/quizUtils';

interface QuestionListProps {
  questions: (Question & { originalIndex: number })[];
  currentQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  onDeleteQuestion: (index: number) => void;
  onDuplicateQuestion: (index: number) => void;
  onAddNewQuestion: (index: number) => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
  selectedQuestionIndices: Set<number>;
  onToggleQuestionSelection: (index: number | "all", force?: boolean) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const questionTypeMapForList: Record<string, string> = {
  "multiple-choice": "اختيار من متعدد",
  "fill-in-the-blank": "املأ الفراغ",
  "true-false": "صح/خطأ",
  "short-answer": "إجابة قصيرة",
  "matching": "مطابقة",
  "ordering": "ترتيب",
  "connecting-lines": "توصيل",
  "classification": "تصنيف",
};

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  currentQuestionIndex,
  onSelectQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onAddNewQuestion,
  onDragStart,
  onDrop,
  selectedQuestionIndices,
  onToggleQuestionSelection,
  filterType,
  onFilterChange,
  searchTerm,
  onSearchChange,
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    onToggleQuestionSelection("all", isChecked);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md sticky top-6">
      <div className="text-center border-b pb-3 mb-3">
        <h3 className="text-xl font-bold text-gray-800">
          قائمة الأسئلة ({questions.length})
        </h3>
        <p className="text-sm text-gray-500">اسحب وأفلت لإعادة الترتيب</p>
      </div>
      <div className="p-2 space-y-3">
        <input
          type="text"
          placeholder="ابحث في نص السؤال..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full p-2 border rounded-md bg-white text-sm"
        />
        <select
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full p-2 border rounded-md bg-white text-sm"
        >
          <option value="all">كل أنواع الأسئلة</option>
          {Object.entries(questionTypeMapForList).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
        <div className="relative flex items-start pt-2">
          <div className="flex items-center h-5">
            <input
              id="selectAll"
              name="selectAll"
              type="checkbox"
              onChange={handleToggleAll}
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>
          <div className="mr-3 text-sm">
            <label
              htmlFor="selectAll"
              className="font-medium text-gray-700"
            >
              تحديد الكل / إلغاء تحديد الكل
            </label>
          </div>
        </div>

        {/* Export Stats Box */}
        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center shadow-sm">
            <p className="text-sm font-bold text-indigo-700">
                {selectedQuestionIndices.size > 0 
                    ? `تم تحديد ${selectedQuestionIndices.size} سؤال للتصدير` 
                    : "سيتم تصدير جميع الأسئلة (افتراضي)"}
            </p>
        </div>
      </div>
      <ul className="space-y-2 max-h-[75vh] overflow-y-auto pr-2 mt-2">
        {questions.map((q, index) => {
          const originalIndex = q.originalIndex;
          const isActive = originalIndex === currentQuestionIndex;
          const previewText =
            stripHtml(q.question.text || "سؤال فارغ").substring(0, 50) +
            "...";
          return (
            <li
              key={originalIndex}
              draggable
              onDragStart={() => onDragStart(originalIndex)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={() => {
                onDrop(originalIndex);
                setDragOverIndex(null);
              }}
              className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer group ${
                isActive
                  ? "bg-blue-100 border-blue-500 shadow-md"
                  : "bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              } ${
                dragOverIndex === index
                  ? "transform scale-105 bg-blue-200"
                  : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 pt-1 flex flex-col items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedQuestionIndices.has(originalIndex)}
                    onChange={() =>
                      onToggleQuestionSelection(originalIndex)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    title="تحديد السؤال للتصدير"
                  />
                  <div className="cursor-grab text-gray-400 group-hover:text-gray-600">
                    <GripVertical />
                  </div>
                </div>
                <div
                  className="flex-grow"
                  onClick={() => onSelectQuestion(originalIndex)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">
                      السؤال {originalIndex + 1}
                    </span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {questionTypeMapForList[q.type]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {previewText}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-200">
                <button
                  title="تعديل"
                  onClick={() => onSelectQuestion(originalIndex)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100"
                >
                  <Edit size={16} />
                </button>
                <button
                  title="نسخ"
                  onClick={() => onDuplicateQuestion(originalIndex)}
                  className="p-1.5 text-gray-500 hover:text-green-600 rounded-full hover:bg-green-100"
                >
                  <Copy size={16} />
                </button>
                <button
                  title="إدراج سؤال"
                  onClick={() => onAddNewQuestion(originalIndex + 1)}
                  className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-100"
                >
                  <Plus size={16} />
                </button>
                <button
                  title="حذف"
                  onClick={() => onDeleteQuestion(originalIndex)}
                  className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default QuestionList;