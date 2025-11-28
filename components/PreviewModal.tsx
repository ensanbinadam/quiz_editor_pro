import React from 'react';
import { Question } from '../types';

interface PreviewModalProps {
  question: Question;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ question, onClose }) => {
  if (!question) return null;

  const renderContent = (content: string) => {
    if (!content) return null;
    return (
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        className="prose max-w-none"
      />
    );
  };

  const renderMedia = (media: string | null) => {
    if (!media) return null;
    return (
      <img
        src={media}
        alt="معاينة الصورة"
        className="mt-4 rounded-lg max-w-full h-auto max-h-80 object-contain"
      />
    );
  };

  const renderQuestionBody = () => {
    switch (question.type) {
      case "multiple-choice":
        const mcq = question as any;
        return (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {(mcq.options || []).map((opt: any, i: number) => (
              <div
                key={i}
                className="p-4 border rounded-lg bg-white flex flex-col items-center justify-center text-center min-h-[120px]"
              >
                {opt.image && (
                  <img
                    src={opt.image}
                    className="max-h-24 mb-2 object-contain"
                  />
                )}
                {renderContent(opt.text)}
              </div>
            ))}
          </div>
        );
      case "true-false":
        return (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-4 border rounded-lg bg-white flex items-center justify-center text-center min-h-[120px] font-bold text-lg">
              صح
            </div>
            <div className="p-4 border rounded-lg bg-white flex items-center justify-center text-center min-h-[120px] font-bold text-lg">
              خطأ
            </div>
          </div>
        );
      case "matching":
      case "connecting-lines":
        const matchQ = question as any;
        return (
          <div className="flex justify-between gap-4 mt-4">
            <div className="w-1/2 space-y-3">
              {(matchQ.pairs || []).map((p: any, i: number) => (
                <div
                  key={`prompt-${i}`}
                  className="p-3 border rounded-lg bg-gray-100 flex flex-col items-center text-center"
                >
                  {p.prompt.image && (
                    <img
                      src={p.prompt.image}
                      className="max-h-32 mb-2 mx-auto object-contain"
                    />
                  )}
                  {renderContent(p.prompt.text)}
                </div>
              ))}
            </div>
            <div className="w-1/2 space-y-3">
              {(matchQ.pairs || []).map((p: any, i: number) => (
                <div
                  key={`answer-${i}`}
                  className="p-3 border rounded-lg bg-white flex flex-col items-center text-center"
                >
                  {p.answer.image && (
                    <img
                      src={p.answer.image}
                      className="max-h-32 mb-2 mx-auto object-contain"
                    />
                  )}
                  {renderContent(p.answer.text)}
                </div>
              ))}
            </div>
          </div>
        );
      case "ordering":
        const orderQ = question as any;
        return (
          <div className="space-y-3 mt-4">
            {(orderQ.items || []).map((item: any, i: number) => (
              <div
                key={i}
                className="p-3 border rounded-lg bg-white flex items-center gap-4"
              >
                <span className="text-gray-400">☰</span>
                {item.image && (
                  <img
                    src={item.image}
                    className="max-h-32 object-contain"
                  />
                )}
                {renderContent(item.text)}
              </div>
            ))}
          </div>
        );
      case "classification":
        const classQ = question as any;
        return (
            <div className="space-y-4 mt-4">
                <div className="flex flex-wrap gap-2 justify-center">
                    {(classQ.groups || []).map((g: any) => (
                         <div key={g.id} className="p-3 border rounded bg-blue-50 font-bold min-w-[150px] text-center">
                             {g.text}
                         </div>
                    ))}
                </div>
                <div className="p-4 border rounded bg-gray-50 flex flex-wrap gap-2 justify-center">
                    {(classQ.items || []).map((item: any, i: number) => (
                        <div key={i} className="p-2 bg-white border rounded shadow-sm">
                            {item.image && <img src={item.image} className="h-10 mx-auto" />}
                            <span>{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
      default:
        return (
          <div className="mt-4 p-4 border-2 border-dashed rounded-lg text-center text-gray-500">
            معاينة هذا النوع من الأسئلة غير متاحة بعد.
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-blue-600 mb-4 text-center">
          معاينة السؤال
        </h2>
        {question.reading?.text && (
          <div className="p-4 mb-4 bg-white border rounded-lg">
            {renderContent(question.reading.text)}
          </div>
        )}
        {question.reading?.image && renderMedia(question.reading.image)}
        <div className="p-4 bg-white border rounded-lg">
          <div className="font-bold text-xl mb-2">
            {renderContent(question.question.text)}
          </div>
          {renderMedia(question.question.image)}
          {renderQuestionBody()}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;