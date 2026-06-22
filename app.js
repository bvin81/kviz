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
    // Tisztítsuk meg a Windows-féle \r karakterektől
    const cleanCsv = csv.replace(/\r/g, "").trim();
    
    const lines = [];
    let currentLine = [];
    let currentCell = "";
    let insideQuotes = false;

    // Karakterenként olvassuk be a CSV-t, hogy kezelni tudjuk a macskakörmökön belüli sortöréseket és vesszőket
    for (let i = 0; i < cleanCsv.length; i++) {
        const char = cleanCsv[i];

        if (char === '"') {
            insideQuotes = !insideQuotes; // Ki-be kapcsoljuk a macskaköröm státuszt
        } else if (char === ',' && !insideQuotes) {
            // Ha vessző van és NEM macskakörömben vagyunk -> új oszlop
            currentLine.push(currentCell.trim());
            currentCell = "";
        } else if (char === '\n' && !insideQuotes) {
            // Ha sortörés van és NEM macskakörömben vagyunk -> új sor
            currentLine.push(currentCell.trim());
            lines.push(currentLine);
            currentLine = [];
            currentCell = "";
        } else {
            // Minden más karaktert hozzáfűzünk az aktuális cellához
            currentCell += char;
        }
    }
    // Az utolsó elem hozzáadása, ha maradt
    if (currentCell || currentLine.length > 0) {
        currentLine.push(currentCell.trim());
        lines.push(currentLine);
    }

    const headers = lines[0];

    return lines.slice(1).map(cols => {
        let obj = {};
        headers.forEach((h, i) => {
            let value = cols[i] ? cols[i].trim() : "";
            // Ha a tisztítás után még maradtak felesleges macskakörmök a széleken, azokat levágjuk
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1).trim();
            }
            obj[h.trim()] = value;
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

    // Összegyűjtjük az érvényes válaszlehetőségeket
    let validLetters = ["a", "b", "c", "d"].filter(letter => {
        return currentQuestion[letter] && currentQuestion[letter] !== "0";
    });

    // Válaszlehetőségek sorrendjének véletlenszerű keverése (Fisher-Yates shuffle)
    for (let i = validLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validLetters[i], validLetters[j]] = [validLetters[j], validLetters[i]];
    }

    // Gombok létrehozása a megkevert sorrend alapján
    validLetters.forEach(letter => {
        const btn = document.createElement("button");
        btn.innerText = currentQuestion[letter];
        // Eltároljuk a betűjelet a gombban az ellenőrzéshez
        btn.dataset.letter = letter.toUpperCase();
        btn.onclick = (e) => checkAnswer(e.target);
        answersDiv.appendChild(btn);
    });
}

// --- Válasz ellenőrzése ---
function checkAnswer(clickedButton) {
    // Letiltjuk a többi gombra kattintást, amíg tart az animáció
    const buttons = document.querySelectorAll("#answers button");
    buttons.forEach(btn => btn.style.pointerEvents = "none");

    const card = document.getElementById("quiz-card");
    const chosenLetter = clickedButton.dataset.letter;
    const correctLetter = currentQuestion["Raspuns corect"];

    if (chosenLetter === correctLetter) {
        correctCount++;
        currentQuestion.corrects++;
        clickedButton.classList.add("btn-correct");
    } else {
        wrongCount++;
        currentQuestion.errors++;
        clickedButton.classList.add("btn-wrong");

        // Megmutatjuk a jó választ is, ha a felhasználó hibázott
        buttons.forEach(btn => {
            if (btn.dataset.letter === correctLetter) {
                btn.classList.add("btn-correct-highlight");
            }
        });
    }

    totalAnswered++;
    updateProgressBar();

    document.getElementById("correct").innerText = correctCount;
    document.getElementById("wrong").innerText = wrongCount;

    // MEGNÖVELT IDŐZÍTÉS: 1.5 másodpercig (1500ms) látható marad az eredmény,
    // mielőtt elindítanánk a kártya eltüntetését.
    setTimeout(() => {
        card.classList.add("fade-out");

        setTimeout(() => {
            showQuestion();
            card.classList.remove("fade-out");
            card.classList.add("fade-in");
            setTimeout(() => card.classList.remove("fade-in"), 300);
        }, 300);
    }, 1500); 
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
