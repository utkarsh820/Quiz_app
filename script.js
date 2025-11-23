// State
let quizData = null;
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 600; // 10 minutes total
let isAnswered = false;

// DOM Elements
const screens = {
  input: document.getElementById("input-screen"),
  start: document.getElementById("start-screen"),
  question: document.getElementById("question-screen"),
  result: document.getElementById("result-screen"),
};

const ui = {
  title: document.getElementById("quiz-title"),
  timer: document.getElementById("timer"),
  currentNum: document.getElementById("current-question-num"),
  totalNum: document.getElementById("total-questions"),
  questionText: document.getElementById("question-text"),
  optionsContainer: document.getElementById("options-container"),
  explanationContainer: document.getElementById("explanation-container"),
  explanationText: document.getElementById("explanation-text"),
  nextBtn: document.getElementById("next-btn"),
  startBtn: document.getElementById("start-btn"),
  restartBtn: document.getElementById("restart-btn"),
  finalScore: document.getElementById("final-score"),
  totalScore: document.getElementById("total-score"),
  circle: document.querySelector(".circle"),
  timerToggle: document.getElementById("timer-toggle"),
  timerDuration: document.getElementById("timer-duration"),
  timerContainer: document.querySelector(".timer-container"),
  timerDurationContainer: document.getElementById("timer-duration-container"),
  quitBtn: document.getElementById("quit-btn"),
  loadBtn: document.getElementById("load-btn"),
  jsonInput: document.getElementById("json-input"),
  errorMsg: document.getElementById("error-msg"),
  qCountStart: document.getElementById("q-count-start"),
  backToInputBtn: document.getElementById("back-to-input-btn")
};

// Initialize
function init() {
  console.log("Initializing app...");
  
  // Check critical elements
  if (!ui.loadBtn) { console.error("Critical: loadBtn not found"); return; }
  if (!ui.jsonInput) { console.error("Critical: jsonInput not found"); return; }
  if (!ui.startBtn) { console.error("Critical: startBtn not found"); return; }

  try {
      ui.loadBtn.addEventListener("click", loadQuizFromInput);
      ui.startBtn.addEventListener("click", startQuiz);
      ui.nextBtn.addEventListener("click", nextQuestion);
      ui.restartBtn.addEventListener("click", resetToInput);
      ui.backToInputBtn.addEventListener("click", resetToInput);
      if (ui.timerToggle) ui.timerToggle.addEventListener("change", toggleTimerSettings);
      if (ui.quitBtn) ui.quitBtn.addEventListener("click", resetToInput);
      
      // Keyboard support
      document.addEventListener('keydown', handleKeyboardInput);
      console.log("App initialized successfully");
  } catch (e) {
      console.error("Error initializing app:", e);
  }
}

function handleKeyboardInput(e) {
    if (screens.question.classList.contains('active') && !isAnswered) {
        const key = parseInt(e.key);
        if (key >= 1 && key <= 4) {
            const index = key - 1;
            const options = ui.optionsContainer.children;
            if (options[index]) {
                selectOption(index, options[index]);
            }
        }
    }
}

// Sound Effects
let audioCtx;
try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        audioCtx = new AudioContext();
    } else {
        console.warn("Web Audio API not supported");
    }
} catch (e) {
    console.warn("AudioContext blocked:", e);
}

function playSound(type) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

function toggleTimerSettings() {
  const isEnabled = ui.timerToggle.checked;
  if (isEnabled) {
    ui.timerDurationContainer.style.opacity = "1";
    ui.timerDurationContainer.style.pointerEvents = "auto";
  } else {
    ui.timerDurationContainer.style.opacity = "0.5";
    ui.timerDurationContainer.style.pointerEvents = "none";
  }
}

function loadQuizFromInput() {
  console.log("Loading quiz from input...");
  try {
      if (!ui.jsonInput) {
          console.error("jsonInput element is missing");
          return;
      }
      const input = ui.jsonInput.value.trim();

  if (!input) {
    showError("Please paste JSON content.");
    return;
  }

  try {
    const data = JSON.parse(input);

    // Basic validation
    if (!data.Quiz || !Array.isArray(data.Quiz) || data.Quiz.length === 0) {
      throw new Error('Invalid JSON: Missing "Quiz" array.');
    }
    if (!data.Title) {
      data.Title = "Quiz"; // Default title
    }

    quizData = data;
    ui.errorMsg.classList.add("hidden");

    // Setup Start Screen
    ui.title.textContent = quizData.Title;
    ui.qCountStart.textContent = quizData.Quiz.length;
    ui.totalNum.textContent = quizData.Quiz.length;
    ui.totalScore.textContent = quizData.Quiz.length;

    switchScreen("start");
  } catch (e) {
    showError("Invalid JSON format. Please check your input.");
    console.error(e);
  }
  } catch (e) {
      console.error("Unexpected error in loadQuizFromInput:", e);
  }
}

