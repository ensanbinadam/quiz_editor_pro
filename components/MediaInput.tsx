import React, { useRef } from 'react';
import { ImageUp, ClipboardPaste, Trash2, AudioLines } from './Icons';

interface MediaInputProps {
    label: string;
    image?: string | null;
    onImageChange: (val: string | null) => void;
    audio?: string | null;
    onAudioChange?: (val: string | null) => void;
}

const MediaInput: React.FC<MediaInputProps> = ({ label, image, onImageChange, audio, onAudioChange }) => {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setter(event.target?.result as string);
            reader.readAsDataURL(file);
        }
        e.target.value = "";
    };

    const handlePaste = async (setter: (val: string | null) => void) => {
        try {
            // @ts-ignore
            const items = await navigator.clipboard.read();
            const imageItem = items.find((item: any) => item.types.some((t: string) => t.startsWith("image/")));
            if (imageItem) {
                const type = imageItem.types.find((t: string) => t.startsWith("image/"));
                if (!type) {
                    alert("نوع الصورة غير مدعوم.");
                    return;
                }
                const blob = await imageItem.getType(type);
                const reader = new FileReader();
                reader.onload = (e) => setter(e.target?.result as string);
                reader.readAsDataURL(blob);
            } else {
                alert("لا توجد صورة في الحافظة.");
            }
        } catch (err) {
            console.error("Paste error:", err);
            alert("فشل لصق الصورة. قد تحتاج إلى منح الإذن بالوصول إلى الحافظة.");
        }
    };

    return (
        <div className="space-y-2">
            {label && <h3 className="font-semibold text-gray-700">{label}</h3>}
            <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-md transition-colors">
                    <ImageUp size={16} /> صورة
                </button>
                <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, onImageChange)} accept="image/*" className="hidden" />
                <button type="button" onClick={() => handlePaste(onImageChange)} className="flex items-center gap-2 text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-md transition-colors">
                    <ClipboardPaste size={16} /> لصق
                </button>
                {image && (
                    <button type="button" onClick={() => onImageChange(null)} className="flex items-center gap-2 text-sm bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors">
                        <Trash2 size={16} /> حذف
                    </button>
                )}
            </div>
            {image && <img src={image} alt="معاينة" className="mt-2 rounded-lg border-2 border-dashed border-gray-300 p-1 max-h-40 object-contain" />}
            {onAudioChange && (
                <>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => audioInputRef.current?.click()} className="flex items-center gap-2 text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-md transition-colors">
                            <AudioLines size={16} /> صوت
                        </button>
                        <input type="file" ref={audioInputRef} onChange={(e) => handleFileChange(e, onAudioChange)} accept="audio/*" className="hidden" />
                        {audio && (
                            <button type="button" onClick={() => onAudioChange(null)} className="flex items-center gap-2 text-sm bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors">
                                <Trash2 size={16} /> حذف
                            </button>
                        )}
                    </div>
                    {audio && <audio src={audio} controls className="mt-2 w-full" />}
                </>
            )}
        </div>
    );
};

export default MediaInput;