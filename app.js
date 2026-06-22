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

// --- CSV → objektumok (Biztonságos verzió) ---
function parseCSV(csv) {
    // A \r karakterek eltávolítása létfontosságú, különben a sor végén lévő válasz betűje hibás lesz!
    const lines = csv.replace(/\r/g, "").trim().split("\n");
    const headers = lines[0].split(",");

    return lines.slice(1).map(line => {
        const cols = line.split(",");
        let obj = {};
        headers.forEach((h, i) => {
            // Levágjuk az esetleges felesleges szóközöket a kulcsokról és értékekről is
            obj[h.trim()] = cols[i] ? cols[i].trim() : "";
        });
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
        // Itt ellenőrizzük, hogy a mező értéke létezik-e, és nem "0" string vagy üres
        if (currentQuestion[letter] && currentQuestion[letter] !== "0") {
            const btn = document.createElement("button");
            btn.innerText = currentQuestion[letter];
            // Mivel a válaszok (A, B, C) nagybetűk a CSV-ben, a gomb betűjét is nagybetűvé alakítjuk az összehasonlításhoz
            btn.onclick = () => checkAnswer(letter.toUpperCase());
            answersDiv.appendChild(btn);
        }
    });
}

// --- Válasz ellenőrzése ---
function checkAnswer(letter) {
    const card = document.getElementById("quiz-card");

    // FIGYELEM: A CSV fejlécében "Raspuns corect" szerepel, ezért így kell hivatkozni rá!
    const correctLetter = currentQuestion["Raspuns corect"];

    if (letter === correctLetter) {
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

    // Adunk egy kis időt a zöld/piros animációnak, mielőtt eltüntetjük a kártyát
    setTimeout(() => {
        card.classList.add("fade-out");

        setTimeout(() => {
            showQuestion();
            card.classList.remove("fade-out");
            card.classList.add("fade-in");
            setTimeout(() => card.classList.remove("fade-in"), 300);
        }, 300);
    }, 600);
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