function showError(msg) {
  ui.errorMsg.textContent = msg;
  ui.errorMsg.classList.remove("hidden");
}

function startQuiz() {
  console.log("Starting quiz...");
  switchScreen("question");

  const isTimerEnabled = ui.timerToggle.checked;

  if (isTimerEnabled) {
    const durationMinutes = parseInt(ui.timerDuration.value) || 10;
    timeLeft = durationMinutes * 60;
    ui.timerContainer.style.display = "flex";
    startTimer();
  } else {
    ui.timerContainer.style.display = "none";
    ui.timer.textContent = "--:--";
  }

  loadQuestion(0);
}

function switchScreen(screenName) {
  Object.values(screens).forEach((s) => {
    s.classList.remove("active");
    s.classList.add("hidden");
  });
  screens[screenName].classList.remove("hidden");
  screens[screenName].classList.add("active");
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function startTimer() {
  clearInterval(timerInterval); // Clear any existing timer
  ui.timer.textContent = formatTime(timeLeft);
  timerInterval = setInterval(() => {
    timeLeft--;
    ui.timer.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
      endQuiz();
    }
  }, 1000);
}

function loadQuestion(index) {
  console.log("Loading question index:", index);
  const q = quizData.Quiz[index];
  if (!q) {
      console.error("Question not found for index:", index);
      return;
  }
  ui.currentNum.textContent = index + 1;
  ui.questionText.textContent = q.Question;
  ui.explanationContainer.classList.add("hidden");
  ui.nextBtn.disabled = true;
  ui.nextBtn.textContent =
    index === quizData.Quiz.length - 1 ? "Finish Quiz" : "Next Question";
  isAnswered = false;

  ui.optionsContainer.innerHTML = "";
  q.Options.forEach((opt, i) => {
    const btn = document.createElement("div");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.onclick = () => selectOption(i, btn);
    ui.optionsContainer.appendChild(btn);
  });
}

function selectOption(selectedIndex, btnElement) {
  console.log("Option selected:", selectedIndex);
  if (isAnswered) {
      console.log("Already answered, ignoring click.");
      return;
  }
  isAnswered = true;

  const currentQ = quizData.Quiz[currentQuestionIndex];
  // Handle Answer as array or number
  const correctIndex = Array.isArray(currentQ.Answer) ? currentQ.Answer[0] : currentQ.Answer;
  console.log("Correct index:", correctIndex);

  // Highlight selected
  if (selectedIndex === correctIndex) {
    btnElement.classList.add("correct");
    score++;
    playSound('correct');
  } else {
    btnElement.classList.add("wrong");
    playSound('wrong');
    // Show correct one
    if (ui.optionsContainer.children[correctIndex]) {
      ui.optionsContainer.children[correctIndex].classList.add("correct");
    }
  }

  // Disable all options
  Array.from(ui.optionsContainer.children).forEach((child) => {
    child.classList.add("disabled");
  });

  // Show explanation
  ui.explanationText.textContent = currentQ.Explanation;
  ui.explanationContainer.classList.remove("hidden");

  // Enable next button
  ui.nextBtn.disabled = false;
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < quizData.Quiz.length) {
    loadQuestion(currentQuestionIndex);
  } else {
    endQuiz();
  }
}

function endQuiz() {
  clearInterval(timerInterval);
  switchScreen("result");
  ui.finalScore.textContent = score;

  // Animate circle
  const percentage = (score / quizData.Quiz.length) * 100;
  // ui.circle.style.strokeDasharray = `${percentage}, 100`;
  // Fix for circle animation to ensure it resets properly
  setTimeout(() => {
    ui.circle.style.strokeDasharray = `${percentage}, 100`;
  }, 100);

  ui.percentage.textContent = `${Math.round(percentage)}%`;
  
  if (percentage >= 70) {
      startConfetti();
  }
}

function startConfetti() {
    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

function resetToInput() {
  currentQuestionIndex = 0;
  score = 0;
  timeLeft = 600;
  quizData = null;
  ui.jsonInput.value = ""; // Clear input or keep it? User said "generate new again with json", implying maybe new json. Let's clear it.
  ui.circle.style.strokeDasharray = `0, 100`; // Reset circle
  ui.timerContainer.style.display = "flex"; // Show timer again for next time (default)
  switchScreen("input");
}

// Start app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
