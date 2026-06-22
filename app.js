let questions = [];
let currentQuestion = null;

let correctCount = 0;
let wrongCount = 0;
let totalAnswered = 0;

// --- CSV betöltése ---
fetch("questions.csv")
    .then(response => response.text())
    .then(text => {
        questions = parseCSV(text);
        showQuestion();
    });

// --- CSV → objektumok ---
function parseCSV(csv) {
    const lines = csv.trim().split("\n");
    const headers = lines[0].split(",");

    return lines.slice(1).map(line => {
        const cols = line.split(",");
        let obj = {};
        headers.forEach((h, i) => obj[h] = cols[i]);
        obj.errors = 0;
        obj.corrects = 0;
        return obj;
    });
}

// --- Súlyozott kérdéskiválasztás ---
function pickWeightedQuestion() {
    let weighted = [];

    questions.forEach(q => {
        const weight = 1 + q.errors * 2 - q.corrects * 0.5;
        for (let i = 0; i < Math.max(1, weight); i++) {
            weighted.push(q);
        }
    });

    return weighted[Math.floor(Math.random() * weighted.length)];
}

// --- Kérdés megjelenítése ---
function showQuestion() {
    currentQuestion = pickWeightedQuestion();

    document.getElementById("question").innerText = currentQuestion.intrebare;

    const answersDiv = document.getElementById("answers");
    answersDiv.innerHTML = "";

    ["a", "b", "c", "d"].forEach(letter => {
        if (currentQuestion[letter] !== "0") {
            const btn = document.createElement("button");
            btn.innerText = currentQuestion[letter];
            btn.onclick = () => checkAnswer(letter);
            answersDiv.appendChild(btn);
        }
    });
}

// --- Válasz ellenőrzése ---
function checkAnswer(letter) {
    const card = document.getElementById("quiz-card");

    if (letter === currentQuestion.Raspuns) {
        correctCount++;
        currentQuestion.corrects++;
        card.classList.add("correct-anim");
        setTimeout(() => card.classList.remove("correct-anim"), 500);
    } else {
        wrongCount++;
        currentQuestion.errors++;
        card.classList.add("wrong-anim");
        setTimeout(() => card.classList.remove("wrong-anim"), 400);
    }

    totalAnswered++;
    updateProgressBar();

    document.getElementById("correct").innerText = correctCount;
    document.getElementById("wrong").innerText = wrongCount;

    card.classList.add("fade-out");

    setTimeout(() => {
        showQuestion();
        card.classList.remove("fade-out");
        card.classList.add("fade-in");
        setTimeout(() => card.classList.remove("fade-in"), 300);
    }, 300);
}

// --- Progress bar frissítése ---
function updateProgressBar() {
    const bar = document.getElementById("progress-bar");

    let percent = 0;
    if (totalAnswered > 0) {
        percent = Math.round((correctCount / totalAnswered) * 100);
    }

    bar.style.width = percent + "%";
}
