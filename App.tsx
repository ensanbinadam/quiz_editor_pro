import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  dbGet,
  dbSet,
  dbClear,
  saveWorksheetConfig,
  getWorksheetConfig,
  clearWorksheetConfig,
} from "./services/db";
import { exportQuestionsToWord } from "./services/exportService";
import { generateInteractiveQuizHtml } from "./services/quizExportService";
import { ensureQuestionSanity, stripHtml, moveItem } from "./utils/quizUtils";
import { Question, ExportOptions, WorksheetConfig } from "./types";
import EditorPanel from "./components/EditorPanel";
import QuestionList from "./components/QuestionList";
import PreviewModal from "./components/PreviewModal";
import ExportOptionsModal from "./components/ExportOptionsModal";
import WorksheetConfigModal from "./components/WorksheetConfigModal";
import {
  DownloadIcon,
  UploadIcon,
  FileTextIcon,
  PlusIcon,
  TrashIcon,
  LaptopIcon,
} from "./components/Icons";

const generateWorksheetHtml = (
  questions: Question[],
  config: WorksheetConfig
): string => {
  const questionsJson = JSON.stringify(questions);
  const numeralType = config.numeralType || "eastern";
  const teacherName = config.teacherName || "معلم المادة";
  const showPrintButton = config.showPrintButton !== false;

  const getHead = () => {
    return (
      "<!DOCTYPE html>" +
      '<html dir="rtl" lang="ar">' +
      "<head>" +
      '<meta charset="UTF-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />' +
      "<title>" +
      (config.title || "ورقة عمل تفاعلية") +
      "</title>" +
      '<link rel="preconnect" href="https://fonts.googleapis.com" />' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />' +
      '<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />' +
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" defer><' +
      "/script>"
    );
  };

  const getStyles = () => {
    return (
      "<style>" +
      "body { font-family: 'Tajawal', sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 15px; direction: rtl; line-height: 1.6; }" +
      "input, button, textarea, select { font-family: 'Tajawal', sans-serif; }" +
      ".container { max-width: 900px; margin: 0 auto; background-color: #fff; padding: 20px 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); width: 100%; box-sizing: border-box; }" +
      "#worksheet-timer { text-align: center; font-size: 1.4em; font-weight: 700; color: #dc3545; background-color: #f8d7da; padding: 10px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f5c6cb; }" +
      ".header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; gap: 20px; }" +
      ".header-logo img { max-width: 120px; max-height: 100px; object-fit: contain; }" +
      ".header-main { text-align: center; flex-grow: 1; }" +
      ".header-main h1 { margin: 0; color: #0056b3; font-size: 1.8em; line-height: 1.3; }" +
      ".header-main p { margin: 5px 0 0; color: #555; font-size: 1.1em; white-space: pre-wrap; }" +
      ".question-block { margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fdfdfd; overflow-wrap: break-word; page-break-inside: avoid; break-inside: avoid; }" +
      ".question-header { font-size: 1.3em; font-weight: 700; color: #333; margin-bottom: 15px; }" +
      ".question-block img, .mc-option img { max-width: 100%; height: auto; max-height: 300px; object-fit: contain; display: block; margin: 10px auto; border-radius: 8px; }" +
      ".question-text, .reading-text { font-size: 1.15em; margin-bottom: 15px; }" +
      ".options-container { display: flex; flex-direction: column; gap: 10px; }" +
      ".mc-option { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #ccc; border-radius: 8px; cursor: pointer; transition: background-color 0.2s; }" +
      ".mc-option:hover { background-color: #f0f0f0; }" +
      ".mc-option.selected { border-color: #007bff; background-color: #e7f3ff; }" +
      '.mc-option input[type="radio"] { flex-shrink: 0; width: 18px; height: 18px; margin-left: 8px; }' +
      ".fill-blank-input, .short-answer-input { width: 100%; padding: 12px; font-size: 1em; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; background-color: #fff; }" +
      ".tf-option { display: inline-flex; align-items: center; gap: 8px; margin-left: 20px; padding: 5px; cursor: pointer; }" +
      '.tf-option input[type="radio"] { width: 18px; height: 18px; }' +
      /* Classification Styles */
      ".classification-container { display: flex; flex-direction: column; gap: 20px; }" +
      ".classification-groups { display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; margin-bottom: 20px; }" +
      ".group-box { flex: 1; min-width: 200px; background-color: #f8f9fa; border: 2px solid #0056b3; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; }" +
      ".group-header { background-color: #0056b3; color: white; padding: 8px; text-align: center; border-radius: 8px 8px 0 0; font-weight: bold; margin: -10px -10px 10px -10px; }" +
      ".group-drop-zone { min-height: 100px; background-color: #fff; border: 2px dashed #ccc; border-radius: 8px; padding: 8px; display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; transition: background-color 0.2s; }" +
      ".group-drop-zone.over { background-color: #e3f2fd; border-color: #2196f3; }" +
      ".classification-items { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; padding: 15px; background-color: #f1f1f1; border-radius: 12px; border: 1px solid #ddd; min-height: 60px; }" +
      ".class-item { padding: 8px 15px; background-color: #fff; border: 1px solid #999; border-radius: 20px; cursor: grab; user-select: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-weight: 500; display: flex; align-items: center; gap: 5px; }" +
      ".class-item img { max-height: 40px; margin: 0; }" +
      ".class-item.dragging { opacity: 0.5; }" +
      ".class-item.correct { background-color: #d4edda; border-color: #28a745; color: #155724; }" +
      ".class-item.wrong { background-color: #f8d7da; border-color: #dc3545; color: #721c24; }" +
      /* --------------------------------------- */ ".matching-container, .connecting-container { display: flex; flex-wrap: wrap; gap: 20px; justify-content: space-between; margin-bottom: 20px; }" +
      ".matching-column, .column { flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 10px; }" +
      ".matching-prompt-item { display: flex; flex-direction: column; gap: 10px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0; }" +
      ".prompt-content { text-align: center; font-weight: 600; }" +
      ".drop-zone { min-height: 60px; border: 2px dashed #bbb; border-radius: 8px; background-color: #fff; transition: all 0.2s; display: flex; align-items: center; justify-content: center; padding: 5px; }" +
      ".drop-zone.over { background-color: #e3f2fd; border-color: #2196f3; transform: scale(1.01); }" +
      ".drop-zone.correct { border-color: #28a745; background-color: #d4edda; }" +
      ".drop-zone.wrong { border-color: #dc3545; background-color: #f8d7da; }" +
      ".answer-item, .ordering-item { width: 100%; box-sizing: border-box; padding: 12px; background-color: #fff; border: 1px solid #007bff; border-radius: 8px; cursor: grab; text-align: center; user-select: none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); touch-action: none; }" +
      ".answer-item:active, .ordering-item:active { cursor: grabbing; opacity: 0.8; }" +
      ".answer-item img, .ordering-item img, .connect-item img { max-height: 80px; display: block; margin: 0 auto 5px; max-width: 100%; }" +
      ".ordering-container { display: flex; flex-direction: column; gap: 10px; padding: 15px; border: 2px solid #eee; border-radius: 8px; min-height: 100px; }" +
      ".ordering-item { display: flex; align-items: center; gap: 15px; border-color: #ccc; }" +
      ".ordering-item::before { content: '☰'; font-size: 1.4em; color: #999; cursor: grab; padding: 0 10px; }" +
      ".ordering-container.correct { border-color: #28a745; background-color: #f0fff4; }" +
      ".ordering-container.wrong { border-color: #dc3545; background-color: #fff5f5; }" +
      ".connecting-container { position: relative; }" +
      ".connection-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }" +
      ".connect-item { padding: 12px; border: 1px solid #ccc; border-radius: 6px; background-color: #fff; cursor: pointer; display: flex; align-items: center; gap: 10px; z-index: 2; min-height: 50px; }" +
      ".connect-item.selected { border: 2px solid #007bff; background-color: #e7f3ff; }" +
      ".connect-item.connect-correct { background-color: #e6f7ec; border-color: #28a745; }" +
      ".connect-item.connect-wrong { background-color: #fdecea; border-color: #dc3545; }" +
      ".action-button { display: block; width: 100%; max-width: 300px; margin: 40px auto 20px; padding: 15px 20px; font-size: 1.2em; font-weight: 700; color: #fff; background-color: #28a745; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }" +
      ".action-button:hover { background-color: #218838; }" +
      ".result-panel { text-align: center; padding: 20px; margin-top: 30px; border-radius: 8px; }" +
      ".result-panel.success { background-color: #d4edda; color: #155724; }" +
      ".result-panel.failure { background-color: #f8d7da; color: #721c24; }" +
      ".result-buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 15px; }" +
      /* Certificate Container Default */
      ".config-panel, .certificate-container { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 1000; width: 90%; max-width: 600px; text-align: right; max-height: 90vh; overflow-y: auto; }" +
      ".config-panel h3 { text-align: center; } .config-panel .form-group { margin-bottom: 1rem; } .config-panel .form-control { width: 100%; } " +
      /* IMPROVED CERTIFICATE STYLES (MATCHED EXACTLY WITH INTERACTIVE QUIZ) */
      ".certificate-container { max-width: 800px; margin: 20px auto; background: #ffffff; border: 10px solid #007bff; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); position: relative; text-align: center; color: #212529; box-sizing: border-box; }" +
      ".certificate-header { display: flex; flex-direction: column; align-items: center; gap: 15px; margin-bottom: 10px; }" +
      ".certificate-logo { max-width: 100px; max-height: 100px; object-fit: contain; }" +
      ".certificate-quiz-title { color: #343a40; font-size: 1.5em; font-weight: 500; margin: 0; }" +
      ".certificate-title { color: #007bff; font-size: 2.8em; font-weight: bold; margin: 15px 0 20px 0; }" +
      ".certificate-body { margin: 30px 0; padding: 20px; border: 2px dashed #007bff; border-radius: 12px; background: #f8f9fa; }" +
      ".student-name { font-size: 2em; color: #0056b3; margin: 20px 0; font-weight: bold; word-break: break-word; }" +
      ".achievement-text { font-size: 1.3em; color: #212529; margin: 15px 0; }" +
      ".score-text { font-size: 1.4em; color: #28a745; font-weight: bold; margin: 8px 0; }" +
      ".teacher-name { font-size: 1.3em; color: #0056b3; margin-top: 30px; }" +
      ".certificate-footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 0.9em; }" +
      ".certificate-seal { position: absolute; left: 30px; bottom: 50px; max-width: 120px; max-height: 120px; opacity: 0.9; object-fit: contain; z-index: 10; }" +
      ".certificate-buttons { margin-top: 25px; display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; }" +
      ".certificate-btn, .restart-btn { padding: 12px 25px; font-size: 1.1em; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s ease; color: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }" +
      ".certificate-btn { background: #007bff; }" +
      ".restart-btn { background: #6c757d; }" +
      ".certificate-btn:hover, .restart-btn:hover { filter: brightness(90%); transform: translateY(-2px); }" +
      "#worksheet-footer { text-align: center; margin-top: 20px; color: #6c757d; white-space: pre-wrap; }" +
      "#credits-footer { text-align: center; padding: 15px; font-size: 0.9em; color: #555; max-width: 900px; margin: 20px auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); } #credits-footer a { color: #0056b3; text-decoration: none; font-weight: bold; } #credits-footer a:hover { text-decoration: underline; }" +
      /* Print Button */
      ".print-btn-container { text-align: center; margin-bottom: 20px; }" +
      ".print-btn { background-color: #333; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-family: 'Tajawal', sans-serif; display: inline-flex; align-items: center; gap: 8px; transition: background 0.3s; }" +
      ".print-btn:hover { background-color: #555; }" +
      /* PRINT STYLES - ROBUST IMPLEMENTATION USING CLASS TOGGLE */
      "@media print { " +
      "  body { margin: 0; padding: 0; background-color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; } " +
      /* Mode 1: Certificate Print (when body has 'print-certificate-mode' class) */
      "  body.print-certificate-mode > * { display: none !important; } " +
      "  body.print-certificate-mode .certificate-container-print-wrapper { display: block !important; position: absolute; top: 0; left: 0; width: 100% !important; height: 100% !important; background: white; z-index: 9999; } " +
      "  body.print-certificate-mode .certificate-container-print-wrapper .certificate-container { display: block !important; width: 100% !important; max-width: 100% !important; border: 10px solid #007bff !important; box-shadow: none !important; margin: 0 auto !important; padding: 20px !important; position: relative !important; left: auto !important; top: auto !important; transform: none !important; box-sizing: border-box !important; } " +
      "  body.print-certificate-mode .certificate-container-print-wrapper .certificate-seal { position: absolute !important; left: 30px !important; bottom: 50px !important; z-index: 10 !important; opacity: 1 !important; } " +
      "  body.print-certificate-mode .certificate-buttons { display: none !important; } " +
      /* Mode 2: Standard Worksheet Print (default, when body DOES NOT have class) */
      "  body:not(.print-certificate-mode) .action-button, " +
      "  body:not(.print-certificate-mode) #worksheet-footer, " +
      "  body:not(.print-certificate-mode) #credits-footer, " +
      "  body:not(.print-certificate-mode) #result-panel, " +
      "  body:not(.print-certificate-mode) #worksheet-timer, " +
      "  body:not(.print-certificate-mode) .config-panel, " +
      "  body:not(.print-certificate-mode) .print-btn-container, " +
      "  body:not(.print-certificate-mode) .certificate-container, " +
      "  body:not(.print-certificate-mode) #certificateForm { display: none !important; } " +
      "  body:not(.print-certificate-mode) .container { display: block !important; width: 100%; max-width: 100%; box-shadow: none; border: none; padding: 20px; margin: 0; } " +
      "  body:not(.print-certificate-mode) .question-block { border: 1px solid #ccc; break-inside: avoid; page-break-inside: avoid; margin-bottom: 15px; padding: 15px; background-color: #fff !important; } " +
      "} " +
      "</style>" +
      "</head>"
    );
  };

  const getBody = () => {
    let body = "<body>" + '<div class="container">' + '<header class="header">';

    if (config.logo) {
      body +=
        '<div class="header-logo"><img id="quizLogo" src="' +
        config.logo +
        '" alt="' +
        (config.logoAlt || "شعار") +
        '"></div>';
    }

    body +=
      '<div class="header-main">' +
      '<h1 id="quizTitle">' +
      config.title +
      "</h1>" +
      '<p id="instructions">' +
      config.instructions +
      "</p>" +
      "</div>" +
      "</header>";

    if (showPrintButton) {
      body +=
        '<div class="print-btn-container"><button onclick="window.print()" class="print-btn">🖨️ طباعة ورقة العمل</button></div>';
    }

    if (config.useTimer) {
      body += '<div id="worksheet-timer" style="display: none;"></div>';
    }

    body +=
      '<main id="questions-container"></main>' +
      '<button id="check-answers-btn" class="action-button">تصحيح الإجابات</button>' +
      '<div id="result-panel" class="result-panel" style="display: none;"></div>' +
      '<footer id="worksheet-footer"><p>' +
      config.footer +
      "</p></footer>" +
      "</div>";

    body +=
      '<div class="config-panel" id="certificateForm">' +
      "<h3>بيانات الشهادة</h3>" +
      '<div class="form-group"><label for="studentNameInput">اسم الطالب:</label><input class="form-control" id="studentNameInput" type="text" placeholder="أدخل اسم الطالب" /></div>' +
      '<div class="form-group" style="display: flex; justify-content: center; gap: 15px;"><button class="certificate-btn" onclick="generateCertificate()" style="background: #28a745;">إنشاء الشهادة</button><button class="certificate-btn" onclick="closeCertificateForm()" style="background: #6c757d;">إغلاق</button></div>' +
      "</div>";

    body +=
      '<div class="certificate-container" id="certificateContainer">' +
      '<div class="certificate-header">';
    if (config.logo) {
      body +=
        '<img id="certificateLogo" src="' +
        config.logo +
        '" alt="' +
        (config.logoAlt || "شعار") +
        '" class="certificate-logo" />';
    }
    body +=
      '<h2 class="certificate-quiz-title" id="certificateQuizTitle">' +
      config.title +
      "</h2>" +
      "</div>" +
      '<h1 class="certificate-title">شهادة إنجاز</h1>' +
      '<div class="certificate-body">' +
      '<div class="student-name" id="certificateStudentName"></div>' +
      '<div class="achievement-text">تهانينا! لقد أتممت ورقة العمل التفاعلية بنجاح</div>' +
      '<div class="score-text" id="certificateScoreText" style="color: #28a745;"></div>' +
      '<div class="achievement-text">نظير جهودك المتميزة، نقدم لك هذه الشهادة تقديرًا لإنجازك.</div>' +
      '<div class="teacher-name" id="certificateTeacherName"></div>' +
      "</div>" +
      '<div class="certificate-footer"><p>شهادة معتمدة من نظام الاختبارات التفاعلية</p></div>' +
      (config.seal
        ? '<img id="certificateSeal" src="' +
          config.seal +
          '" class="certificate-seal" alt="ختم"/>'
        : "") +
      '<div class="certificate-buttons">' +
      '<button class="certificate-btn" onclick="printCertificate()" style="background: #007bff;">🖨️ طباعة</button>' +
      '<button class="certificate-btn" onclick="downloadCertificate()" style="background: #28a745;">📥 حفظ كصورة</button>' +
      '<button class="certificate-btn" onclick="closeCertificate()" style="background: #6c757d;">✕ إغلاق</button>' +
      "</div>" +
      "</div>";

    body +=
      '<footer id="credits-footer">' +
      '<p style="font-size: 0.9em; color: #4B5563; margin-bottom: 8px;">' +
      '<a href="https://t.me/Interact2030" target="_blank" rel="noopener noreferrer" style="color: #4B5563;">' +
      "برمجة و تصميم/ ملتقى التعليم التفاعلي بملتقى معلمي ومعلمات الرياضيات ـ المملكة العربية السعودية." +
      "</a>" +
      "</p>" +
      '<p style="font-size: 0.8em; color: #6B7281;">' +
      'تمت البرمجة باستخدام <a href="https://developers.google.com/studio" target="_blank" rel="noopener noreferrer">Google Studio</a> و ' +
      '<a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer">Gemini</a> بواسطة ' +
      '<a href="https://t.me/Interact2030" target="_blank" rel="noopener noreferrer">ملتقى التعليم التفاعلي</a>.' +
      "</p>" +
      "</footer>";

    return body;
  };

  const getScript = () => {
    const scriptContent = `
        const questionsData = ${questionsJson};
        const NUMERAL_TYPE = "${numeralType}";
        const PASS_PERCENTAGE = 80;
        const TEACHER_NAME = "${teacherName}";
        let draggedElement = null;
        let timerInterval = null;
        const USE_TIMER = ${config.useTimer};
        let selectedConnector = null;
        let connections = {};
        let finalScoreData = {};

        function formatNumber(num) {
            if (NUMERAL_TYPE === 'western') return num;
            return num.toString().replace(/\\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
        }

        function formatText(html) {
            if (!html) return "";
            if (NUMERAL_TYPE === 'western') return html;
            const div = document.createElement('div');
            div.innerHTML = html;
            const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                node.nodeValue = node.nodeValue.replace(/\\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
            }
            return div.innerHTML;
        }

        function startWorksheetTimer() {
            if (!USE_TIMER) return;
            const timerElement = document.getElementById('worksheet-timer');
            if (!timerElement) return;
            timerElement.style.display = 'block';
            let duration = ${config.timerDuration || 20} * 60;

            timerInterval = setInterval(() => {
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                timerElement.textContent = 'الوقت المتبقي: ' + formatNumber(minutes) + ':' + (seconds < 10 ? '٠' : '') + formatNumber(seconds);

                if (--duration < 0) {
                    clearInterval(timerInterval);
                    alert('انتهى الوقت! سيتم إعادة تحميل الصفحة.');
                    location.reload();
                }
            }, 1000);
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.ordering-item:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function handleDragStart(e) {
            draggedElement = e.target;
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData('text/plain', '');
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }

        function handleDragEnd(e) {
            if(e.target) e.target.classList.remove('dragging');
            draggedElement = null;
            document.querySelectorAll('.drop-zone, .group-drop-zone').forEach(el => el.classList.remove('over'));
        }

        function handleDragOver(e) {
            e.preventDefault();
            const dropZone = e.target.closest('.drop-zone') || e.target.closest('.group-drop-zone');
            if (dropZone) {
                dropZone.classList.add('over');
            }
            const orderingContainer = e.target.closest('.ordering-container');
            if (orderingContainer && draggedElement && draggedElement.classList.contains('ordering-item')) {
                const afterElement = getDragAfterElement(orderingContainer, e.clientY);
                if (afterElement == null) {
                    orderingContainer.appendChild(draggedElement);
                } else {
                    orderingContainer.insertBefore(draggedElement, afterElement);
                }
            }
        }

        function handleDragLeave(e) {
             const dropZone = e.target.closest('.drop-zone') || e.target.closest('.group-drop-zone');
             if (dropZone) {
                 dropZone.classList.remove('over');
             }
        }

        function handleDrop(e) {
            e.preventDefault();
            const dropZone = e.target.closest('.drop-zone');
            const groupDropZone = e.target.closest('.group-drop-zone');

            if (dropZone && draggedElement && draggedElement.classList.contains('answer-item')) {
                dropZone.classList.remove('over');
                if (dropZone.children.length > 0) {
                     const existing = dropZone.firstElementChild;
                     const qBlock = dropZone.closest('.question-block');
                     const answersCol = qBlock.querySelector('.matching-column:last-child');
                     if(answersCol) answersCol.appendChild(existing);
                }
                dropZone.appendChild(draggedElement);
            } else if (groupDropZone && draggedElement && draggedElement.classList.contains('class-item')) {
                groupDropZone.classList.remove('over');
                groupDropZone.appendChild(draggedElement);
            }
        }

        function handleConnectorClick(e, qIndex) { const item = e.target.closest(".connect-item"); if (!item) return; if (!connections[qIndex]) connections[qIndex] = []; if (selectedConnector) { if (selectedConnector.dataset.column === item.dataset.column) return; const existingConnection = connections[qIndex].find(c => c.includes(selectedConnector.id) || c.includes(item.id)); if (existingConnection) return; const startElem = selectedConnector.dataset.column === "prompt" ? selectedConnector : item; const endElem = selectedConnector.dataset.column === "answer" ? selectedConnector : item; connections[qIndex].push([startElem.id, endElem.id]); drawConnections(qIndex); selectedConnector.classList.remove("selected"); selectedConnector = null; } else { const existingConnection = connections[qIndex].find(c => c.includes(item.id)); if (existingConnection) { connections[qIndex] = connections[qIndex].filter(c => !c.includes(item.id)); drawConnections(qIndex); } else { selectedConnector = item; item.classList.add("selected"); } } }
        function drawConnections(qIndex) { const svg = document.getElementById("connection-svg-" + qIndex); if (!svg) return; const container = svg.parentElement; svg.innerHTML = ""; if (!connections[qIndex]) return; connections[qIndex].forEach(conn => { const startElem = document.getElementById(conn[0]); const endElem = document.getElementById(conn[1]); if (!startElem || !endElem) return; const startRect = startElem.getBoundingClientRect(); const endRect = endElem.getBoundingClientRect(); const containerRect = container.getBoundingClientRect(); const x1 = startRect.left < endRect.left ? startRect.right - containerRect.left : startRect.left - containerRect.left; const y1 = startRect.top + startRect.height / 2 - containerRect.top; const x2 = startRect.left < endRect.left ? endRect.left - containerRect.left : endRect.right - containerRect.left; const y2 = endRect.top + endRect.height / 2 - containerRect.top; const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("x1", x1); line.setAttribute("y1", y1); line.setAttribute("x2", x2); line.setAttribute("y2", y2); line.setAttribute("stroke", "#007bff"); line.setAttribute("stroke-width", "3"); svg.appendChild(line); }); }

        function renderQuestions() {
            const container = document.getElementById("questions-container");
            container.innerHTML = "";
            questionsData.forEach((q, index) => {
                const questionBlock = document.createElement("div");
                questionBlock.className = "question-block";
                questionBlock.id = "question-" + index;

                let content = '<div class="question-header">السؤال ' + formatNumber(index + 1) + '</div>';
                if (q.reading && (q.reading.text || q.reading.image)) {
                    content += '<div class="reading-text">';
                    if (q.reading.text) content += '<div>' + formatText(q.reading.text) + '</div>';
                    if (q.reading.image) content += '<img src="' + q.reading.image + '" alt="نص قرائي"> ';
                    if (q.reading.audio) content += '<audio src="' + q.reading.audio + '" controls style="margin-top: 10px; width: 100%;"></audio>';
                    content += '</div>';
                }
                content += '<div class="question-text">' + formatText(q.question.text);
                if (q.question.image) { content += '<img src="' + q.question.image + '" alt="صورة السؤال">'; }
                content += '</div><div class="options-container">';

                switch (q.type) {
                    case "multiple-choice":
                        q.options.forEach((opt, i) => {
                            content += '<label class="mc-option"><input type="radio" name="q' + index + '" value="' + i + '"><div class="mc-option-content">' + formatText(opt.text) + '</div>' + (opt.image ? '<img src="' + opt.image + '" alt="خيار"> ' : "") + '</label>';
                        });
                        break;
                    case "true-false":
                        content += '<label class="tf-option"><input type="radio" name="q' + index + '" value="true"> صح</label><label class="tf-option"><input type="radio" name="q' + index + '" value="false"> خطأ</label>';
                        break;
                    case "fill-in-the-blank":
                        content += '<input type="text" class="fill-blank-input" placeholder="اكتب إجابتك هنا...">';
                        break;
                    case "short-answer":
                        content += '<textarea class="short-answer-input" rows="3" placeholder="اكتب إجابتك هنا..."></textarea>';
                        break;

                    case "ordering":
                        content += '<div class="ordering-container">';
                        const shuffledItems = [...q.items].map((item, originalIndex) => ({...item, originalIndex})).sort(() => Math.random() - 0.5);
                        shuffledItems.forEach((item) => {
                            content += '<div class="ordering-item" draggable="true" data-original-index="' + item.originalIndex + '">';
                            if(item.image) content += '<img src="' + item.image + '"> ';
                            if(item.text) content += '<span>' + formatText(item.text) + '</span>';
                            content += '</div>';
                        });
                        content += '</div>';
                        break;

                    case "matching":
                        content += '<div class="matching-container">';
                        content += '<div class="matching-column">';
                        q.pairs.forEach((p, i) => {
                            content += '<div class="matching-prompt-item">';
                            content += '<div class="prompt-content">';
                            if (p.prompt.image) content += '<img src="' + p.prompt.image + '">';
                            if (p.prompt.text) content += '<p>' + formatText(p.prompt.text) + '</p>';
                            content += '</div>';
                            content += '<div class="drop-zone" data-expected-index="' + i + '"></div>';
                            content += '</div>';
                        });
                        content += '</div>';
                        content += '<div class="matching-column">';
                        const answersWithIndex = q.pairs.map((p, i) => ({ content: p.answer, originalIndex: i }));
                        const shuffledAnswers = answersWithIndex.sort(() => Math.random() - 0.5);
                        shuffledAnswers.forEach(item => {
                            content += '<div class="answer-item" draggable="true" data-original-index="' + item.originalIndex + '">';
                            if (item.content.image) content += '<img src="' + item.content.image + '">';
                            if (item.content.text) content += '<p>' + formatText(item.content.text) + '</p>';
                            content += '</div>';
                        });
                        content += '</div>';
                        content += '</div>';
                        break;

                    case "connecting-lines":
                        const pairsWithIndices = q.pairs.map((p, i) => ({ answer: p.answer, originalIndex: i }));
                        const shuffledConnectAnswers = pairsWithIndices.sort(() => Math.random() - 0.5);
                        
                        content += '<div class="connecting-container" onclick="handleConnectorClick(event, ' + index + ')"><svg id="connection-svg-' + index + '" class="connection-svg"></svg><div class="column">' + 
                            q.pairs.map((p, i) => '<div class="connect-item" data-column="prompt" id="q' + index + '-prompt' + i + '" data-prompt-index="' + i + '">' + (p.prompt.image ? '<img src="' + p.prompt.image + '">' : "") + " " + formatText(p.prompt.text) + '</div>').join("") + 
                            '</div><div class="column">' + 
                            shuffledConnectAnswers.map((p, i) => { 
                                return '<div class="connect-item" data-column="answer" id="q' + index + '-answer' + i + '" data-answer-index="' + p.originalIndex + '">' + (p.answer.image ? '<img src="' + p.answer.image + '">' : "") + " " + formatText(p.answer.text) + '</div>'; 
                            }).join("") + 
                            '</div></div>';
                        break;

                    case "classification":
                        content += '<div class="classification-container">';

                        // 1. Render Groups (Buckets)
                        content += '<div class="classification-groups">';
                        q.groups.forEach(g => {
                            content += '<div class="group-box">';
                            content += '<div class="group-header">' + formatText(g.text) + '</div>';
                            // Group Body (Drop Zone)
                            content += '<div class="group-drop-zone" data-group-id="' + g.id + '"></div>';
                            content += '</div>';
                        });
                        content += '</div>';

                        // 2. Render Items (Draggable Pool)
                        content += '<div class="classification-items">';
                        const shuffledClassItems = [...q.items].sort(() => Math.random() - 0.5);
                        shuffledClassItems.forEach(item => {
                            content += '<div class="class-item" draggable="true" data-group-id="' + item.groupId + '">';
                            if (item.image) content += '<img src="' + item.image + '">';
                            if (item.text) content += '<span>' + formatText(item.text) + '</span>';
                            content += '</div>';
                        });
                        content += '</div>';

                        content += '</div>';
                        break;
                }
                content += '</div><div id="feedback-' + index + '" class="feedback" style="display:none;"></div>';
                questionBlock.innerHTML = content;
                container.appendChild(questionBlock);

                if (q.type === "matching") {
                    const answers = questionBlock.querySelectorAll('.answer-item');
                    answers.forEach(el => { el.addEventListener('dragstart', handleDragStart); el.addEventListener('dragend', handleDragEnd); });
                    const drops = questionBlock.querySelectorAll('.drop-zone');
                    drops.forEach(el => { el.addEventListener('dragover', handleDragOver); el.addEventListener('dragleave', handleDragLeave); el.addEventListener('drop', handleDrop); });
                }
                if (q.type === "ordering") {
                    const container = questionBlock.querySelector('.ordering-container');
                    container.addEventListener('dragover', handleDragOver);
                    const items = container.querySelectorAll('.ordering-item');
                    items.forEach(item => { item.addEventListener('dragstart', handleDragStart); item.addEventListener('dragend', handleDragEnd); });
                }
                if (q.type === "classification") {
                    const items = questionBlock.querySelectorAll('.class-item');
                    items.forEach(el => { el.addEventListener('dragstart', handleDragStart); el.addEventListener('dragend', handleDragEnd); });
                    const drops = questionBlock.querySelectorAll('.group-drop-zone');
                    drops.forEach(el => { el.addEventListener('dragover', handleDragOver); el.addEventListener('dragleave', handleDragLeave); el.addEventListener('drop', handleDrop); });

                    // Also allow dropping back to the pool
                    const pool = questionBlock.querySelector('.classification-items');
                    if(pool) {
                        pool.addEventListener('dragover', handleDragOver);
                        pool.addEventListener('drop', (e) => {
                            e.preventDefault();
                            const dragged = document.querySelector('.class-item.dragging');
                            if(dragged) {
                                pool.appendChild(dragged);
                            }
                        });
                    }
                }
            });
            document.getElementById("check-answers-btn").addEventListener("click", checkAnswers);
        }

        function checkAnswers() {
            let score = 0;
            questionsData.forEach((q, index) => {
                const questionBlock = document.getElementById("question-" + index);
                let isCorrect = false;
                let feedbackDiv = document.getElementById("feedback-" + index);

                switch (q.type) {
                    case "multiple-choice": const selectedOption = questionBlock.querySelector('input[name="q' + index + '"]:checked'); if (selectedOption && parseInt(selectedOption.value) === q.correct) { isCorrect = true; } break;
                    case "true-false": const selectedTF = questionBlock.querySelector('input[name="q' + index + '"]:checked'); if (selectedTF && (selectedTF.value === String(q.correctAnswer))) { isCorrect = true; } break;
                    case "fill-in-the-blank": const fitbInput = questionBlock.querySelector(".fill-blank-input").value.trim(); const correctAnswers = q.correctAnswer.split("|").map(a => a.trim()); if (correctAnswers.includes(fitbInput)) { isCorrect = true; } break;
                    case "short-answer": const saInput = questionBlock.querySelector(".short-answer-input").value.trim(); const correctSAAnswers = q.correctAnswer.split("|").map(a => a.trim()); if (correctSAAnswers.includes(saInput)) { isCorrect = true; } break;
                    case "ordering": const orderingContainer = questionBlock.querySelector(".ordering-container"); const currentItems = orderingContainer.querySelectorAll(".ordering-item"); const currentOrder = Array.from(currentItems).map(item => parseInt(item.dataset.originalIndex)); isCorrect = true; for (let i = 0; i < currentOrder.length; i++) { if (currentOrder[i] !== i) { isCorrect = false; break; } } if(isCorrect) { orderingContainer.classList.add('correct'); } else { orderingContainer.classList.add('wrong'); } break;
                    case "matching": const dropZones = questionBlock.querySelectorAll('.drop-zone'); let allMatchesCorrect = true; dropZones.forEach(zone => { const droppedItem = zone.querySelector('.answer-item'); const expectedIndex = parseInt(zone.dataset.expectedIndex); if (!droppedItem) { allMatchesCorrect = false; zone.classList.add('wrong'); } else { const actualIndex = parseInt(droppedItem.dataset.originalIndex); if (actualIndex === expectedIndex) { zone.classList.add('correct'); } else { allMatchesCorrect = false; zone.classList.add('wrong'); } droppedItem.draggable = false; } }); isCorrect = allMatchesCorrect; break;
                    case "connecting-lines": const userConnections = connections[index] || []; if (userConnections.length !== q.pairs.length) { isCorrect = false; break; } let connectCorrect = true; for (const conn of userConnections) { const promptElem = document.getElementById(conn[0]); const answerElem = document.getElementById(conn[1]); if (!promptElem || !answerElem) { connectCorrect = false; break; } if (promptElem.dataset.promptIndex !== answerElem.dataset.answerIndex) { connectCorrect = false; break; } } isCorrect = connectCorrect; break;
                    case "classification":
                        let allClassCorrect = true;
                        // Check if pool is empty (all items placed)
                        const pool = questionBlock.querySelector('.classification-items');
                        if (pool.children.length > 0) {
                            allClassCorrect = false;
                        }

                        // Check items in each group
                        const groups = questionBlock.querySelectorAll('.group-drop-zone');
                        groups.forEach(g => {
                            const targetGroupId = g.dataset.groupId;
                            const itemsInGroup = g.querySelectorAll('.class-item');

                            itemsInGroup.forEach(item => {
                                const itemGroupId = item.dataset.groupId;
                                if (itemGroupId === targetGroupId) {
                                    item.classList.add('correct');
                                } else {
                                    item.classList.add('wrong');
                                    allClassCorrect = false;
                                }
                                item.draggable = false; // Lock
                            });
                        });
                        isCorrect = allClassCorrect;
                        break;
                }
                if (isCorrect) { score++; if (q.feedback) { feedbackDiv.innerHTML = formatText(q.feedback); feedbackDiv.className = "feedback correct"; feedbackDiv.style.display = "block"; } } else { if (q.feedback) { feedbackDiv.innerHTML = formatText(q.feedback); feedbackDiv.className = "feedback incorrect"; feedbackDiv.style.display = "block"; } }
            });
            displayResult(score, questionsData.length);
        }

        function displayResult(score, total) { const resultPanel = document.getElementById("result-panel"); const percentage = total > 0 ? (score / total) * 100 : 0; let message = "<h2>نتيجتك: " + formatNumber(score) + " من " + formatNumber(total) + " (" + formatNumber(percentage.toFixed(0)) + "%)</h2>"; 
        
        let buttonsHtml = '<div class="result-buttons">';
        if (percentage >= PASS_PERCENTAGE) { 
            resultPanel.className = "result-panel success"; 
            message += '<p>ممتاز! لقد اجتزت ورقة العمل بنجاح.</p>'; 
            buttonsHtml += '<button id="certificateBtn" class="certificate-btn" onclick="openCertificateForm()">🏆 الحصول على شهادة إنجاز</button>'; 
        } else { 
            resultPanel.className = "result-panel failure"; 
            message += "<p>للحصول على شهادة، يجب تحقيق " + formatNumber(PASS_PERCENTAGE) + "% على الأقل. حاول مرة أخرى!</p>"; 
        } 
        buttonsHtml += '<button class="restart-btn" onclick="location.reload()">إعادة المحاولة</button>';
        buttonsHtml += '</div>';
        
        message += buttonsHtml;
        resultPanel.innerHTML = message; 
        resultPanel.style.display = "block"; 
        document.getElementById("check-answers-btn").style.display = "none"; 
        }
        function openCertificateForm() { const score = document.querySelector(".result-panel h2").textContent; finalScoreData.scoreText = score; document.getElementById("certificateForm").style.display = "block"; }
        function closeCertificateForm() { document.getElementById("certificateForm").style.display = "none"; }
        function generateCertificate() { const studentName = document.getElementById("studentNameInput").value; if (!studentName) { alert("الرجاء إدخال اسم الطالب."); return; } document.getElementById("certificateStudentName").innerText = studentName; document.getElementById("certificateTeacherName").innerText = "المعلم: " + TEACHER_NAME; document.getElementById("certificateScoreText").innerText = "حققت نتيجة " + finalScoreData.scoreText.replace('%', '') + '%'; closeCertificateForm(); document.getElementById("certificateContainer").style.display = "block"; }
        function closeCertificate() { document.getElementById("certificateContainer").style.display = "none"; }
        
        function printCertificate() { 
            document.body.classList.add('print-certificate-mode');
            const cert = document.getElementById("certificateContainer"); 
            const wrapper = document.createElement('div'); 
            wrapper.className = 'certificate-container-print-wrapper'; 
            wrapper.appendChild(cert.cloneNode(true)); 
            document.body.appendChild(wrapper); 
            
            // Allow browser to render the wrapper before printing
            setTimeout(() => {
                window.print(); 
                document.body.removeChild(wrapper); 
                document.body.classList.remove('print-certificate-mode');
            }, 100);
        }
        
        function downloadCertificate() {
            const certElement = document.getElementById("certificateContainer");
            const buttons = certElement.querySelector('.certificate-buttons');
            if (buttons) buttons.style.display = 'none';

            // Robust capture method matching Interactive Quiz
            const originalStyles = {
                position: certElement.style.position,
                top: certElement.style.top,
                left: certElement.style.left,
                transform: certElement.style.transform,
                zIndex: certElement.style.zIndex,
                display: certElement.style.display
            };

            // Force absolute positioning at top-left of document for capture
            certElement.style.position = 'absolute';
            certElement.style.top = '0';
            certElement.style.left = '0';
            certElement.style.transform = 'none';
            certElement.style.zIndex = '9999';
            
            // Ensure it's visible
            certElement.style.display = 'block';

            html2canvas(certElement, { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                scrollX: 0,
                scrollY: 0,
                windowWidth: document.documentElement.scrollWidth,
                windowHeight: document.documentElement.scrollHeight
            }).then(canvas => {
                const link = document.createElement("a");
                link.download = "certificate.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
            }).finally(() => {
                // Restore styles
                certElement.style.position = originalStyles.position;
                certElement.style.top = originalStyles.top;
                certElement.style.left = originalStyles.left;
                certElement.style.transform = originalStyles.transform;
                certElement.style.zIndex = originalStyles.zIndex;
                certElement.style.display = originalStyles.display;
                
                if (buttons) buttons.style.display = 'flex';
            });
        }

        window.openCertificateForm = openCertificateForm;
        window.closeCertificateForm = closeCertificateForm;
        window.generateCertificate = generateCertificate;
        window.closeCertificate = closeCertificate;
        window.printCertificate = printCertificate;
        window.downloadCertificate = downloadCertificate;
        window.handleConnectorClick = handleConnectorClick;

        document.addEventListener("DOMContentLoaded", () => {
            renderQuestions();
            startWorksheetTimer();
        });
      `;
    return "<script>" + scriptContent + "<" + "/script></body></html>";
  };

  return getHead() + getStyles() + getBody() + getScript();
};

