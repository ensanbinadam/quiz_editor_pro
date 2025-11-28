import React, { useState, useEffect, useRef } from 'react';
import { WorksheetConfig } from '../types';
import MediaInput from './MediaInput';
import { saveWorksheetConfig, getWorksheetConfig, clearWorksheetConfig } from '../services/db';

interface WorksheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: WorksheetConfig) => void;
  isInteractive?: boolean;
}

const WorksheetConfigModal: React.FC<WorksheetConfigModalProps> = ({ isOpen, onClose, onConfirm, isInteractive = false }) => {
  const [config, setConfig] = useState<WorksheetConfig>({
    title: "",
    instructions: "",
    footer: "",
    logo: null,
    logoAlt: "",
    numeralType: "eastern",
    teacherName: "",
    seal: null,
    useTimer: false,
    timerDuration: 20,
    showPrintButton: true,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sealPreview, setSealPreview] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await getWorksheetConfig();
        if (savedConfig) {
          // Merge saved config with defaults to ensure new fields are present
          setConfig(prev => ({
            ...prev,
            ...savedConfig,
             // Ensure correct default for showPrintButton if undefined in saved data
             showPrintButton: savedConfig.showPrintButton !== undefined ? savedConfig.showPrintButton : true
          }));
          if (savedConfig.logo) setLogoPreview(savedConfig.logo);
          if (savedConfig.seal) setSealPreview(savedConfig.seal);
        }
      } catch (error) {
        console.error("Failed to load config:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    if (isOpen) {
        loadConfig();
    }
  }, [isOpen]);

  // Auto-save config whenever it changes
  useEffect(() => {
    if (isLoaded && isOpen) {
        const timer = setTimeout(() => {
            saveWorksheetConfig(config);
        }, 500); // Debounce save
        return () => clearTimeout(timer);
    }
  }, [config, isLoaded, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleLogoChange = (file: string | null) => {
    setConfig((prev) => ({ ...prev, logo: file }));
    setLogoPreview(file);
  };

  const handleSealChange = (file: string | null) => {
    setConfig((prev) => ({ ...prev, seal: file }));
    setSealPreview(file);
  };

  const handleConfirm = () => {
    // Explicit save before confirming
    saveWorksheetConfig(config);
    onConfirm(config);
  };

  const handleClearData = async () => {
      if(window.confirm("هل أنت متأكد من مسح كافة البيانات المحفوظة للإعدادات؟")) {
          await clearWorksheetConfig();
          setConfig({
            title: "",
            instructions: "",
            footer: "",
            logo: null,
            logoAlt: "",
            numeralType: "eastern",
            teacherName: "",
            seal: null,
            useTimer: false,
            timerDuration: 20,
            showPrintButton: true,
          });
          setLogoPreview(null);
          setSealPreview(null);
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">
          {isInteractive ? "إعدادات الكويز التفاعلي" : "إعدادات ورقة العمل"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العنوان الرئيسي
              </label>
              <textarea
                name="title"
                value={config.title}
                onChange={handleChange}
                rows={2}
                className="w-full p-2 border rounded-md"
                placeholder="مثال: اختبار الرياضيات النصفي"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التعليمات / الوصف
              </label>
              <textarea
                name="instructions"
                value={config.instructions}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border rounded-md"
                placeholder="مثال: أجب عن جميع الأسئلة التالية..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تذييل الصفحة (Footer)
              </label>
              <textarea
                name="footer"
                value={config.footer}
                onChange={handleChange}
                rows={2}
                className="w-full p-2 border rounded-md"
                placeholder="نص يظهر أسفل كل صفحة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المعلم (للشهادة)
              </label>
              <input
                type="text"
                name="teacherName"
                value={config.teacherName}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                placeholder="أ. محمد أحمد"
              />
            </div>
          </div>

          <div className="space-y-4">
            <MediaInput
              label="شعار المدرسة / الوزارة"
              image={logoPreview}
              onImageChange={handleLogoChange}
            />
             <MediaInput
              label="الختم (للشهادة)"
              image={sealPreview}
              onImageChange={handleSealChange}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    نوع الأرقام
                </label>
                <select
                    name="numeralType"
                    value={config.numeralType}
                    // @ts-ignore
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md bg-white"
                >
                    <option value="eastern">أرقام عربية (٠١٢٣)</option>
                    <option value="western">أرقام إنجليزية (0123)</option>
                </select>
            </div>
            
            <div className="flex items-center gap-2 mt-6">
                <input
                    type="checkbox"
                    id="useTimer"
                    name="useTimer"
                    checked={config.useTimer}
                    // @ts-ignore
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 rounded"
                />
                <label htmlFor="useTimer" className="text-gray-700 font-medium">
                    تفعيل المؤقت
                </label>
            </div>

            {config.useTimer && (
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isInteractive ? "وقت السؤال (ثانية)" : "مدة الاختبار (دقيقة)"}
                    </label>
                    <input
                        type="number"
                        name={isInteractive ? "questionTime" : "timerDuration"} // Use specific field name based on mode
                        value={isInteractive ? (config.questionTime || 45) : config.timerDuration}
                        onChange={(e) => {
                             const val = parseInt(e.target.value) || 0;
                             setConfig(prev => ({
                                 ...prev,
                                 [isInteractive ? "questionTime" : "timerDuration"]: val
                             }));
                        }}
                        className="w-full p-2 border rounded-md"
                        min="1"
                    />
                </div>
            )}

            {!isInteractive && (
                 <div className="flex items-center gap-2 mt-6">
                    <input
                        type="checkbox"
                        id="showPrintButton"
                        name="showPrintButton"
                        checked={config.showPrintButton !== false}
                        // @ts-ignore
                        onChange={handleChange}
                        className="h-5 w-5 text-blue-600 rounded"
                    />
                    <label htmlFor="showPrintButton" className="text-gray-700 font-medium">
                        إظهار زر الطباعة في ورقة العمل
                    </label>
                </div>
            )}
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-center gap-4 border-t pt-4">
          <button
            onClick={handleConfirm}
            className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 px-8 rounded-lg hover:bg-green-700 transition-colors shadow-md w-full md:w-auto"
          >
            تأكيد وإنشاء
          </button>
          <button
            onClick={handleClearData}
            className="py-2 px-6 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors w-full md:w-auto"
          >
            مسح البيانات المحفوظة
          </button>
          <button
            onClick={onClose}
            className="py-2 px-6 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors w-full md:w-auto"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorksheetConfigModal;