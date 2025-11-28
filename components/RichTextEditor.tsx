import React, { useRef, useEffect } from 'react';
import { RemoveFormattingIcon } from './Icons';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, height }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  };

  const handleCommand = (command: string, val: string | null = null) => {
    document.execCommand(command, false, val as string);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border rounded-md bg-white">
      <div className="flex items-center gap-2 p-2 bg-gray-100 border-b rounded-t-md flex-wrap">
        <button type="button" onClick={() => handleCommand("bold")} className="w-8 h-8 font-bold hover:bg-gray-200 rounded">B</button>
        <button type="button" onClick={() => handleCommand("italic")} className="w-8 h-8 italic font-serif hover:bg-gray-200 rounded">I</button>
        <button type="button" onClick={() => handleCommand("underline")} className="w-8 h-8 underline hover:bg-gray-200 rounded">U</button>
        <button type="button" onClick={() => handleCommand("justifyRight")} className="w-8 h-8 hover:bg-gray-200 rounded flex items-center justify-center" title="محاذاة لليمين">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
        </button>
        <button type="button" onClick={() => handleCommand("justifyCenter")} className="w-8 h-8 hover:bg-gray-200 rounded flex items-center justify-center" title="توسيط">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>
        </button>
        <button type="button" onClick={() => handleCommand("justifyLeft")} className="w-8 h-8 hover:bg-gray-200 rounded flex items-center justify-center" title="محاذاة لليسار">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="17" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
        </button>
        <input type="color" onChange={(e) => handleCommand("foreColor", e.target.value)} className="w-8 h-8 p-1 border-none bg-transparent cursor-pointer" title="لون الخط" />
        <select onChange={(e) => { if (e.target.value) handleCommand("fontSize", e.target.value); }} className="p-1 border rounded-md text-sm bg-white cursor-pointer h-8" title="حجم الخط">
          <option value="">حجم الخط</option>
          <option value="1">صغير جداً</option>
          <option value="2">صغير</option>
          <option value="3">عادي</option>
          <option value="4">متوسط</option>
          <option value="5">كبير</option>
          <option value="6">كبير جداً</option>
          <option value="7">ضخم</option>
        </select>
        <button type="button" onClick={() => handleCommand("removeFormat")} className="w-8 h-8 hover:bg-gray-200 rounded flex justify-center items-center" title="مسح التنسيق">
          <RemoveFormattingIcon size={18} />
        </button>
      </div>
      <div ref={editorRef} contentEditable onInput={handleInput} className="w-full p-3 outline-none rte-content" style={{ minHeight: height || "112px" }} data-placeholder={placeholder}></div>
    </div>
  );
};

export default RichTextEditor;