const App = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedQuestionIndices, setSelectedQuestionIndices] = useState<
    Set<number>
  >(new Set());
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isDocxReady, setIsDocxReady] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWorksheetConfigOpen, setIsWorksheetConfigOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"worksheet" | "interactive">(
    "worksheet"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadState = async () => {
      try {
        const state = await dbGet();
        if (
          state &&
          Array.isArray(state.questions) &&
          state.questions.length > 0
        ) {
          const sanitizedQuestions = state.questions.map((q: any) =>
            ensureQuestionSanity(q)
          );
          setQuestions(sanitizedQuestions);
          const newIndex =
            state.currentQuestionIndex >= sanitizedQuestions.length
              ? 0
              : state.currentQuestionIndex;
          setCurrentQuestionIndex(newIndex || 0);
          return;
        }
      } catch (error) {
        console.error("Failed to restore state:", error);
      }
      const initialQuestion = ensureQuestionSanity({
        type: "multiple-choice",
        options: [
          { text: "", image: null },
          { text: "", image: null },
        ],
        correct: 0,
      });
      setQuestions([initialQuestion]);
      setCurrentQuestionIndex(0);
    };
    loadState();
  }, []);

  useEffect(() => {
    if (questions.length === 0) return;
    const handler = setTimeout(async () => {
      try {
        await dbSet({ questions, currentQuestionIndex });
      } catch (error) {
        console.error("Failed to save state to IndexedDB:", error);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [questions, currentQuestionIndex]);

  useEffect(() => {
    // @ts-ignore
    if (window.docx) {
      setIsDocxReady(true);
    } else {
      const interval = setInterval(() => {
        // @ts-ignore
        if (window.docx) {
          setIsDocxReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestionIndex] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const handleAddNewQuestion = (index = -1) => {
    const newQuestion = ensureQuestionSanity({
      type: "multiple-choice",
      options: [
        { text: "", image: null },
        { text: "", image: null },
      ],
      correct: 0,
    });
    const newQuestions = [...questions];
    const insertionIndex = index === -1 ? questions.length : index;
    newQuestions.splice(insertionIndex, 0, newQuestion);
    setQuestions(newQuestions);
    setCurrentQuestionIndex(insertionIndex);
  };

  const handleSaveAndAddNew = () => {
    handleAddNewQuestion(currentQuestionIndex + 1);
  };

  const handleSelectQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert("لا يمكن حذف السؤال الوحيد!");
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف السؤال رقم ${index + 1}؟`)) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
      if (currentQuestionIndex >= index) {
        setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
      }
    }
  };

  const handleDuplicateQuestion = (index: number) => {
    const questionToDuplicate = JSON.parse(JSON.stringify(questions[index]));
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, questionToDuplicate);
    setQuestions(newQuestions);
    setCurrentQuestionIndex(index + 1);
  };

  const handleToggleQuestionSelection = (
    index: number | "all",
    forceValue?: boolean
  ) => {
    setSelectedQuestionIndices((prev) => {
      const newSet = new Set(prev);
      if (index === "all") {
        if (forceValue) {
          displayedQuestions.forEach((q) => newSet.add(q.originalIndex));
        } else {
          newSet.clear();
        }
      } else {
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
      }
      return newSet;
    });
  };

  const handleQuestionDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleQuestionDrop = (targetOriginalIndex: number) => {
    const sourceOriginalIndex = draggedIndex;
    if (
      sourceOriginalIndex === null ||
      sourceOriginalIndex === targetOriginalIndex
    ) {
      setDraggedIndex(null);
      return;
    }
    const newQuestions = moveItem(
      questions,
      sourceOriginalIndex,
      targetOriginalIndex
    );
    let newCurrentIndex = currentQuestionIndex;
    if (currentQuestionIndex === sourceOriginalIndex) {
      newCurrentIndex = targetOriginalIndex;
    } else if (
      sourceOriginalIndex < currentQuestionIndex &&
      targetOriginalIndex >= currentQuestionIndex
    ) {
      newCurrentIndex--;
    } else if (
      sourceOriginalIndex > currentQuestionIndex &&
      targetOriginalIndex <= currentQuestionIndex
    ) {
      newCurrentIndex++;
    }
    setQuestions(newQuestions);
    setCurrentQuestionIndex(newCurrentIndex);
    setDraggedIndex(null);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const readPromises = Array.from(files).map((file) => {
      return new Promise<Question[]>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (!Array.isArray(data)) {
              resolve([]);
              return;
            }
            resolve(data.map((q) => ensureQuestionSanity(q)));
          } catch (err) {
            resolve([]);
          }
        };
        reader.onerror = () => resolve([]);
        reader.readAsText(file as Blob);
      });
    });
    Promise.all(readPromises).then((results) => {
      const allNewQuestions = results.flat();
      if (allNewQuestions.length > 0) {
        setQuestions((prevQuestions) => {
          const isPlaceholder =
            prevQuestions.length === 1 &&
            !stripHtml(prevQuestions[0].question.text) &&
            !prevQuestions[0].question.image;
          const finalQuestions = isPlaceholder
            ? allNewQuestions
            : [...prevQuestions, ...allNewQuestions];
          if (isPlaceholder) setCurrentQuestionIndex(0);
          alert(`تم استيراد ${allNewQuestions.length} سؤال بنجاح.`);
          return finalQuestions;
        });
      } else {
        alert("لم يتم العثور على أسئلة صالحة.");
      }
      if (event.target) event.target.value = "";
    });
  };

  const getQuestionsToExport = () => {
    if (selectedQuestionIndices.size > 0) {
      return questions.filter((_, index) => selectedQuestionIndices.has(index));
    }
    return questions;
  };

  const handleExportJson = () => {
    const questionsToExport = getQuestionsToExport();
    const dataStr = JSON.stringify(questionsToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz_questions.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const executeWordExport = async (options: ExportOptions) => {
    setIsExportModalOpen(false);
    try {
      const questionsToExport = getQuestionsToExport();
      await exportQuestionsToWord(questionsToExport, options);
    } catch (error) {
      console.error("Failed to export to Word:", error);
      alert("حدث خطأ أثناء تصدير ملف Word.");
    }
  };

  const handleOpenExportModal = (mode: "worksheet" | "interactive") => {
    setExportMode(mode);
    setIsWorksheetConfigOpen(true);
  };

  const handleExportConfigConfirm = (config: WorksheetConfig) => {
    setIsWorksheetConfigOpen(false);
    const questionsToExport = getQuestionsToExport();

    let htmlContent = "";
    let fileName = "";

    if (exportMode === "worksheet") {
      htmlContent = generateWorksheetHtml(questionsToExport, config);
      fileName = "worksheet.html";
    } else {
      htmlContent = generateInteractiveQuizHtml(questionsToExport, config);
      fileName = "interactive_quiz.html";
    }

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    if (window.confirm("سيتم مسح جميع الأسئلة الحالية. هل تريد المتابعة؟")) {
      try {
        await dbClear();
        const initialQuestion = ensureQuestionSanity({
          type: "multiple-choice",
          options: [
            { text: "", image: null },
            { text: "", image: null },
          ],
          correct: 0,
        });
        setQuestions([initialQuestion]);
        setCurrentQuestionIndex(0);
        setSelectedQuestionIndices(new Set());
      } catch (error) {
        console.error("Failed to reset state:", error);
      }
    }
  };

  const currentQuestion = questions[currentQuestionIndex] || null;
  const displayedQuestions = useMemo(() => {
    return questions
      .map((q, index) => ({ ...q, originalIndex: index }))
      .filter((item) => {
        const typeMatch = filterType === "all" || item.type === filterType;
        const searchMatch =
          !searchTerm ||
          stripHtml(item.question.text)
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        return typeMatch && searchMatch;
      });
  }, [questions, filterType, searchTerm]);

  return (
    <div className="min-h-screen text-gray-800 p-4 lg:p-6">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center p-6 bg-white rounded-xl shadow-md mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-blue-600">
            محرر الأسئلة التفاعلية المطور الشامل
          </h1>
          <p className="text-gray-600 mt-2">
            أنشئ وحرر أسئلتك التفاعلية ثم صدرها ورقة عمل تفاعلية أو اختبار
            تفاعلي ـ كويز.
          </p>
        </header>
        <div className="flex flex-wrap justify-center gap-3 p-4 bg-white rounded-xl shadow-md mb-6">
          <button
            onClick={handleImport}
            className="flex items-center gap-2 bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow"
          >
            <UploadIcon /> استيراد أسئلة (JSON)
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors shadow"
          >
            <DownloadIcon /> تصدير (JSON)
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors shadow disabled:bg-sky-300 disabled:cursor-not-allowed"
            disabled={!isDocxReady}
            title={
              !isDocxReady
                ? "مكتبة التصدير قيد التحميل..."
                : "تصدير الأسئلة إلى مستند Word"
            }
          >
            <FileTextIcon />{" "}
            {isDocxReady ? "تصدير إلى Word" : "جاري التحميل..."}
          </button>
          <button
            onClick={() => handleOpenExportModal("worksheet")}
            className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow"
            style={{ backgroundColor: "#5b21b6" }}
          >
            <FileTextIcon /> تصدير ورقة عمل
          </button>
          <button
            onClick={() => handleOpenExportModal("interactive")}
            className="flex items-center gap-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors shadow"
          >
            <LaptopIcon /> تصدير كويز تفاعلي
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors shadow"
          >
            <TrashIcon /> مسح كل الأسئلة
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
            multiple
          />
        </div>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {currentQuestion && (
              <EditorPanel
                key={currentQuestionIndex}
                question={currentQuestion}
                onUpdate={handleUpdateQuestion}
                questionNumber={currentQuestionIndex + 1}
                onSaveAndNew={handleSaveAndAddNew}
                onAddNew={() => handleAddNewQuestion(-1)}
                onPreview={setPreviewQuestion}
              />
            )}
            {previewQuestion && (
              <PreviewModal
                question={previewQuestion}
                onClose={() => setPreviewQuestion(null)}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            {questions.length > 0 && (
              <QuestionList
                questions={displayedQuestions}
                currentQuestionIndex={currentQuestionIndex}
                onSelectQuestion={handleSelectQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onDuplicateQuestion={handleDuplicateQuestion}
                onAddNewQuestion={handleAddNewQuestion}
                onDragStart={handleQuestionDragStart}
                selectedQuestionIndices={selectedQuestionIndices}
                onToggleQuestionSelection={handleToggleQuestionSelection}
                onDrop={handleQuestionDrop}
                filterType={filterType}
                onFilterChange={setFilterType}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            )}
          </div>
        </main>
        {isExportModalOpen && (
          <ExportOptionsModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            onConfirm={executeWordExport}
          />
        )}
        {isWorksheetConfigOpen && (
          <WorksheetConfigModal
            isOpen={isWorksheetConfigOpen}
            onClose={() => setIsWorksheetConfigOpen(false)}
            onConfirm={handleExportConfigConfirm}
            isInteractive={exportMode === "interactive"}
          />
        )}
        <footer className="mt-8 text-center p-4 bg-white rounded-lg shadow-sm">
          <a
            href="https://t.me/Interact2030"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
          >
            برمجة و تصميم/ ملتقى التعليم التفاعلي بملتقى معلمي ومعلمات الرياضيات
            ـ المملكة العربية السعودية.
          </a>
          <p className="text-xs text-gray-500 mt-2">
            تمت البرمجة باستخدام{" "}
            <a
              href="https://developers.google.com/studio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Google Studio
            </a>{" "}
            و{" "}
            <a
              href="https://gemini.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Gemini
            </a>{" "}
            بواسطة{" "}
            <a
              href="https://t.me/Interact2030"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline font-semibold"
            >
              ملتقى التعليم التفاعلي
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
