
import { Question, WorksheetConfig } from "../types";

export const generateInteractiveQuizHtml = (questions: Question[], config: WorksheetConfig): string => {
  const questionsJson = JSON.stringify(questions).replace(/<\/script>/gi, "<\\/script>");
  const numeralType = config.numeralType || "eastern";
  const teacherName = config.teacherName || "معلم المادة";
  
  // Fix: Use the specific question time from config, or default to 45 seconds if not set
  const questionTime = config.questionTime ? config.questionTime : 45;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${config.title || "الاختبار التفاعلي"}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;500;700&display=swap" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
  :root { --font-family-base: "Tajawal", "Segoe UI", "Noto Sans Arabic", Tahoma, Geneva, Verdana, sans-serif; --color-primary: #007bff; --color-primary-dark: #0056b3; --color-success: #28a745; --color-danger: #dc3545; --color-warning: #ffc107; --color-light: #f8f9fa; --color-dark: #343a40; --color-text: #212529; --color-bg: #f4f7f6; --border-radius-sm: 8px; --border-radius-md: 12px; --border-radius-lg: 16px; --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05); --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08); }
  * { box-sizing: border-box; font-family: var(--font-family-base); }
  body { background-color: var(--color-bg); min-height: 100vh; margin: 0; padding: 20px; color: var(--color-text); }
  .container { max-width: 900px; margin: 20px auto; opacity: 0; transform: translateY(20px); animation: fadeIn 0.5s ease-out forwards; }
  @keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }
  .header { margin-bottom: 24px; padding: 16px; background: #fff; border-radius: var(--border-radius-lg); box-shadow: var(--shadow-sm); }
  .header-grid { display: grid; grid-template-columns: 140px 1fr; align-items: center; gap: 16px; text-align: unset; }
  .header-logo { display: flex; align-items: center; justify-content: center; }
  .header-logo img { max-width: 100%; height: auto; object-fit: contain; }
  .header-main { text-align: center; }
  .header-main h1 { margin: 0 0 8px 0; color: var(--color-primary); font-size: 1.8em; }
  .header-main p { margin: 0; font-size: 1.1em; color: #555; }
  @media (max-width: 600px) { .header-grid { grid-template-columns: 100px 1fr; gap: 12px; } .header-main h1 { font-size: 1.4em; } }
  .counters { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin: 16px 0; }
  #questionCounter, #timer, #scoreCounter { background: #ffffff; padding: 16px; border-radius: var(--border-radius-md); font-weight: 700; font-size: 1.1em; text-align: center; box-shadow: var(--shadow-sm); color: var(--color-dark); display: flex; align-items: center; justify-content: center; gap: 10px; }
  #questionCounter::before { content: "📌"; } #scoreCounter::before { content: "🏆"; } #timer::before { content: "⏳"; font-size: 1.2em; animation: pulse 2s infinite; }
  @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
  .reading-text { background: #ffffff; color: #333; padding: 20px; border-radius: var(--border-radius-md); margin-bottom: 16px; font-size: 1.15em; line-height: 1.8; box-shadow: var(--shadow-sm); border: 1px solid #e0e0e0; text-align: right; max-height: 250px; overflow-y: auto; }
  .reading-text img, .question img, .reading-text-content img, .question-text img { width: 100%; height: auto; object-fit: contain; max-height: 50vh; border-radius: var(--border-radius-md); margin: 12px 0; display: block; }
  audio { width: 100%; margin: 8px 0; }
  .quiz-box { background: #ffffff; border-radius: var(--border-radius-lg); padding: 24px; box-shadow: var(--shadow-md); color: var(--color-text); position: relative; overflow: hidden; }
  .question { font-size: 1.5em; margin-bottom: 24px; font-weight: 700; line-height: 1.6; text-align: right; }
  .options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; } 
  @media (min-width: 769px) { .options[data-layout="4x1"] { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .option { background: #fff; padding: 16px; border-radius: var(--border-radius-md); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; border: 2px solid #e0e0e0; min-height: 120px; display: flex; align-items: center; justify-content: center; }
  .option:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--color-primary); }
  .option:focus, .option:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; border-color: var(--color-primary); }
  .option.correct { background: #e6f7ec; color: #1d643b; border-color: var(--color-success); font-weight: 700; }
  .option.wrong { background: #fdecea; color: #a52834; border-color: var(--color-danger); font-weight: 700; }
  .option[aria-disabled="true"] { pointer-events: none; opacity: 0.9; }
  .option-content { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
  .option-text { text-align: center; padding: 4px; width: 100%; font-size: 18px; font-weight: 700; color: var(--color-text); display: flex; justify-content: center; align-items: center; flex-direction: column; }
  .option-content img { width: 100%; max-height: 100px; object-fit: contain; border-radius: var(--border-radius-sm); display: block; }
  .fill-in-blank-container, .short-answer-container { display: flex; flex-direction: column; gap: 12px; align-items: center; }
  .fill-in-blank-input { width: 100%; max-width: 400px; padding: 12px; border: 2px solid #ccc; border-radius: var(--border-radius-sm); font-size: 1.1em; text-align: center; transition: border-color 0.2s, box-shadow 0.2s; }
  .fill-in-blank-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25); outline: none; }
  .fill-in-blank-input.correct { background: #e6f7ec; border-color: var(--color-success); }
  .fill-in-blank-input.wrong { background: #fdecea; border-color: var(--color-danger); }
  .short-answer-textarea { width: 100%; max-width: 500px; min-height: 120px; padding: 12px; border: 2px solid #ccc; border-radius: var(--border-radius-sm); font-size: 1.1em; resize: vertical; transition: border-color 0.2s, box-shadow 0.2s; }
  .short-answer-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25); outline: none; }
  .short-answer-textarea.correct { background: #e6f7ec; border-color: var(--color-success); }
  .short-answer-textarea.wrong { background: #fdecea; border-color: var(--color-danger); }
  .correct-answer-display { background-color: #e9f7ef; color: #2b6447; padding: 10px 15px; border-radius: var(--border-radius-sm); font-weight: 600; margin-top: 10px; border: 1px solid #c3e6cb; width: 100%; max-width: 500px; text-align: center; }
  .matching-container { display: flex; flex-wrap: wrap; gap: 20px; justify-content: space-between; margin-bottom: 20px; }
  .matching-column { flex: 1; min-width: 250px; display: flex; flex-direction: column; gap: 10px; }
  .matching-prompt-item { display: flex; align-items: center; gap: 10px; padding: 10px; background-color: var(--color-light); border-radius: var(--border-radius-sm); border: 1px solid #e0e0e0; }
  .prompt-text { flex: 1; font-weight: 600; }
  .drop-zone { flex: 1; min-height: 48px; border: 2px dashed #ccc; border-radius: var(--border-radius-sm); transition: background-color 0.2s; display: flex; align-items: center; justify-content: center; padding: 4px; }
  .drop-zone.over { background-color: #e0e0e0; }
  .drop-zone .answer-item { cursor: default; width: 100%; }
  .answer-item { padding: 12px; background-color: #fff; border: 1px solid #ddd; border-radius: var(--border-radius-sm); cursor: grab; text-align: center; user-select: none; }
  .answer-item .option-content img { max-height: 150px; }
  .answer-item:active { cursor: grabbing; }
  .answer-item.dragging { opacity: 0.5; }
  .drop-zone.correct .answer-item, .answer-item.correct-static { border-color: var(--color-success); background-color: #e6f7ec; }
  .drop-zone.wrong .answer-item, .answer-item.wrong-static { border-color: var(--color-danger); background-color: #fdecea; }
  .ordering-container { display: flex; flex-direction: column; gap: 10px; max-width: 500px; margin: 0 auto 20px auto; border: 2px solid #ccc; padding: 15px; border-radius: var(--border-radius-md); }
  .ordering-item { padding: 15px; background-color: #fff; border: 1px solid #ddd; border-radius: var(--border-radius-sm); cursor: grab; user-select: none; transition: background-color 0.2s, box-shadow 0.2s; display: flex; align-items: center; gap: 10px; }
  .ordering-item::before { content: "☰"; color: #999; font-weight: bold; }
  .ordering-item:active { cursor: grabbing; }
  .ordering-item.dragging { opacity: 0.5; background-color: #e0e0e0; box-shadow: var(--shadow-md); }
  .ordering-container.correct { border-color: var(--color-success); }
  .ordering-container.wrong { border-color: var(--color-danger); }
  .correct-order-display { background-color: #fff3cd; color: #856404; padding: 10px 15px; border-radius: var(--border-radius-sm); margin-top: 15px; border: 1px solid #ffeeba; text-align: right; }
  .correct-order-display ol { padding-right: 20px; margin: 5px 0; }
  .connecting-lines-container { position: relative; display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
  .connecting-lines-column { flex: 1; display: flex; flex-direction: column; gap: 15px; z-index: 2; }
  .connect-item { padding: 12px; border: 2px solid #ccc; border-radius: var(--border-radius-md); cursor: pointer; transition: border-color 0.2s, background-color 0.2s; background-color: #fff; display: flex; align-items: center; min-height: 60px; }
  .connect-item.selected { border-color: var(--color-primary); background-color: #e7f1ff; box-shadow: 0 0 8px rgba(0, 123, 255, 0.5); }
  .connect-item .option-content { flex-direction: row; justify-content: flex-start; gap: 10px; pointer-events: none; }
  .connect-item[data-connected="true"] { background-color: #f0f0f0; cursor: not-allowed; }
  #connectingLinesCanvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
  .connect-item.connect-correct { background-color: #e6f7ec; border-color: var(--color-success); }
  .connect-item.connect-wrong { background-color: #fdecea; border-color: var(--color-danger); }
  .classification-container { display: flex; flex-direction: column; gap: 20px; }
  .classification-groups { display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; margin-bottom: 20px; }
  .group-box { flex: 1; min-width: 200px; background-color: #f8f9fa; border: 2px solid var(--color-primary-dark); border-radius: var(--border-radius-md); padding: 10px; display: flex; flex-direction: column; }
  .group-header { background-color: var(--color-primary-dark); color: white; padding: 8px; text-align: center; border-radius: 8px 8px 0 0; font-weight: bold; margin: -10px -10px 10px -10px; }
  .group-drop-zone { min-height: 100px; background-color: #fff; border: 2px dashed #ccc; border-radius: var(--border-radius-sm); padding: 8px; display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; transition: background-color 0.2s; }
  .group-drop-zone.over { background-color: #e3f2fd; border-color: #2196f3; }
  .classification-items { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; padding: 15px; background-color: #f1f1f1; border-radius: var(--border-radius-md); border: 1px solid #ddd; min-height: 60px; }
  .class-item { padding: 8px 15px; background-color: #fff; border: 1px solid #999; border-radius: 20px; cursor: grab; user-select: none; box-shadow: var(--shadow-sm); font-weight: 500; display: flex; align-items: center; gap: 5px; }
  .class-item img { max-height: 40px; margin: 0; }
  .class-item.dragging { opacity: 0.5; }
  .class-item.correct { background-color: #d4edda; border-color: var(--color-success); color: #155724; }
  .class-item.wrong { background-color: #f8d7da; border-color: var(--color-danger); color: #721c24; }
  .controls { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 24px; }
  .nav-btn, .action-btn, .restart-btn { border: none; padding: 12px 28px; border-radius: var(--border-radius-sm); cursor: pointer; font-size: 1.05em; font-weight: 600; transition: transform 0.2s ease, filter 0.2s ease; }
  .nav-btn:hover, .action-btn:hover, .restart-btn:hover { transform: translateY(-2px); filter: brightness(95%); }
  .nav-btn:focus, .action-btn:focus, .restart-btn:focus { outline: 3px solid var(--color-primary-dark); outline-offset: 2px; }
  .nav-btn:disabled { background: #adb5bd; cursor: not-allowed; transform: none; filter: none; }
  .nav-btn, .restart-btn { background: var(--color-primary); color: #fff; }
  .pause-btn { background: var(--color-warning); color: #000; }
  .custom-submit-container { width: 100%; text-align: center; margin-top: 20px; }
  .progress-bar { height: 10px; background: #e9ecef; border-radius: 5px; margin: 20px 0 10px 0; overflow: hidden; }
  .progress { height: 100%; background: var(--color-success); width: 0; transition: width 0.3s ease; border-radius: 5px; }
  .score-board { text-align: center; font-size: 1.5em; display: none; background: #fff; padding: 32px; border-radius: var(--border-radius-lg); box-shadow: var(--shadow-md); }
  .score-board h2 { margin-top: 0; }
  .no-certificate-message { background: #fff3cd; color: #856404; padding: 16px; border-radius: var(--border-radius-md); margin: 24px 0; border: 1px solid #ffeaa7; }
  .certificate-buttons { display: flex; flex-direction: column; align-items: center; gap: 15px; margin-top: 25px; }
  .certificate-btn { background: var(--color-success); color: white; border: none; padding: 12px 25px; border-radius: var(--border-radius-sm); cursor: pointer; font-size: 1.1em; font-weight: 600; transition: all 0.2s ease; }
  .certificate-btn:hover { filter: brightness(90%); transform: translateY(-2px); }
  .certificate-btn.print { background: var(--color-primary); }
  .certificate-btn.close { background: var(--color-secondary); }
  .certificate-container { display: none; max-width: 800px; margin: 20px auto; background: #ffffff; border: 10px solid var(--color-primary); border-radius: var(--border-radius-lg); padding: 30px; box-shadow: var(--shadow-md); position: relative; text-align: center; }
  .certificate-seal { position: absolute; left: 30px; bottom: 50px; max-width: 120px; max-height: 120px; opacity: 0.9; object-fit: contain; z-index: 10; }
  .certificate-header { display: flex; flex-direction: column; align-items: center; gap: 15px; margin-bottom: 10px; }
  .certificate-logo { max-width: 100px; }
  .certificate-quiz-title { color: var(--color-dark); font-size: 1.5em; font-weight: 500; margin: 0; }
  .certificate-title { color: var(--color-primary); font-size: 2.8em; font-weight: bold; margin: 15px 0 20px 0; }
  .certificate-body { margin: 30px 0; padding: 20px; border: 2px dashed var(--color-primary); border-radius: var(--border-radius-md); background: var(--color-light); }
  .student-name { font-size: 2em; color: var(--color-primary-dark); margin: 20px 0; font-weight: bold; }
  .achievement-text { font-size: 1.3em; color: var(--color-text); margin: 15px 0; }
  .score-text { font-size: 1.4em; color: var(--color-success); font-weight: bold; }
  .teacher-name { font-size: 1.3em; color: var(--color-primary-dark); margin-top: 30px; }
  .certificate-footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; }
  .config-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 24px; border-radius: var(--border-radius-lg); box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2); display: none; color: var(--color-text); z-index: 9999; width: 92%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
  .config-panel h3 { margin-top: 0; color: var(--color-primary); }
  .form-group { margin-top: 16px; }
  .form-control { width: 100%; padding: 12px; border-radius: var(--border-radius-sm); border: 1px solid #ccc; resize: vertical; font-size: 1em; }
  .form-group label { display: block; margin-bottom: 6px; font-weight: 600; }
  .feedback-box { margin-top: 20px; padding: 15px; border-radius: var(--border-radius-md); font-size: 1.05em; line-height: 1.7; border: 1px solid; animation: fadeIn 0.5s ease-out; }
  .feedback-box.correct { background-color: #e6f7ec; border-color: var(--color-success); color: #1d643b; }
  .feedback-box.wrong { background-color: #fff3cd; border-color: var(--color-warning); color: #856404; }
  footer { position: relative; max-width: 900px; margin: 20px auto; text-align: center; padding: 16px; background: #ffffff; color: var(--color-secondary); direction: rtl; border-radius: var(--border-radius-md); box-shadow: var(--shadow-sm); font-size: 0.9em; }
  #quizFooter a.footer-link-wrap, #teacherFooter a.footer-link-wrap { display: block; color: inherit; text-decoration: none; }
  #quizFooter a.footer-link-wrap:hover, #teacherFooter a.footer-link-wrap:hover { text-decoration: underline; color: var(--color-primary); }
  @media (max-width: 768px) { body { padding: 10px; } .container { margin: 10px auto; } .options { grid-template-columns: 1fr; } .option { min-height: 100px; padding: 12px; } .question { font-size: 1.3em; } .counters { flex-direction: row; flex-wrap: wrap; justify-content: center; } }
  @media print { body > *:not(.certificate-container-print-wrapper) { display: none !important; } .certificate-container-print-wrapper { display: block !important; width: 100% !important; height: 100% !important; position: absolute; top: 0; left: 0; } .certificate-container-print-wrapper .certificate-container { display: block !important; margin: 0 auto !important; padding: 20px !important; border: 10px solid var(--color-primary) !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; position: relative !important; left: 0 !important; top: 0 !important; transform: none !important; box-sizing: border-box !important; } .certificate-container-print-wrapper .certificate-seal { position: absolute !important; left: 30px !important; bottom: 50px !important; z-index: 10 !important; } .certificate-container .certificate-buttons { display: none !important; } body { background: white !important; margin: 0 !important; padding: 0 !important; } }
</style>
</head>
<body>
<div id="welcomeScreen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 95vh; text-align: center; padding: 20px;">
    <div style="flex-grow: 1;"></div>
    <div>
        ${config.logo ? `<div class="header-logo"><img src="${config.logo}" alt="${config.logoAlt}" style="max-width: 150px; max-height: 150px; border-radius: var(--border-radius-md); margin-bottom: 20px;" /></div>` : ""}
        <h1 style="font-size: 2.2em; color: #007bff; margin-bottom: 25px;">${config.title || "الاختبار التفاعلي"}</h1>
        <button onclick="startQuiz()" style="background-color: #007bff; color: white; border: none; padding: 15px 30px; font-size: 1.2em; border-radius: 8px; cursor: pointer; transition: background-color 0.2s, transform 0.2s; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0)';">بسم الله نبدأ</button>
    </div>
    <div style="width: 100%; max-width: 900px; margin: 20px auto 0; flex-grow: 1; display: flex; flex-direction: column; justify-content: flex-end;">
        ${config.footer ? `<footer id="teacherFooter">${config.footer}</footer>` : ""}
        <footer id="quizFooter"><a href="https://t.me/Interact2030" target="_blank" rel="noopener noreferrer" class="footer-link-wrap">برمجة و تصميم/ ملتقى التعليم التفاعلي بملتقى معلمي ومعلمات الرياضيات ـ المملكة العربية السعودية</a></footer>
    </div>
</div>

<div id="quizContainer" style="display: none;">
    <div class="container">
     <div class="header header-grid">
      <div class="header-logo"> <img id="quizLogo" alt="${config.logoAlt}" src="${config.logo || ""}" style="${config.logo ? "display:block;" : "display:none;"} max-width:100%; height:auto;" /> </div>
      <div class="header-main"> <h1 id="quizTitle">${config.title}</h1> <p id="instructions">${config.instructions}</p> </div>
     </div>
     <div class="counters" id="countersBox">
      <div id="questionCounter" class="counter-chip"></div>
      <div id="timer" class="counter-chip"></div>
      <div id="scoreCounter" class="counter-chip"></div>
     </div>
     <div class="reading-text" id="readingText" style="display:none"></div>
     <div class="quiz-box">
      <div class="question" id="question"></div>
      <div class="options" id="options"></div>
      <div class="controls">
        <button class="nav-btn" id="prevBtn" onclick="previousQuestion()" disabled>السابق</button>
        <button class="nav-btn pause-btn" id="pauseBtn" onclick="togglePause()">إيقاف مؤقت</button>
        <button class="nav-btn" id="nextBtn" onclick="nextQuestion()">التالي</button>
      </div>
      <div class="progress-bar"><div class="progress" id="progress"></div></div>
     </div>
     <div class="score-board" id="scoreBoard" style="display:none;">
      <h2> نتيجتك النهائية: <span id="finalScore">٠</span>/<span id="totalQuestions">٠</span> </h2>
      <div class="no-certificate-message" id="noCertificateMsg" style="display: none"> <p>للحصول على شهادة الإنجاز، يجب تحقيق 80% على الأقل من الدرجة الكلية</p> <p>حاول مرة أخرى للوصول إلى هذا المستوى!</p> </div>
      <div class="certificate-buttons"> <button class="certificate-btn" id="certificateBtn" onclick="openCertificateForm()" style="display: none"> 🏆 الحصول على شهادة الإنجاز </button> <button class="restart-btn" onclick="restartQuiz()"> إعادة المحاولة </button> </div>
     </div>
    </div>
    <footer style="text-align: center; padding: 15px; font-size: 0.9em; color: #555">
      <p>تمت البرمجة باستخدام <a href="https://developers.google.com/studio" target="_blank" rel="noopener noreferrer" style="color: #0056b3; text-decoration: none">Google Studio</a> و <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer" style="color: #0056b3; text-decoration: none">Gemini</a> بواسطة <a href="https://t.me/Interact2030" target="_blank" rel="noopener noreferrer" style="color: #0056b3; text-decoration: none; font-weight: bold">ملتقى التعليم التفاعلي</a></p>
    </footer>
    ${config.footer ? `<div style="display:none" id="hiddenTeacherFooter">${config.footer}</div>` : ""}
    
    <div class="config-panel" id="certificateForm" style="text-align: right; display: none">
      <h3 style="text-align: center;">بيانات الشهادة</h3>
      <div class="form-group"> <label for="studentNameInput">اسم الطالب:</label> <input class="form-control" id="studentNameInput" type="text" placeholder="أدخل اسم الطالب" /> </div>
      <div class="form-group" style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap"> <button class="certificate-btn" onclick="generateCertificate()" style="background: #28a745"> إنشاء الشهادة </button> <button class="certificate-btn" onclick="closeCertificateForm()" style="background: #6c757d;">إلغاء</button> </div>
    </div>
    
    <div class="certificate-container" id="certificateContainer">
      <div class="certificate-header"> <img id="certificateLogo" src="${config.logo || ""}" alt="شعار" class="certificate-logo" style="max-width: 120px; max-height: 100px; object-fit: contain; ${config.logo ? "display:block;" : "display:none;"}" /> <h2 class="certificate-quiz-title" id="certificateQuizTitle"> ${config.title} </h2> </div>
      <h1 class="certificate-title">شهادة إنجاز</h1>
      <div class="certificate-body">
        <div class="student-name" id="certificateStudentName">اسم الطالب</div>
        <div class="achievement-text"> تهانينا! لقد أتممت الاختبار التفاعلي بنجاح </div>
        <div class="score-text" id="certificateScoreText"> حققت نتيجة 20 من 25 </div>
        <div class="achievement-text"> نظير جهودك المتميزة وإصرارك على التعلّم، نقدم لك هذه الشهادة تقديرًا لإنجازك البارع </div>
        <div class="teacher-name" id="certificateTeacherName"> المعلم: ${teacherName} </div>
      </div>
      <div class="certificate-footer"> <p>شهادة معتمدة من نظام الاختبارات التفاعلية</p> </div>
      <img id="certificateSeal" src="${config.seal || ""}" alt="ختم" class="certificate-seal" style="${config.seal ? "display:block;" : "display:none;"}" />
      <div class="certificate-buttons"> <button class="certificate-btn print" onclick="printCertificate()"> 🖨️ طباعة الشهادة </button> <button class="certificate-btn" onclick="downloadCertificate()"> 📥 حفظ كصورة </button> <button class="certificate-btn close" onclick="closeCertificate()"> ✕ إغلاق </button> </div>
    </div>
</div>

<script>
const STORAGE_KEY = "quiz_student_progress_${Date.now()}";
const EASTERN = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const state = { questions: ${questionsJson}, currentQuestion: 0, score: 0, questionTime: ${questionTime}, timeLeft: ${questionTime}, timerId: null, isPaused: false, answeredQuestions: [], lastWrong: [], shuffledMaps: [], optionsLayout: "2x2", numeralType: "${numeralType}" };
let draggedItem = null, orderingDraggedItem = null;
let connectState = { from: null, connections: [], canvas: null, observer: null };

const startQuizFunction = function() {
    const welcome = document.getElementById('welcomeScreen');
    const quiz = document.getElementById('quizContainer');
    if (welcome) welcome.style.display = 'none';
    if (quiz) quiz.style.display = 'block';
    
    // FIX: Ensure internal elements are visible (important for restart)
    const quizBox = document.querySelector('.quiz-box');
    const countersBox = document.getElementById('countersBox');
    if(quizBox) quizBox.style.display = 'block';
    if(countersBox) countersBox.style.display = 'flex';

    // Initialize Arrays
    if (!state.answeredQuestions || state.answeredQuestions.length !== state.questions.length) {
        state.answeredQuestions = new Array(state.questions.length).fill(null);
    }
    if (!state.lastWrong || state.lastWrong.length !== state.questions.length) {
        state.lastWrong = new Array(state.questions.length).fill(null);
    }

    if (state.questions.length > 0) {
        if (state.currentQuestion >= state.questions.length) state.currentQuestion = 0;
        showQuestion(); 
    } else { 
        updateQuestionCounter(); 
        updateScoreCounter(); 
        updateTimerDisplay(); 
    } 
};

// Bind startQuiz globally
window.startQuiz = startQuizFunction;

function formatNumber(n) {
  const num = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat(state.numeralType === "eastern" ? "ar-EG" : "en-US").format(num);
  } catch {
    return String(num);
  }
};

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

function formatQuizContent(html) {
  if (!html || typeof html !== "string") return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = DOMPurify.sanitize(html);
  
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = convertNumeralsInText(node.nodeValue);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i]);
    }
  }
  walk(tempDiv);
  return tempDiv.innerHTML;
};

function convertNumeralsInText(text) {
  if (!text || typeof text !== "string") return text;
  return state.numeralType === "eastern"
    ? text.replace(/\\d/g, (d) => EASTERN[d])
    : text.replace(/[٠-٩]/g, (d) => EASTERN.indexOf(d));
};

function updateTimerDisplay() {
  const el = document.getElementById("timer");
  if(el) el.textContent = "الوقت المتبقي: " + formatNumber(state.timeLeft) + " ثانية";
};

function updateQuestionCounter() {
  const total = state.questions.length;
  const current = total > 0 ? state.currentQuestion + 1 : 0;
  const el = document.getElementById("questionCounter");
  if(el) el.textContent = "السؤال " + formatNumber(current) + " من " + formatNumber(total);
};

function updateScoreCounter() {
  const total = state.questions.length;
  const el = document.getElementById("scoreCounter");
  if(el) el.textContent = "النتيجة: " + formatNumber(state.score) + " من " + formatNumber(total);
};

function startTimer() {
  clearInterval(state.timerId);
  if (!Array.isArray(state.questions) || state.questions.length === 0) {
    state.timeLeft = 0;
    updateTimerDisplay();
    return;
  }
  
  state.timerId = setInterval(() => {
    if (state.isPaused) return; 
    
    if (state.timeLeft > 0) {
        state.timeLeft--;
        updateTimerDisplay();
    }
    
    if (state.timeLeft <= 0) {
      clearInterval(state.timerId);
      nextQuestion();
    }
  }, 1000);
};

function togglePause() {
  if (!Array.isArray(state.questions) || state.questions.length === 0) return;
  const b = document.getElementById("pauseBtn");
  if (!state.isPaused) {
    state.isPaused = true;
    if (b) {
      b.textContent = "استئناف";
      b.style.background = "#28a745";
      b.style.color = "#fff";
    }
    return;
  }
  state.isPaused = false;
  if (b) {
    b.textContent = "إيقاف مؤقت";
    b.style.background = "#ffc107";
    b.style.color = "#000";
  }
};

function showQuestion() {
  clearInterval(state.timerId);
  state.isPaused = false;
  const pauseBtn = document.getElementById("pauseBtn");
  if(pauseBtn) { pauseBtn.textContent = "إيقاف مؤقت"; pauseBtn.style.background = "#ffc107"; pauseBtn.style.color = "#000"; }

  state.timerId = null;
  state.timeLeft = state.questionTime; // Reset time per question based on config

  if (connectState.observer) {
    connectState.observer.disconnect();
    connectState.observer = null;
  }
  
  // Clean up feedback box if exists
  const existingFeedbackBox = document.querySelector(".feedback-box");
  if (existingFeedbackBox) existingFeedbackBox.remove();

  const readingTextElement = document.getElementById("readingText");
  const questionElement = document.getElementById("question");
  const optionsElement = document.getElementById("options");
  const controls = document.querySelector(".quiz-box .controls");

  const q = state.questions[state.currentQuestion];
  const wasAnswered = state.answeredQuestions[state.currentQuestion] !== null;

  if (wasAnswered && q.feedback && q.feedback.trim() !== "") {
    const isCorrect = state.answeredQuestions[state.currentQuestion];
    const feedbackBox = document.createElement("div");
    feedbackBox.className = "feedback-box";
    feedbackBox.classList.add(isCorrect ? "correct" : "wrong");
    feedbackBox.innerHTML = formatQuizContent(q.feedback);
    document.querySelector(".quiz-box").insertBefore(feedbackBox, document.querySelector(".quiz-box .controls"));
  }

  if (state.currentQuestion >= state.questions.length) {
    showResult();
    return;
  }

  if(readingTextElement) readingTextElement.innerHTML = "";
  if (q.reading && (q.reading.text || q.reading.image || q.reading.audio)) {
    if(readingTextElement) readingTextElement.style.display = "block";
    if (q.reading.text) {
      const d = document.createElement("div");
      d.className = "reading-text-content";
      d.innerHTML = formatQuizContent(q.reading.text);
      readingTextElement.appendChild(d);
    }
    if (q.reading.audio) {
      const aud = document.createElement("audio");
      aud.controls = true;
      aud.preload = "none";
      aud.src = q.reading.audio;
      readingTextElement.appendChild(aud);
    }
    if (q.reading.image) {
      const img = document.createElement("img");
      img.src = q.reading.image;
      img.className = "reading-text-image";
      readingTextElement.appendChild(img);
    }
  } else {
    if(readingTextElement) readingTextElement.style.display = "none";
  }

  if(questionElement) questionElement.innerHTML = "";
  const questionContent = document.createElement("div");
  questionContent.className = "question-content";
  if (q.question?.text) {
    const d = document.createElement("div");
    d.className = "question-text";
    d.innerHTML = formatQuizContent(q.question.text);
    questionContent.appendChild(d);
  }
  if (q.question?.image) {
    const i = document.createElement("img");
    i.src = q.question.image;
    i.className = "question-image";
    questionContent.appendChild(i);
  }
  if(questionElement) questionElement.appendChild(questionContent);

  if(optionsElement) {
      optionsElement.innerHTML = "";
      optionsElement.className = "";
  }
  
  if (q.type === "multiple-choice") {
    optionsElement.className = "options";
    let map = state.shuffledMaps[state.currentQuestion];
    if (!map) {
        map = (q.options || []).map((_, i) => i);
        for (let i = map.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [map[i], map[j]] = [map[j], map[i]];
        }
        state.shuffledMaps[state.currentQuestion] = map;
    }
    
    if (q.options.length === 4) optionsElement.dataset.layout = state.optionsLayout || "2x2";

    map.forEach((origIdx) => {
      const opt = q.options[origIdx];
      if (!opt || (!opt.text && !opt.image)) return;
      const wrap = document.createElement("div");
      wrap.className = "option";
      const content = document.createElement("div");
      content.className = "option-content";
      if (opt.image) {
        const img = document.createElement("img");
        img.src = opt.image;
        content.appendChild(img);
      }
      if (opt.text) {
        const span = document.createElement("span");
        span.className = "option-text";
        span.innerHTML = formatQuizContent(opt.text);
        content.appendChild(span);
      }
      wrap.appendChild(content);
      
      if (wasAnswered) {
        wrap.setAttribute("aria-disabled", "true");
        if (origIdx === q.correct) wrap.classList.add("correct");
        if (state.answeredQuestions[state.currentQuestion] === false && state.lastWrong[state.currentQuestion] === origIdx) {
          wrap.classList.add("wrong");
        }
      } else {
        wrap.onclick = () => checkAnswer(origIdx);
      }
      optionsElement.appendChild(wrap);
    });
  } else if (q.type === "true-false") {
    optionsElement.className = "options options-two";
    const trueBtn = document.createElement("div");
    trueBtn.className = "option";
    trueBtn.textContent = "صح";
    const falseBtn = document.createElement("div");
    falseBtn.className = "option";
    falseBtn.textContent = "خطأ";
    
    if (wasAnswered) {
        trueBtn.setAttribute("aria-disabled", "true");
        falseBtn.setAttribute("aria-disabled", "true");
        if (q.correctAnswer === true) trueBtn.classList.add("correct");
        if (q.correctAnswer === false) falseBtn.classList.add("correct");
        if (!state.answeredQuestions[state.currentQuestion]) {
             if (state.lastWrong[state.currentQuestion] === true) trueBtn.classList.add("wrong");
             if (state.lastWrong[state.currentQuestion] === false) falseBtn.classList.add("wrong");
        }
    } else {
        trueBtn.onclick = () => checkAnswer(true);
        falseBtn.onclick = () => checkAnswer(false);
    }
    optionsElement.appendChild(trueBtn);
    optionsElement.appendChild(falseBtn);
  } else if (q.type === "fill-in-the-blank") {
    const container = document.createElement("form");
    container.className = "fill-in-blank-container";
    container.onsubmit = (e) => { e.preventDefault(); checkAnswer(input.value); };
    const input = document.createElement("input");
    input.type = "text";
    input.className = "fill-in-blank-input";
    input.placeholder = "اكتب إجابتك هنا";
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit"; submitBtn.textContent = "تأكيد الإجابة"; submitBtn.className = "nav-btn";
    container.appendChild(input); container.appendChild(submitBtn);
    optionsElement.appendChild(container);
    
    if (wasAnswered) {
      input.value = state.lastWrong[state.currentQuestion] || "";
      input.disabled = true;
      submitBtn.style.display = "none";
      input.classList.add(state.answeredQuestions[state.currentQuestion] ? "correct" : "wrong");
      if (!state.answeredQuestions[state.currentQuestion]) {
        const ca = document.createElement("div"); ca.className = "correct-answer-display";
        ca.textContent = "الإجابة الصحيحة: " + q.correctAnswer.split("|")[0];
        container.appendChild(ca);
      }
    }
  } else if (q.type === "short-answer") {
    const container = document.createElement("form");
    container.className = "short-answer-container";
    container.onsubmit = (e) => { e.preventDefault(); checkAnswer(textarea.value); };
    const textarea = document.createElement("textarea");
    textarea.className = "short-answer-textarea";
    textarea.placeholder = "اكتب إجابتك هنا...";
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit"; submitBtn.textContent = "تأكيد الإجابة"; submitBtn.className = "nav-btn";
    container.appendChild(textarea); container.appendChild(submitBtn);
    optionsElement.appendChild(container);
    
    if (wasAnswered) {
      textarea.value = state.lastWrong[state.currentQuestion] || "";
      textarea.disabled = true;
      submitBtn.style.display = "none";
      textarea.classList.add(state.answeredQuestions[state.currentQuestion] ? "correct" : "wrong");
      if (!state.answeredQuestions[state.currentQuestion]) {
        const ca = document.createElement("div"); ca.className = "correct-answer-display";
        ca.textContent = "إحدى الإجابات النموذجية: " + q.correctAnswer.split("|")[0];
        container.appendChild(ca);
      }
    }
  } else if (q.type === "classification") {
    optionsElement.className = "classification-container";
    const groupsContainer = document.createElement("div");
    groupsContainer.className = "classification-groups";
    (q.groups || []).forEach((group) => {
      const groupBox = document.createElement("div");
      groupBox.className = "group-box";
      const groupHeader = document.createElement("div");
      groupHeader.className = "group-header";
      groupHeader.innerHTML = formatQuizContent(group.text);
      const dropZone = document.createElement("div");
      dropZone.className = "group-drop-zone";
      dropZone.dataset.groupId = group.id;
      groupBox.append(groupHeader, dropZone);
      groupsContainer.appendChild(groupBox);
    });
    
    const itemsPool = document.createElement("div");
    itemsPool.className = "classification-items";
    const items = [...(q.items || [])].sort(() => Math.random() - 0.5);
    items.forEach((item) => {
      const itemEl = document.createElement("div");
      itemEl.className = "class-item";
      itemEl.draggable = !wasAnswered;
      itemEl.dataset.groupId = item.groupId;
      if (item.image) { const img = document.createElement("img"); img.src = item.image; itemEl.appendChild(img); }
      if (item.text) { const span = document.createElement("span"); span.innerHTML = formatQuizContent(item.text); itemEl.appendChild(span); }
      itemsPool.appendChild(itemEl);
    });
    
    optionsElement.append(groupsContainer, itemsPool);
    
    if (wasAnswered) {
        checkAnswer(null, true); // Re-run logic to apply classes
    } else {
        const btnContainer = document.createElement("div");
        btnContainer.className = "custom-submit-container";
        const submitBtn = document.createElement("button");
        submitBtn.textContent = "تأكيد الإجابة";
        submitBtn.className = "nav-btn";
        submitBtn.onclick = () => checkAnswer(null);
        btnContainer.appendChild(submitBtn);
        optionsElement.appendChild(btnContainer);
        attachClassificationDragDrop();
    }
  } else if (q.type === "matching") {
    // FIX: Using q.pairs instead of prompts/answers logic
    const container = document.createElement("div"); container.className = "matching-container";
    const promptsColumn = document.createElement("div"); promptsColumn.className = "matching-column";
    const answersColumn = document.createElement("div"); answersColumn.className = "matching-column";
    
    (q.pairs || []).forEach((pair, index) => {
        const item = document.createElement("div"); item.className = "matching-prompt-item";
        const text = document.createElement("div"); text.className = "prompt-text";
        if(pair.prompt.image) { const img = document.createElement("img"); img.src=pair.prompt.image; text.appendChild(img); }
        if(pair.prompt.text) { const sp = document.createElement("span"); sp.innerHTML=formatQuizContent(pair.prompt.text); text.appendChild(sp); }
        item.appendChild(text);
        const drop = document.createElement("div"); drop.className = "drop-zone"; drop.dataset.index = index;
        item.appendChild(drop);
        promptsColumn.appendChild(item);
        
        if (!wasAnswered) {
            drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
            drop.addEventListener("dragleave", () => drop.classList.remove("over"));
            drop.addEventListener("drop", (e) => {
                e.preventDefault(); drop.classList.remove("over");
                if (draggedItem && (drop.children.length === 0 || e.target === drop)) {
                    if (drop.firstChild) answersColumn.appendChild(drop.firstChild);
                    drop.appendChild(draggedItem);
                    draggedItem = null;
                }
            });
        }
    });
    
    const shuffledAnswers = (q.pairs || []).map((p, i) => ({c: p.answer, idx: i})).sort(() => Math.random() - 0.5);
    shuffledAnswers.forEach((ans) => {
        const item = document.createElement("div"); item.className = "answer-item"; item.draggable = !wasAnswered;
        item.dataset.originalIndex = ans.idx;
        const div = document.createElement("div"); div.className="option-content";
        if(ans.c.image) { const img = document.createElement("img"); img.src=ans.c.image; div.appendChild(img); }
        if(ans.c.text) { const sp = document.createElement("span"); sp.innerHTML=formatQuizContent(ans.c.text); div.appendChild(sp); }
        item.appendChild(div);
        answersColumn.appendChild(item);
        if(!wasAnswered) {
            item.addEventListener("dragstart", () => { draggedItem = item; setTimeout(() => item.classList.add("dragging"), 0); });
            item.addEventListener("dragend", () => item.classList.remove("dragging"));
        }
    });
    
    container.appendChild(promptsColumn); container.appendChild(answersColumn);
    optionsElement.appendChild(container);
    
    if(!wasAnswered) {
        const btnContainer = document.createElement("div"); 
        btnContainer.className = "custom-submit-container";
        const submitBtn = document.createElement("button"); submitBtn.textContent = "تأكيد الإجابة"; submitBtn.className = "nav-btn"; submitBtn.onclick = () => checkAnswer(null);
        btnContainer.appendChild(submitBtn); optionsElement.appendChild(btnContainer);
    } else {
        promptsColumn.querySelectorAll(".drop-zone").forEach((dz) => {
            const pIdx = parseInt(dz.dataset.index);
            const userAnsIdx = state.lastWrong[state.currentQuestion][pIdx];
            if(userAnsIdx !== null && userAnsIdx !== undefined) {
                const ansContent = q.pairs[userAnsIdx].answer;
                const item = document.createElement("div"); item.className = "answer-item";
                const div = document.createElement("div"); div.className="option-content";
                if(ansContent.image) { const img = document.createElement("img"); img.src=ansContent.image; div.appendChild(img); }
                if(ansContent.text) { const sp = document.createElement("span"); sp.innerHTML=formatQuizContent(ansContent.text); div.appendChild(sp); }
                item.appendChild(div);
                dz.appendChild(item);
                
                if (userAnsIdx === pIdx) dz.classList.add("correct"); else dz.classList.add("wrong");
            } else {
                dz.classList.add("wrong");
            }
        });
        answersColumn.style.display = "none";
    }
  } else if (q.type === "ordering") {
      const container = document.createElement("div"); container.className = "ordering-container";
      let itemsToRender = [];
      
      if(wasAnswered) {
          const userOrder = state.lastWrong[state.currentQuestion];
          itemsToRender = userOrder.map(idx => ({ item: q.items[idx], originalIndex: idx }));
      } else {
          itemsToRender = (q.items || []).map((item, index) => ({ item, originalIndex: index })).sort(() => Math.random() - 0.5);
      }
      
      itemsToRender.forEach(({item, originalIndex}) => {
          const el = document.createElement("div"); el.className = "ordering-item";
          el.draggable = !wasAnswered; el.dataset.originalIndex = originalIndex;
          if(item.image) { const img = document.createElement("img"); img.src = item.image; el.appendChild(img); }
          if(item.text) { const s = document.createElement("span"); s.innerHTML = formatQuizContent(item.text); el.appendChild(s); }
          container.appendChild(el);
      });
      
      if(!wasAnswered) {
          const items = container.querySelectorAll(".ordering-item");
          items.forEach(item => {
              item.addEventListener("dragstart", () => { orderingDraggedItem = item; setTimeout(() => item.classList.add("dragging"), 0); });
              item.addEventListener("dragend", () => item.classList.remove("dragging"));
          });
          container.addEventListener("dragover", (e) => {
              e.preventDefault();
              const afterElement = getDragAfterElement(container, e.clientY);
              if (afterElement == null) container.appendChild(orderingDraggedItem);
              else container.insertBefore(orderingDraggedItem, afterElement);
          });
          
          optionsElement.appendChild(container);
          const btnContainer = document.createElement("div"); 
          btnContainer.className = "custom-submit-container";
          const submitBtn = document.createElement("button"); submitBtn.textContent = "تأكيد الإجابة"; submitBtn.className = "nav-btn"; submitBtn.onclick = () => checkAnswer(null);
          btnContainer.appendChild(submitBtn); optionsElement.appendChild(btnContainer);
      } else {
          optionsElement.appendChild(container);
          if (state.answeredQuestions[state.currentQuestion]) container.classList.add("correct");
          else {
              container.classList.add("wrong");
              const display = document.createElement("div"); display.className = "correct-order-display";
              let html = "<strong>الترتيب الصحيح:</strong><ol>";
              q.items.forEach(it => {
                  html += "<li>";
                  if(it.image) html += "<img src='"+it.image+"' style='max-height:30px;vertical-align:middle'> ";
                  html += (it.text || "") + "</li>";
              });
              html += "</ol>";
              display.innerHTML = html;
              optionsElement.appendChild(display);
          }
      }
  } else if (q.type === "connecting-lines") {
      renderConnectingLines(q, optionsElement);
  }

  const progressEl = document.getElementById("progress");
  if (progressEl) {
    const total = state.questions.length;
    const pct = total > 0 ? (state.currentQuestion / total) * 100 : 0;
    progressEl.style.width = pct + "%";
  }

  // FIX: Null check for buttons
  const prevBtn = document.getElementById("prevBtn");
  if (prevBtn) prevBtn.disabled = state.currentQuestion === 0;
  
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.disabled = false;

  updateQuestionCounter();
  updateScoreCounter();
  updateTimerDisplay();
  startTimer();
}

function nextQuestion() {
  if (state.currentQuestion < state.questions.length - 1) {
    state.currentQuestion++;
    showQuestion();
  } else {
    showResult();
  }
}

function previousQuestion() {
  if (state.currentQuestion > 0) {
    state.currentQuestion--;
    showQuestion();
  }
}

function showResult() {
  clearInterval(state.timerId);
  document.querySelector(".quiz-box").style.display = "none";
  document.getElementById("readingText").style.display = "none";
  document.getElementById("countersBox").style.display = "none";
  document.getElementById("scoreBoard").style.display = "block";
  document.getElementById("finalScore").textContent = formatNumber(state.score);
  document.getElementById("totalQuestions").textContent = formatNumber(state.questions.length);
  
  showCertificateOption();
}

function showCertificateOption() {
  if (!state.questions || state.questions.length === 0) return;
  const scorePercentage = (state.score / state.questions.length) * 100;
  const certificateBtn = document.getElementById("certificateBtn");
  const noCertificateMsg = document.getElementById("noCertificateMsg");
  if (scorePercentage >= 80) { if (certificateBtn) certificateBtn.style.display = "block"; if (noCertificateMsg) noCertificateMsg.style.display = "none"; }
  else { if (certificateBtn) certificateBtn.style.display = "none"; if (noCertificateMsg) noCertificateMsg.style.display = "block"; }
};

function openCertificateForm() { document.getElementById("certificateForm").style.display = "block"; };
function closeCertificateForm() { document.getElementById("certificateForm").style.display = "none"; };
function generateCertificate() {
  const studentName = document.getElementById("studentNameInput").value.trim();
  if (!studentName) { alert("يرجى إدخال اسم الطالب"); return; }
  document.getElementById("certificateStudentName").textContent = studentName;
  
  const scoreText = 'حققت نتيجة ' + formatNumber(state.score) + ' من ' + formatNumber(state.questions.length) + ' (' + Math.round((state.score / state.questions.length) * 100) + '%)';
  document.getElementById("certificateScoreText").textContent = scoreText;
  
  closeCertificateForm();
  document.getElementById("certificateContainer").style.display = "block";
};
function closeCertificate() { document.getElementById("certificateContainer").style.display = "none"; };
function printCertificate() { const certNode = document.getElementById("certificateContainer"); const wrapper = document.createElement('div'); wrapper.className = 'certificate-container-print-wrapper'; wrapper.appendChild(certNode.cloneNode(true)); document.body.appendChild(wrapper); window.print(); document.body.removeChild(wrapper); };
function downloadCertificate() {
  const certificate = document.getElementById("certificateContainer");
  const buttons = certificate.querySelector(".certificate-buttons");
  if (buttons) { buttons.style.display = "none"; }
  const originalPos = certificate.style.position;
  certificate.style.position = 'relative'; 
  html2canvas(certificate, { scale: 2, useCORS: true, logging: false })
    .then((canvas) => {
      const link = document.createElement("a");
      const studentName = document.getElementById("certificateStudentName")?.textContent.trim() || 'student';
      link.download = 'شهادة_إنجاز_' + studentName + '.png';
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    }).finally(() => { 
        if (buttons) { buttons.style.display = "flex"; } 
        certificate.style.position = originalPos;
    });
};

function checkAnswer(userAnswer, isDisplayOnly = false) {
  if (!isDisplayOnly && state.answeredQuestions[state.currentQuestion] !== null) return;
  const q = state.questions[state.currentQuestion];
  let isCorrect = false;
  
  // Defining optionsElement here to fix ReferenceError
  const optionsElement = document.getElementById("options");
  
  if (q.type === "multiple-choice") {
      isCorrect = userAnswer === q.correct;
      state.lastWrong[state.currentQuestion] = userAnswer;
  } else if (q.type === "true-false") {
      isCorrect = userAnswer === q.correctAnswer;
      state.lastWrong[state.currentQuestion] = userAnswer;
  } else if (q.type === "fill-in-the-blank") {
      const ca = q.correctAnswer.split("|").map(a => a.trim().toLowerCase());
      isCorrect = ca.includes((userAnswer || "").trim().toLowerCase());
      state.lastWrong[state.currentQuestion] = userAnswer;
  } else if (q.type === "short-answer") {
      const ca = q.correctAnswer.split("|");
      isCorrect = ca.some(a => (userAnswer||"").includes(a.trim()));
      state.lastWrong[state.currentQuestion] = userAnswer;
  } else if (q.type === "classification") {
      const groups = document.querySelectorAll(".group-drop-zone");
      let allCorrect = true;
      groups.forEach(g => {
          const tid = g.dataset.groupId;
          const items = g.querySelectorAll(".class-item");
          items.forEach(it => {
              if (it.dataset.groupId === tid) it.classList.add("correct");
              else { it.classList.add("wrong"); allCorrect = false; }
              it.draggable = false;
          });
      });
      if (document.querySelector(".classification-items").children.length > 0) allCorrect = false;
      isCorrect = allCorrect;
      
      // FIX: Only remove the specific confirm button container
      if(!isDisplayOnly) document.querySelector(".custom-submit-container")?.remove();
  } else if (q.type === "matching") {
      const drops = document.querySelectorAll(".drop-zone");
      let correctCount = 0;
      const userAns = [];
      drops.forEach((d, i) => {
          const item = d.querySelector(".answer-item");
          if (item) {
              const oIdx = parseInt(item.dataset.originalIndex);
              userAns[i] = oIdx;
              if (oIdx === i) { d.classList.add("correct"); correctCount++; }
              else d.classList.add("wrong");
              item.draggable = false;
          } else {
              d.classList.add("wrong");
          }
      });
      isCorrect = correctCount === (q.pairs||[]).length;
      state.lastWrong[state.currentQuestion] = userAns;
      // FIX: Only remove the specific confirm button container
      if(!isDisplayOnly) document.querySelector(".custom-submit-container")?.remove();
  } else if (q.type === "ordering") {
      const items = Array.from(document.querySelectorAll(".ordering-item"));
      const userOrder = items.map(i => parseInt(i.dataset.originalIndex));
      const correctOrder = (q.items||[]).map((_, i) => i);
      isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
      state.lastWrong[state.currentQuestion] = userOrder;
      const container = document.querySelector(".ordering-container");
      container.classList.add(isCorrect ? "correct" : "wrong");
      items.forEach(i => i.draggable = false);
      // FIX: Only remove the specific confirm button container
      if(!isDisplayOnly) document.querySelector(".custom-submit-container")?.remove();
      if (!isCorrect) {
          const display = document.createElement("div"); display.className = "correct-order-display";
          let html = "<strong>الترتيب الصحيح:</strong><ol>";
          q.items.forEach(it => { html += "<li>" + (it.text || "") + "</li>"; });
          html += "</ol>";
          display.innerHTML = html;
          optionsElement.appendChild(display);
      }
  } else if (q.type === "connecting-lines") {
      let correctCount = 0;
      connectState.connections.forEach(c => {
          if (c.promptIndex === c.answerIndex) correctCount++;
      });
      isCorrect = correctCount === (q.pairs||[]).length;
      state.lastWrong[state.currentQuestion] = connectState.connections;
      drawConnectingLines(true);
      document.querySelectorAll(".connect-item").forEach(el => el.style.pointerEvents = "none");
      // FIX: Only remove the specific confirm button container
      if(!isDisplayOnly) document.querySelector(".custom-submit-container")?.remove();
  }

  if (!isDisplayOnly) {
      state.answeredQuestions[state.currentQuestion] = isCorrect;
      if (isCorrect) state.score++;
      updateScoreCounter();
      
      // Re-render to show feedback immediately (colors, disabled state)
      showQuestion();

      // Auto advance after delay
      setTimeout(() => {
          if (state.currentQuestion < state.questions.length - 1) nextQuestion();
          else showResult();
      }, 2000);
  }
}

function restartQuiz() {
    clearInterval(state.timerId);
    state.currentQuestion = 0;
    state.score = 0;
    state.timeLeft = state.questionTime;
    state.isPaused = false;
    
    // Reset arrays to initial state
    state.answeredQuestions = new Array(state.questions.length).fill(null);
    state.lastWrong = new Array(state.questions.length).fill(null);
    state.shuffledMaps = [];
    
    // Reset UI
    const sb = document.getElementById("scoreBoard");
    if (sb) sb.style.display = "none";
    
    const qc = document.getElementById("quizContainer");
    if (qc) qc.style.display = "none";
    
    const ws = document.getElementById("welcomeScreen");
    if (ws) ws.style.display = "flex";
    
    const progress = document.getElementById("progress");
    if (progress) progress.style.width = "0%";
    
    // Reset buttons state if any exist
    const prevBtn = document.getElementById("prevBtn");
    if (prevBtn) prevBtn.disabled = true;
}

// Helper for DnD
function attachClassificationDragDrop() {
  const items = document.querySelectorAll(".class-item");
  const dropZones = document.querySelectorAll(".group-drop-zone, .classification-items");
  items.forEach(item => {
    item.addEventListener("dragstart", (e) => { draggedItem = item; setTimeout(() => item.classList.add("dragging"), 0); });
    item.addEventListener("dragend", () => { draggedItem.classList.remove("dragging"); draggedItem = null; });
  });
  dropZones.forEach(zone => {
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("over"); });
    zone.addEventListener("dragleave", () => { zone.classList.remove("over"); });
    zone.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("over"); if (draggedItem) zone.appendChild(draggedItem); });
  });
}

// Connecting Lines Logic
function renderConnectingLines(q, optionsElement) {
  optionsElement.className = "connecting-lines-container";
  connectState = { from: null, connections: [], canvas: null, observer: null };
  
  const promptCol = document.createElement("div"); promptCol.className = "connecting-lines-column";
  const answerCol = document.createElement("div"); answerCol.className = "connecting-lines-column";
  
  const wasAnswered = state.answeredQuestions[state.currentQuestion] !== null;
  
  (q.pairs || []).forEach((pair, i) => {
      const el = document.createElement("div"); el.className = "connect-item"; el.dataset.side="prompt"; el.dataset.index = i;
      const content = document.createElement("div"); content.className="option-content";
      if(pair.prompt.image) { const img = document.createElement("img"); img.src=pair.prompt.image; content.appendChild(img); }
      if(pair.prompt.text) { const sp = document.createElement("span"); sp.innerHTML=formatQuizContent(pair.prompt.text); content.appendChild(sp); }
      el.appendChild(content); promptCol.appendChild(el);
  });
  
  // FIX: Shuffle answers correctly while tracking original index
  const answers = (q.pairs || []).map((p, i) => ({c: p.answer, idx: i})).sort(()=>Math.random()-0.5);
  answers.forEach((a) => {
      const el = document.createElement("div"); el.className = "connect-item"; el.dataset.side="answer"; el.dataset.index = a.idx;
      const content = document.createElement("div"); content.className="option-content";
      if(a.c.image) { const img = document.createElement("img"); img.src=a.c.image; content.appendChild(img); }
      if(a.c.text) { const sp = document.createElement("span"); sp.innerHTML=formatQuizContent(a.c.text); content.appendChild(sp); }
      el.appendChild(content); answerCol.appendChild(el);
  });
  
  const canvas = document.createElement("canvas"); canvas.id = "connectingLinesCanvas";
  optionsElement.appendChild(promptCol); optionsElement.appendChild(answerCol); optionsElement.appendChild(canvas);
  
  if(wasAnswered) {
      connectState.connections = state.lastWrong[state.currentQuestion] || [];
      drawConnectingLines(true);
  } else {
      const items = document.querySelectorAll(".connect-item");
      items.forEach(item => {
          item.addEventListener("click", () => {
              if (item.dataset.connected === "true") return;
              const side = item.dataset.side;
              const index = parseInt(item.dataset.index);
              
              if (connectState.from && connectState.from.side !== side) {
                  // Connect
                  const pIdx = side === "prompt" ? index : connectState.from.index;
                  const aIdx = side === "answer" ? index : connectState.from.index;
                  connectState.connections.push({ promptIndex: pIdx, answerIndex: aIdx });
                  
                  // Mark as connected
                  document.querySelector('.connect-item[data-side="prompt"][data-index="'+pIdx+'"]').dataset.connected="true";
                  document.querySelector('.connect-item[data-side="answer"][data-index="'+aIdx+'"]').dataset.connected="true";
                  
                  document.querySelectorAll(".connect-item.selected").forEach(el=>el.classList.remove("selected"));
                  connectState.from = null;
                  drawConnectingLines();
              } else {
                  if (connectState.from) document.querySelectorAll(".connect-item.selected").forEach(el=>el.classList.remove("selected"));
                  item.classList.add("selected");
                  connectState.from = { side, index };
              }
          });
      });
      
      const btnContainer = document.createElement("div"); 
      btnContainer.className = "custom-submit-container";
      const submitBtn = document.createElement("button"); submitBtn.textContent = "تأكيد الإجابة"; submitBtn.className = "nav-btn"; submitBtn.onclick = () => checkAnswer(null);
      btnContainer.appendChild(submitBtn); optionsElement.appendChild(btnContainer);
  }
  
  connectState.canvas = canvas;
  // Initial draw / sizing
  setTimeout(() => drawConnectingLines(wasAnswered), 100);
}

function drawConnectingLines(showFeedback = false) {
    if (!connectState.canvas) return;
    const ctx = connectState.canvas.getContext("2d");
    const container = connectState.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    connectState.canvas.width = rect.width;
    connectState.canvas.height = rect.height;
    ctx.clearRect(0,0,rect.width,rect.height);
    
    connectState.connections.forEach(conn => {
        const from = container.querySelector('.connect-item[data-side="prompt"][data-index="'+conn.promptIndex+'"]');
        const to = container.querySelector('.connect-item[data-side="answer"][data-index="'+conn.answerIndex+'"]');
        if(from && to) {
            const fRect = from.getBoundingClientRect();
            const tRect = to.getBoundingClientRect();
            const startX = fRect.right - rect.left;
            const startY = fRect.top + fRect.height/2 - rect.top;
            const endX = tRect.left - rect.left;
            const endY = tRect.top + tRect.height/2 - rect.top;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.lineWidth = 3;
            if(showFeedback) {
                ctx.strokeStyle = conn.promptIndex === conn.answerIndex ? "#28a745" : "#dc3545";
            } else {
                ctx.strokeStyle = "#007bff";
            }
            ctx.stroke();
        }
    });
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

</script>
</body>
</html>`;
};
