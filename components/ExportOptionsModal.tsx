import React, { useState } from 'react';
import { ExportOptions } from '../types';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ExportOptions) => void;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [options, setOptions] = useState<ExportOptions>({
    headerText: "",
    includeQuestionNumbers: true,
    includeAnswers: false,
    randomizeOrderItems: true,
    forceRtl: true,
    questionPerPage: true,
  });

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(options);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setOptions((prev) => ({ ...prev, [name]: checked }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOptions((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">
          خيارات تصدير Word
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="headerText"
              className="block text-md font-medium text-gray-700 mb-2"
            >
              عنوان المستند (اختياري)
            </label>
            <textarea
              id="headerText"
              name="headerText"
              value={options.headerText}
              onChange={handleTextChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="السطر 1: اسم الاختبار&#10;السطر 2: اسم الطالب: ..........&#10;السطر 3: الصف: .........."
            />
          </div>

          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="includeQuestionNumbers"
                name="includeQuestionNumbers"
                type="checkbox"
                checked={options.includeQuestionNumbers}
                onChange={handleCheckboxChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="mr-3 text-sm">
              <label
                htmlFor="includeQuestionNumbers"
                className="font-medium text-gray-700"
              >
                تضمين أرقام الأسئلة
              </label>
              <p className="text-gray-500">
                عرض "السؤال 1:"، "السؤال 2:"، إلخ.
              </p>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="includeAnswers"
                name="includeAnswers"
                type="checkbox"
                checked={options.includeAnswers}
                onChange={handleCheckboxChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="mr-3 text-sm">
              <label
                htmlFor="includeAnswers"
                className="font-medium text-gray-700"
              >
                تضمين الإجابات النموذجية
              </label>
              <p className="text-gray-500">لإنشاء نسخة خاصة بالمعلم.</p>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="randomizeOrderItems"
                name="randomizeOrderItems"
                type="checkbox"
                checked={options.randomizeOrderItems}
                onChange={handleCheckboxChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                disabled={options.includeAnswers}
              />
            </div>
            <div className="mr-3 text-sm">
              <label
                htmlFor="randomizeOrderItems"
                className={`font-medium ${
                  options.includeAnswers
                    ? "text-gray-400"
                    : "text-gray-700"
                }`}
              >
                ترتيب عشوائي لعناصر سؤال الترتيب
              </label>
              <p
                className={
                  options.includeAnswers
                    ? "text-gray-400"
                    : "text-gray-500"
                }
              >
                يتم تعطيل هذا الخيار عند تضمين الإجابات.
              </p>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="forceRtl"
                name="forceRtl"
                type="checkbox"
                checked={options.forceRtl}
                onChange={handleCheckboxChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="mr-3 text-sm">
              <label
                htmlFor="forceRtl"
                className="font-medium text-gray-700"
              >
                فرض اتجاه المستند من اليمين لليسار
              </label>
              <p className="text-gray-500">
                لضمان التوافق الكامل مع اللغة العربية.
              </p>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="questionPerPage"
                name="questionPerPage"
                type="checkbox"
                checked={options.questionPerPage}
                onChange={handleCheckboxChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="mr-3 text-sm">
              <label
                htmlFor="questionPerPage"
                className="font-medium text-gray-700"
              >
                وضع كل سؤال في صفحة مستقلة
              </label>
              <p className="text-gray-500">
                عند إلغاء التفعيل، ستكون الأسئلة متتالية.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 bg-sky-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-600 transition-colors shadow"
          >
            تأكيد التصدير
          </button>
          <button
            onClick={onClose}
            className="py-2 px-6 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsModal;