
import React, { useState, useEffect } from 'react';
import { Save, PlusCircle, Trash2, PlusIcon, GripVertical } from './Icons';
import RichTextEditor from './RichTextEditor';
import MediaInput from './MediaInput';
import { ensureQuestionSanity, moveItem } from '../utils/quizUtils';
import { Question } from '../types';

interface EditorPanelProps {
  question: Question;
  onUpdate: (q: Question) => void;
  questionNumber: number;
  onSaveAndNew: () => void;
  onAddNew: () => void;
  onPreview: (q: Question) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  question,
  onUpdate,
  questionNumber,
  onSaveAndNew,
  onAddNew,
  onPreview,
}) => {
  const [localQuestion, setLocalQuestion] = useState<Question>(question);
  const [draggedItem, setDraggedItem] = useState<{ type: string | null; index: number }>({
    type: null,
    index: -1,
  });

  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  const handleChange = (key: string, value: any) => {
    setLocalQuestion((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleNestedChange = (parentKey: string, childKey: string, value: any) => {
    setLocalQuestion((prev: any) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [childKey]: value,
      },
    }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    const newQuestionState = ensureQuestionSanity({
      ...localQuestion,
      type: newType,
    });
    setLocalQuestion(newQuestionState);
  };

  const handleSave = () => {
    const questionToSave = JSON.parse(JSON.stringify(localQuestion));
    const cleanHtml = (html: string) =>
      (html || "").replace(/(<p><br><\/p>|\s|&nbsp;)*$/, "").trim();

    questionToSave.reading.text = cleanHtml(questionToSave.reading.text);
    questionToSave.question.text = cleanHtml(questionToSave.question.text);
    questionToSave.feedback = cleanHtml(questionToSave.feedback);

    if (
      questionToSave.type === "matching" ||
      questionToSave.type === "connecting-lines"
    ) {
      const validPairs = (questionToSave.pairs || []).filter(
        (p: any) =>
          (p.prompt && (p.prompt.text || p.prompt.image)) ||
          (p.answer && (p.answer.text || p.answer.image))
      );
      questionToSave.pairs = validPairs;
    }

    onUpdate(questionToSave);
    return questionToSave;
  };

  // Group Handlers (Classification)
  const handleGroupChange = (index: number, value: string) => {
    setLocalQuestion((prev: any) => {
      const newGroups = [...(prev.groups || [])];
      newGroups[index] = { ...newGroups[index], text: value };
      return { ...prev, groups: newGroups };
    });
  };

  const handleAddGroup = () => {
    setLocalQuestion((prev: any) => ({
      ...prev,
      groups: [
        ...(prev.groups || []),
        { id: `group-${Date.now()}`, text: "" },
      ],
    }));
  };

  const handleRemoveGroup = (indexToRemove: number) => {
    setLocalQuestion((prev: any) => {
      const groupToRemove = prev.groups[indexToRemove];
      const newGroups = prev.groups.filter((_: any, i: number) => i !== indexToRemove);
      const newItems = prev.items.filter(
        (item: any) => item.groupId !== groupToRemove.id
      );
      return { ...prev, groups: newGroups, items: newItems };
    });
  };

  // Class Items Handlers
  const handleClassItemChange = (index: number, key: string, value: any) => {
    setLocalQuestion((prev: any) => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [key]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleAddClassItem = (groupId: string) => {
    setLocalQuestion((prev: any) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { text: "", image: null, groupId: groupId },
      ],
    }));
  };

  const handleRemoveClassItem = (indexToRemove: number) => {
    setLocalQuestion((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== indexToRemove),
    }));
  };

  // Option Handlers
  const handleAddOption = () => {
    setLocalQuestion((prev: any) => {
      const newOptions = [
        ...(prev.options || []),
        { text: "", image: null },
      ];
      return { ...prev, options: newOptions };
    });
  };

  const handleOptionChange = (index: number, key: string, value: any) => {
    setLocalQuestion((prev: any) => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], [key]: value };
      return { ...prev, options: newOptions };
    });
  };

  const handleCorrectChange = (newCorrectIndex: number) => {
    setLocalQuestion((prev: any) => ({ ...prev, correct: newCorrectIndex }));
  };

  // Pair Handlers
  const handlePairChange = (index: number, part: 'prompt' | 'answer', key: string, value: any) => {
    setLocalQuestion((prev: any) => {
        const newPairs = JSON.parse(JSON.stringify(prev.pairs || []));
        if (!newPairs[index]) newPairs[index] = { prompt: {}, answer: {} };
        if (!newPairs[index][part]) newPairs[index][part] = {};
        newPairs[index][part][key] = value;
        return { ...prev, pairs: newPairs };
    });
  };

  const handleRemovePair = (index: number) => {
    setLocalQuestion((prev: any) => {
      const newPairs = prev.pairs.filter((_: any, i: number) => i !== index);
      return { ...prev, pairs: newPairs };
    });
  };

  // Drag Handlers
  const handleDragStart = (type: string, index: number) => {
    setDraggedItem({ type, index });
  };

  const handleDrop = (type: string, targetIndex: number) => {
    if (
      draggedItem.type !== type ||
      draggedItem.index === -1 ||
      draggedItem.index === targetIndex
    )
      return;

    let currentArray = (localQuestion as any)[type];
    let correctIndex = (localQuestion as any).correct;

    if (type === "options" && localQuestion.type === "multiple-choice") {
      const mcq = localQuestion as any;
      const draggedOptionIsCorrect = draggedItem.index === mcq.correct;

      if (draggedOptionIsCorrect) {
        correctIndex = targetIndex;
      } else {
        if (
          draggedItem.index < mcq.correct &&
          targetIndex >= mcq.correct
        ) {
          correctIndex--;
        } else if (
          draggedItem.index > mcq.correct &&
          targetIndex <= mcq.correct
        ) {
          correctIndex++;
        }
      }
    }

    const newArray = moveItem(
      currentArray,
      draggedItem.index,
      targetIndex
    );

    setLocalQuestion((prev: any) => {
      const updated = {
        ...prev,
        [type]: newArray,
      };
      if (type === "options" && prev.type === "multiple-choice") {
        updated.correct = correctIndex;
      }
      return updated;
    });

    setDraggedItem({ type: null, index: -1 });
  };

  const renderClassificationEditor = () => {
    const classQ = localQuestion as any;
    return (
      <div className="space-y-6">
        <div className="space-y-3 p-3 border rounded-md bg-gray-50">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-700">
              المجموعات (الفئات)
            </h4>
            <button
              type="button"
              onClick={handleAddGroup}
              className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 font-semibold py-1 px-3 rounded-md hover:bg-blue-200"
            >
              <PlusIcon size={14} /> إضافة مجموعة
            </button>
          </div>
          {(classQ.groups || []).map((group: any, index: number) => (
            <div key={group.id} className="flex items-center gap-2">
              <input
                type="text"
                value={group.text}
                onChange={(e) => handleGroupChange(index, e.target.value)}
                placeholder={`اسم المجموعة ${index + 1}`}
                className="w-full p-2 border rounded-md"
              />
              {classQ.groups.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(index)}
                  className="p-1.5 text-red-500 hover:bg-red-100 rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {(classQ.groups || []).map((group: any) => (
          <div
            key={group.id}
            className="space-y-3 p-3 border rounded-md bg-white"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-700">
                عناصر المجموعة:{" "}
                <span className="font-bold text-blue-600">
                  {group.text || "(بدون اسم)"}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => handleAddClassItem(group.id)}
                className="flex items-center gap-1 text-sm bg-green-100 text-green-700 font-semibold py-1 px-3 rounded-md hover:bg-green-200"
              >
                <PlusIcon size={14} /> إضافة عنصر
              </button>
            </div>
            {(classQ.items || [])
              .filter((item: any) => item.groupId === group.id)
              .map((item: any, itemIndex: number) => {
                const originalIndex = classQ.items.findIndex(
                  (i: any) => i === item
                );
                return (
                  <div
                    key={originalIndex}
                    className="p-2 border rounded-md bg-gray-50 flex items-start gap-2"
                  >
                    <div className="flex-grow space-y-2">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) =>
                          handleClassItemChange(
                            originalIndex,
                            "text",
                            e.target.value
                          )
                        }
                        placeholder={`نص العنصر`}
                        className="w-full p-2 border rounded-md"
                      />
                      <MediaInput
                        label=""
                        image={item.image}
                        onImageChange={(img) =>
                          handleClassItemChange(
                            originalIndex,
                            "image",
                            img
                          )
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveClassItem(originalIndex)}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded-full flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    );
  };

  const renderEditorFields = () => {
    switch (localQuestion.type) {
      case "multiple-choice":
        const mcq = localQuestion as any;
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-lg text-gray-800">
                الخيارات (يجب تحديد الإجابة الصحيحة)
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-2 bg-blue-500 text-white font-semibold py-1.5 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
              >
                <PlusIcon size={16} /> إضافة خيار
              </button>
            </div>
            {(mcq.options || []).map((opt: any, index: number) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart("options", index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop("options", index)}
                className="p-3 bg-white rounded-lg border relative transition-shadow hover:shadow-md"
              >
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <div className="cursor-grab text-gray-400">
                    <GripVertical size={18} />
                  </div>
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  {mcq.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocalQuestion((prev: any) => {
                          let newCorrect = prev.correct;
                          if (index === prev.correct) newCorrect = 0;
                          else if (index < prev.correct) newCorrect--;
                          const newOptions = prev.options.filter(
                            (_: any, i: number) => i !== index
                          );
                          return {
                            ...prev,
                            options: newOptions,
                            correct: newCorrect,
                          };
                        });
                      }}
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
                      title="حذف الخيار"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-start gap-3 mb-2 pr-8 pl-8">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={mcq.correct === index}
                    onChange={() => handleCorrectChange(index)}
                    className="form-radio h-5 w-5 text-blue-600 mt-2.5 flex-shrink-0"
                  />
                  <div className="flex-grow space-y-2">
                    <input
                      type="text"
                      placeholder={`الخيار ${index + 1}`}
                      value={opt.text}
                      onChange={(e) =>
                        handleOptionChange(index, "text", e.target.value)
                      }
                      className="w-full p-2 border rounded-md"
                    />
                    <MediaInput
                      label=""
                      image={opt.image}
                      onImageChange={(img) =>
                        handleOptionChange(index, "image", img)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case "fill-in-the-blank":
        const fitb = localQuestion as any;
        return (
          <div>
            <label
              htmlFor="correctAnswer"
              className="font-semibold text-lg text-gray-800"
            >
              الإجابة الصحيحة:
            </label>
            <input
              id="correctAnswer"
              type="text"
              value={fitb.correctAnswer}
              onChange={(e) =>
                setLocalQuestion((prev: any) => ({
                  ...prev,
                  correctAnswer: e.target.value,
                }))
              }
              className="w-full mt-2 p-2 border rounded-md"
              placeholder="اكتب الإجابة هنا..."
            />
            <p className="text-sm text-gray-500 mt-2">
              ملاحظة: يمكنك وضع عدة إجابات صحيحة بفصلها بعلامة | (مثال:
              إجابة1|إجابة2)
            </p>
          </div>
        );
      case "true-false":
        const tf = localQuestion as any;
        return (
          <div className="space-y-2">
            <label className="font-semibold text-lg text-gray-800">
              الإجابة الصحيحة:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tf-answer"
                  checked={tf.correctAnswer === true}
                  onChange={() =>
                    setLocalQuestion((prev: any) => ({
                      ...prev,
                      correctAnswer: true,
                    }))
                  }
                  className="form-radio h-5 w-5 text-blue-600"
                />
                صح
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tf-answer"
                  checked={tf.correctAnswer === false}
                  onChange={() =>
                    setLocalQuestion((prev: any) => ({
                      ...prev,
                      correctAnswer: false,
                    }))
                  }
                  className="form-radio h-5 w-5 text-blue-600"
                />
                خطأ
              </label>
            </div>
          </div>
        );
      case "short-answer":
        const sa = localQuestion as any;
        return (
          <div>
            <label
              htmlFor="shortAnswer"
              className="font-semibold text-lg text-gray-800"
            >
              الإجابات الصحيحة المحتملة:
            </label>
            <textarea
              id="shortAnswer"
              value={sa.correctAnswer}
              onChange={(e) =>
                setLocalQuestion((prev: any) => ({
                  ...prev,
                  correctAnswer: e.target.value,
                }))
              }
              className="w-full mt-2 p-2 border rounded-md h-24"
              placeholder="اكتب الإجابات هنا..."
            />
            <p className="text-sm text-gray-500 mt-2">
              اكتب الإجابات الصحيحة المحتملة. افصل بين كل إجابة بعلامة | .
              سيتم التحقق من تطابق إجابة الطالب مع أي من هذه الإجابات.
            </p>
          </div>
        );
      case "connecting-lines":
      case "matching":
        const matchQ = localQuestion as any;
        const title =
          matchQ.type === "matching" ? "أزواج المطابقة" : "أزواج التوصيل";
        return (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-lg text-gray-800">
                {title}
              </label>
              <button
                type="button"
                onClick={() =>
                  setLocalQuestion((prev: any) => {
                    return {
                      ...prev,
                      pairs: [
                        ...(prev.pairs || []),
                        {
                          prompt: { text: "", image: null },
                          answer: { text: "", image: null },
                        },
                      ],
                    };
                  })
                }
                className="flex items-center gap-2 bg-blue-500 text-white font-semibold py-1.5 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
              >
                <PlusIcon size={16} /> إضافة زوج
              </button>
            </div>
            {(matchQ.pairs || []).map((pair: any, index: number) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart("pairs", index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop("pairs", index)}
                className="p-3 bg-white rounded-lg border relative transition-shadow hover:shadow-md"
              >
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <div className="cursor-grab text-gray-400">
                    <GripVertical size={18} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      العنصر {index + 1}
                    </label>
                    <input
                      type="text"
                      placeholder={`العنصر ${index + 1}`}
                      value={pair.prompt?.text || ""}
                      onChange={(e) =>
                        handlePairChange(
                          index,
                          "prompt",
                          "text",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border rounded-md"
                    />
                    <MediaInput
                      label=""
                      image={pair.prompt?.image}
                      onImageChange={(img) =>
                        handlePairChange(index, "prompt", "image", img)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      الإجابة {index + 1}
                    </label>
                    <input
                      type="text"
                      placeholder={`الإجابة ${index + 1}`}
                      value={pair.answer?.text || ""}
                      onChange={(e) =>
                        handlePairChange(
                          index,
                          "answer",
                          "text",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border rounded-md"
                    />
                    <MediaInput
                      label=""
                      image={pair.answer?.image}
                      onImageChange={(img) =>
                        handlePairChange(index, "answer", "image", img)
                      }
                    />
                  </div>
                </div>
                <div className="absolute top-2 left-2">
                  <button
                    type="button"
                    onClick={() => handleRemovePair(index)}
                    className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
                    title="حذف الزوج"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      case "ordering":
        const orderQ = localQuestion as any;
        return (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-lg text-gray-800">
                عناصر الترتيب (بالترتيب الصحيح):
              </label>
              <button
                type="button"
                onClick={() =>
                  setLocalQuestion((prev: any) => {
                    return {
                      ...prev,
                      items: [
                        ...(prev.items || []),
                        { text: "", image: null },
                      ],
                    };
                  })
                }
                className="flex items-center gap-2 bg-blue-500 text-white font-semibold py-1.5 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
              >
                <PlusIcon size={16} /> إضافة عنصر
              </button>
            </div>
            {(orderQ.items || []).map((item: any, index: number) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart("items", index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop("items", index)}
                className="p-3 bg-white rounded-lg border space-y-2 relative transition-shadow hover:shadow-md"
              >
                <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-2">
                  <div className="cursor-grab text-gray-400">
                    <GripVertical size={18} />
                  </div>
                </div>
                <div className="absolute top-2 left-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLocalQuestion((prev: any) => {
                        return {
                          ...prev,
                          items: prev.items.filter(
                            (_: any, i: number) => i !== index
                          ),
                        };
                      })
                    }
                    className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
                    title="حذف العنصر"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="pr-8">
                  <input
                    type="text"
                    placeholder={`العنصر ${index + 1} (نص)`}
                    value={item.text}
                    onChange={(e) => {
                      setLocalQuestion((prev: any) => {
                        const newItems = [...prev.items];
                        newItems[index] = {
                          ...newItems[index],
                          text: e.target.value,
                        };
                        return { ...prev, items: newItems };
                      });
                    }}
                    className="w-full p-2 border rounded-md"
                  />
                  <MediaInput
                    label=""
                    image={item.image}
                    onImageChange={(img) => {
                      setLocalQuestion((prev: any) => {
                        const newItems = [...prev.items];
                        newItems[index] = {
                          ...newItems[index],
                          image: img,
                        };
                        return { ...prev, items: newItems };
                      });
                    }}
                  />
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-500 mt-2">
              املأ العناصر التي تريدها بالترتيب الصحيح. يمكن أن يكون كل
              عنصر نصًا أو صورة أو كليهما.
            </p>
          </div>
        );
      case "classification":
        return renderClassificationEditor();

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-blue-600 border-b pb-3 flex justify-between items-center">
        <span>تحرير السؤال <span className="text-gray-500 font-medium">({questionNumber})</span></span>
        <button 
            onClick={onAddNew}
            className="text-sm bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 flex items-center gap-1 font-normal"
        >
            <PlusIcon size={16} /> سؤال جديد
        </button>
      </h2>
      <div className="p-4 bg-gray-50 rounded-lg border">
        <label
          htmlFor="questionType"
          className="font-semibold text-gray-700"
        >
          نوع السؤال:
        </label>
        <select
          id="questionType"
          value={localQuestion.type}
          onChange={handleTypeChange}
          className="w-full mt-2 p-2 border rounded-md bg-white"
        >
          <option value="multiple-choice">اختيار من متعدد</option>
          <option value="fill-in-the-blank">املأ الفراغ</option>
          <option value="true-false">صح / خطأ</option>
          <option value="short-answer">إجابة قصيرة</option>
          <option value="matching">مطابقة</option>
          <option value="ordering">ترتيب</option>
          <option value="connecting-lines">توصيل</option>
          <option value="classification">تصنيف</option>
        </select>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
        <label className="font-semibold text-gray-700">
          النص القرائي (اختياري):
        </label>
        <RichTextEditor
          value={localQuestion.reading.text}
          onChange={(html) => handleNestedChange("reading", "text", html)}
          placeholder="اكتب النص القرائي هنا..."
        />
        <MediaInput
          label=""
          image={localQuestion.reading.image}
          onImageChange={(img) =>
            handleNestedChange("reading", "image", img)
          }
          audio={localQuestion.reading.audio}
          onAudioChange={(aud) =>
            handleNestedChange("reading", "audio", aud)
          }
        />
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
        <label className="font-semibold text-gray-700">نص السؤال:</label>
        <RichTextEditor
          placeholder="اكتب السؤال هنا..."
          value={localQuestion.question.text}
          onChange={(html) =>
            handleNestedChange("question", "text", html)
          }
          height="80px"
        />
        <MediaInput
          label=""
          image={localQuestion.question.image}
          onImageChange={(img) =>
            handleNestedChange("question", "image", img)
          }
        />
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border">
        {renderEditorFields()}
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
        <label className="font-semibold text-gray-700">
          التغذية الراجعة (اختياري):
        </label>
        <RichTextEditor
          placeholder="اكتب هنا شرحًا للإجابة الصحيحة أو سبب خطأ الإجابات الأخرى."
          value={localQuestion.feedback || ""}
          onChange={(html) => handleChange("feedback", html)}
          height="96px"
        />
      </div>
      <div className="flex flex-wrap justify-center gap-4 pt-4 border-t">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-green-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-600 transition-colors shadow"
        >
          <Save /> حفظ التعديلات
        </button>
        <button
          onClick={() => {
            handleSave();
            onSaveAndNew();
          }}
          className="flex items-center gap-2 bg-blue-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-600 transition-colors shadow"
        >
          <PlusCircle /> حفظ وإضافة جديد
        </button>
        <button
          onClick={() => {
            const savedQuestion = handleSave();
            onPreview(savedQuestion);
          }}
          className="flex items-center gap-2 bg-gray-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-gray-600 transition-colors shadow"
        >
          معاينة
        </button>
      </div>
    </div>
  );
};

export default EditorPanel;
