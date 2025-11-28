import { Question, ExportOptions, MediaContent } from "../types";
import { stripHtml } from "../utils/quizUtils";

// Declare global docx since it is loaded via CDN
declare const window: any;

const MAX_IMAGE_WIDTH = 450;

const processBase64Image = async (base64: string | null) => {
  if (!base64) return null;

  return new Promise<{ data: ArrayBuffer; width: number; height: number } | null>(
    (resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_WIDTH) {
          const ratio = MAX_IMAGE_WIDTH / width;
          width = MAX_IMAGE_WIDTH;
          height *= ratio;
        }

        const byteString = atob(base64.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve({ data: ab, width, height });
      };
      img.onerror = () => resolve(null);
      img.src = base64;
    }
  );
};

const createMediaContentParagraphs = async (
  content: MediaContent,
  docx: any,
  alignment: any
) => {
  const { Paragraph, TextRun, ImageRun } = docx;
  const paragraphs = [];
  const strippedText = stripHtml(content.text);
  if (strippedText) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun(strippedText)],
        alignment: alignment,
        rightToLeft: true,
        style: "Normal",
      })
    );
  }
  if (content.image) {
    const imgData = await processBase64Image(content.image);
    if (imgData) {
      paragraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imgData.data,
              transformation: {
                width: imgData.width,
                height: imgData.height,
              },
            }),
          ],
          alignment: docx.AlignmentType.CENTER,
          style: "Normal",
        })
      );
    }
  }
  return paragraphs;
};

export const exportQuestionsToWord = async (
  questions: Question[],
  options: ExportOptions
) => {
  const docx = window.docx;
  if (!docx) {
    alert("Word export library is not available.");
    return;
  }

  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    HeadingLevel,
    AlignmentType,
    PageBreak,
    VerticalAlign,
    BorderStyle,
  } = docx;

  const children: any[] = [];

  if (options.headerText.trim()) {
    const headerLines = options.headerText.trim().split("\n");
    for (const line of headerLines) {
      children.push(
        new Paragraph({
          text: line,
          alignment: AlignmentType.CENTER,
          rightToLeft: true,
          style: "Normal",
        })
      );
    }
    children.push(new Paragraph({ text: "", style: "Normal" }));
  }

  for (const [index, question] of questions.entries()) {
    let questionHeader = "";
    if (options.includeQuestionNumbers) {
      questionHeader = `السؤال ${index + 1}:`;
    }

    children.push(
      new Paragraph({
        text: questionHeader,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.RIGHT,
        rightToLeft: true,
      })
    );

    if (stripHtml(question.reading.text) || question.reading.image) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "النص القرائي:", bold: true })],
          alignment: AlignmentType.RIGHT,
          rightToLeft: true,
          style: "Normal",
        })
      );
      children.push(
        ...(await createMediaContentParagraphs(
          question.reading,
          docx,
          AlignmentType.RIGHT
        ))
      );
    }

    children.push(
      ...(await createMediaContentParagraphs(
        question.question,
        docx,
        AlignmentType.RIGHT
      ))
    );

    switch (question.type) {
      case "multiple-choice": {
        const mcq = question;
        for (const [optIndex, option] of mcq.options.entries()) {
          const isCorrect = options.includeAnswers && optIndex === mcq.correct;
          const text = `${String.fromCharCode(0x0627 + optIndex)}) ${stripHtml(
            option.text
          )} ${isCorrect ? "(الإجابة الصحيحة)" : ""}`;
          const p = new Paragraph({
            children: [new TextRun(text)],
            alignment: AlignmentType.RIGHT,
            rightToLeft: true,
            style: "Normal",
            indent: { right: 360 },
          });
          children.push(p);
          if (option.image) {
            children.push(
              ...(await createMediaContentParagraphs(
                { text: "", image: option.image },
                docx,
                AlignmentType.RIGHT
              ))
            );
          }
        }
        break;
      }
      case "true-false": {
        children.push(
          new Paragraph({
            text: `\nضع علامة (صح) أو (خطأ) أمام العبارة.`,
            alignment: AlignmentType.RIGHT,
            rightToLeft: true,
            style: "Normal",
          })
        );
        if (options.includeAnswers) {
          const tfq = question;
          children.push(
            new Paragraph({
              text: `الإجابة الصحيحة: ${tfq.correctAnswer ? "صح" : "خطأ"}`,
              alignment: AlignmentType.RIGHT,
              rightToLeft: true,
              style: "strong",
            })
          );
        }
        break;
      }
      case "fill-in-the-blank": {
        children.push(
          new Paragraph({
            text: `........................................`,
            alignment: AlignmentType.RIGHT,
            rightToLeft: true,
            style: "Normal",
          })
        );
        if (options.includeAnswers) {
          const fitb = question;
          children.push(
            new Paragraph({
              text: `الإجابة الصحيحة: ${fitb.correctAnswer}`,
              alignment: AlignmentType.RIGHT,
              rightToLeft: true,
              style: "strong",
            })
          );
        }
        break;
      }
      case "short-answer": {
        children.push(
          new Paragraph({
            text: `........................................`,
            alignment: AlignmentType.RIGHT,
            rightToLeft: true,
            style: "Normal",
          })
        );
        if (options.includeAnswers) {
          const saq = question;
          children.push(
            new Paragraph({
              text: `الإجابات المحتملة: ${saq.correctAnswer}`,
              alignment: AlignmentType.RIGHT,
              rightToLeft: true,
              style: "strong",
            })
          );
        }
        break;
      }
      case "ordering": {
        const oq = question;
        children.push(
          new Paragraph({
            text: "رتب العناصر التالية بالترتيب الصحيح:",
            alignment: AlignmentType.RIGHT,
            rightToLeft: true,
            style: "Normal",
          })
        );

        let itemsToRender = [...oq.items];

        if (!options.includeAnswers && options.randomizeOrderItems) {
           itemsToRender.sort(() => Math.random() - 0.5);
        }

        if (!options.includeAnswers) {
          for (const item of itemsToRender) {
            const text = `(.....) ${stripHtml(item.text)}`;
            const p = new Paragraph({
              children: [new TextRun(text)],
              alignment: AlignmentType.RIGHT,
              rightToLeft: true,
              style: "Normal",
              indent: { right: 360 },
            });
            children.push(p);
            if (item.image) {
              children.push(
                ...(await createMediaContentParagraphs(
                  { text: "", image: item.image },
                  docx,
                  AlignmentType.RIGHT
                ))
              );
            }
          }
        }

        if (options.includeAnswers) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: "الإجابة (الترتيب الصحيح):", bold: true }),
              ],
              alignment: AlignmentType.RIGHT,
              rightToLeft: true,
              style: "Normal",
            })
          );
          for (const [itemIndex, item] of oq.items.entries()) {
            const text = `${itemIndex + 1}- ${stripHtml(item.text)}`;
            const p = new Paragraph({
              children: [new TextRun(text)],
              alignment: AlignmentType.RIGHT,
              rightToLeft: true,
              style: "Normal",
              indent: { right: 360 },
            });
            children.push(p);
            if (item.image) {
              children.push(
                ...(await createMediaContentParagraphs(
                  { text: "", image: item.image },
                  docx,
                  AlignmentType.RIGHT
                ))
              );
            }
          }
        }
        break;
      }
      case "matching":
      case "connecting-lines": {
        const mq = question;
        const instruction =
          mq.type === "matching"
            ? "طابق بين القائمة (أ) و ما يناسبها في القائمة (ب):"
            : "صل بين القائمة (أ) و ما يناسبها في القائمة (ب):";
        children.push(
          new Paragraph({
            text: instruction,
            alignment: AlignmentType.RIGHT,
            rightToLeft: true,
            style: "Normal",
          })
        );

        const rows = [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    text: "القائمة (ب)",
                    alignment: AlignmentType.CENTER,
                    style: "Normal",
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: "القائمة (أ)",
                    alignment: AlignmentType.CENTER,
                    style: "Normal",
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          }),
        ];

        for (const pair of mq.pairs) {
          const promptParas = await createMediaContentParagraphs(
            pair.prompt,
            docx,
            AlignmentType.CENTER
          );
          const answerParas = await createMediaContentParagraphs(
            pair.answer,
            docx,
            AlignmentType.CENTER
          );
          rows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: answerParas,
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: promptParas,
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            })
          );
        }

        const table = new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          rightToLeft: true,
        });
        children.push(table);
        break;
      }

      case "classification": {
        const cq = question as any;
        children.push(new Paragraph({
            text: "صنف العناصر التالية بوضعها في المجموعة المناسبة:",
            alignment: AlignmentType.RIGHT,
            rightToLeft: true,
            style: "Normal"
        }));

        // 1. Items Pool (Student Version: Show items to classify)
        if (!options.includeAnswers) {
            children.push(new Paragraph({
                text: "العناصر:",
                alignment: AlignmentType.RIGHT,
                rightToLeft: true,
                style: "strong"
            }));

            let itemsToRender = [...cq.items];
            if (options.randomizeOrderItems) {
                itemsToRender.sort(() => Math.random() - 0.5);
            }

            for (const item of itemsToRender) {
                const text = `- ${stripHtml(item.text)}`;
                children.push(new Paragraph({
                    children: [new TextRun(text)],
                    alignment: AlignmentType.RIGHT,
                    rightToLeft: true,
                    style: "Normal",
                    indent: { right: 360 }
                }));
                if(item.image) {
                    children.push(...(await createMediaContentParagraphs({text: "", image: item.image}, docx, AlignmentType.RIGHT)));
                }
            }
             children.push(new Paragraph(" "));
        }

        // 2. The Classification Table (Groups as Headers)
        const headerCells = [];
        const bodyCells = [];

        for(const group of cq.groups) {
            // Header Cell
            headerCells.push(new TableCell({
                children: [new Paragraph({
                    text: stripHtml(group.text),
                    alignment: AlignmentType.CENTER,
                    style: "strong"
                })],
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: "F2F2F2" }
            }));

            // Body Cell
            const cellChildren: any[] = [];
            if(options.includeAnswers) {
                // Teacher Version: Show correct items inside
                const groupItems = cq.items.filter((i: any) => i.groupId === group.id);
                for(const item of groupItems) {
                    const text = `• ${stripHtml(item.text)}`;
                    cellChildren.push(new Paragraph({
                        text: text,
                        alignment: AlignmentType.CENTER,
                        rightToLeft: true
                    }));
                    if(item.image) {
                         cellChildren.push(...(await createMediaContentParagraphs({text: "", image: item.image}, docx, AlignmentType.CENTER)));
                    }
                }
                if(groupItems.length === 0) cellChildren.push(new Paragraph(""));
            } else {
                // Student Version: Empty space
                 cellChildren.push(new Paragraph("\n\n\n\n"));
            }

            bodyCells.push(new TableCell({
                children: cellChildren,
                verticalAlign: VerticalAlign.TOP
            }));
        }

        const table = new Table({
            rows: [
                new TableRow({ children: headerCells, tableHeader: true }),
                new TableRow({ children: bodyCells })
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            rightToLeft: true,
            layout: "fixed"
        });

        children.push(table);
        break;
      }
    }

    if (options.questionPerPage && index < questions.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    } else {
      children.push(new Paragraph(" "));
    }
  }

  const doc = new Document({
    creator: "Quiz Editor Pro",
    title: options.headerText.trim() || "Questions",
    description: "Exported from Quiz Editor Pro",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
          rightToLeft: options.forceRtl,
        },
        children: children,
      },
    ],
    styles: {
      default: {
        heading1: {
          run: {
            font: "Tajawal",
            size: 32,
            bold: true,
            color: "000000",
            rtl: true,
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            rightToLeft: true,
            spacing: { after: 240 },
          },
        },
        heading2: {
          run: {
            font: "Tajawal",
            size: 28,
            bold: true,
            color: "000000",
            rtl: true,
          },
          paragraph: {
            alignment: AlignmentType.RIGHT,
            rightToLeft: true,
            spacing: { after: 200, before: 200 },
          },
        },
      },
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "Tajawal",
            size: 24, // 12pt
            rtl: true,
          },
          paragraph: {
            alignment: AlignmentType.RIGHT,
            rightToLeft: true,
            spacing: { after: 120 },
          },
        },
        {
          id: "strong",
          name: "Strong",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { bold: true, rtl: true },
        },
      ],
    },
  });

  Packer.toBlob(doc).then((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz.docx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};