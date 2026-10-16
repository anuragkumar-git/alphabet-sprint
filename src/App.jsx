import { useCallback, useRef, useState } from "react";
import "./App.css";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Add or edit your personal memory tricks here.
// Keys are the relevant letters. Values are your own mnemonics.
const MEMORY_TRICKS = {
  position: {
    F: "F-6 Function Key",
    G: "G-7 Summit",
    H: "H can be 8",
    I: "Intel i9 Proccessor",
    J: "Samsungs J-10",
    k: "Panjab Kings XI(11)",
    L: "1.2-litre car engine",
    M: "Mein tera(13)",
    N: "N(14) after M(13)",
    O: "Oxigen-15 (Atomic mass of a single oxygen atom 15.999)",
    P: "P-16(Phosphorus 16 neutrons)",
    Q: "Queen at age 17",
    R: "Raja at age 18",
    S: "Samsung S-19",
    T: "T-20 Cricket format",
    U: "Uranium 21",
    V: "Victory 22, ✌️✌️",
    W: "23, Shift 3 90° right",
    X: "X-24, mutant of wolverine",
    Y: "25",
    Z: "27",
  },
  pair: {
    A: "A-Z",
    Z: "A-Z",
    B: "BoY",
    Y: "BoY",
    C: "CraxX",
    X: "CraxX",
    D: "mountain DeW",
    W: "mountain DeW",
    E: "Electric Vehicle",
    V: "Electric Vehicle",
    F: "FlU",
    U: "FlU",
    G: "Gujarat Titens, Gran Turismo, GT-650",
    T: "Gujarat Titens, Gran Turismo, GT-650",
    H: "High School",
    S: "High School",
    I: "InfraRed light",
    R: "InfraRed light",
    J: "JQ-No single word in vocab",
    Q: "JQ-No single word in vocab",
    K: "PK movie",
    P: "PK movie",
    L: "LOve",
    O: "LOve",
    M: "MN",
    N: "MN",
  },
};

const MODES = ["mixed", "position", "next", "previous", "pair"];

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function makeQuestion(type, index) {
  const letter = ALPHABET[index];

  if (type === "position") {
    return {
      id: `position-${letter}`,
      type,
      letter,
      prompt: `What is the POSITION of ${letter}?`,
      answer: String(index + 1),
    };
  }

  if (type === "next") {
    return {
      id: `next-${letter}`,
      type,
      letter,
      prompt: `Which letter comes AFTER ${letter}?`,
      answer: ALPHABET[index + 1],
    };
  }

  if (type === "previous") {
    return {
      id: `previous-${letter}`,
      type,
      letter,
      prompt: `Which letter comes BEFORE ${letter}?`,
      answer: ALPHABET[index - 1],
    };
  }

  if (type === "pair") {
    return {
      id: `pair-${letter}`,
      type,
      letter,
      prompt: `What is the opposite PAIR of ${letter}?`,
      answer: ALPHABET[25 - index],
    };
  }
}

function createPool(mode) {
  const types =
    mode === "mixed" ? ["position", "next", "previous", "pair"] : [mode];

  return types.flatMap((type) =>
    ALPHABET.map((_, index) => ({ type, index }))
      .filter(({ type, index }) => {
        if (type === "next") return index < 25;
        if (type === "previous") return index > 0;
        return true;
      })
      .map(({ type, index }) => makeQuestion(type, index)),
  );
}

function formatTime(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function getTrick(question, tricks) {
  return tricks[question.type]?.[question.letter] || "";
}

export default function App() {
  const [mode, setMode] = useState("mixed");

  // The queue contains questions that have not yet been asked.
  const [queue, setQueue] = useState(() => shuffle(createPool("mixed")));

  const [question, setQuestion] = useState(() => queue[0]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [tricks, setTricks] = useState(MEMORY_TRICKS);
  const [positionLetter, setPositionLetter] = useState("L");
  const [pairLetter, setPairLetter] = useState("B");

  const startedAt = useRef(performance.now());
  const finished = useRef(false);

  const startTimer = () => {
    startedAt.current = performance.now();
    finished.current = false;
  };

  const checkAnswer = useCallback(
    (rawAnswer) => {
      if (finished.current || !rawAnswer.trim()) return;

      const timeMs = performance.now() - startedAt.current;
      const value = rawAnswer.trim().toUpperCase();
      const correct = value === question.answer.toUpperCase();

      finished.current = true;

      const record = {
        id: `${Date.now()}-${Math.random()}`,
        prompt: question.prompt,
        type: question.type,
        letter: question.letter,
        yourAnswer: value,
        correctAnswer: question.answer,
        correct,
        timeMs,
        timestamp: new Date().toLocaleTimeString(),
        trick: getTrick(question, tricks),
      };

      setResult(record);
      setHistory((old) => [record, ...old]);
    },
    [question, tricks],
  );

  function handleInputChange(value) {
    if (finished.current) return;

    setInput(value);

    if (question.type === "position") {
      // Wait for two digits, or use Check/Enter for single digits.
      if (/^\d{2}$/.test(value.trim())) {
        checkAnswer(value);
      }
    } else if (/^[a-z]$/i.test(value.trim())) {
      checkAnswer(value);
    }
  }

  function nextQuestion() {
    let next;
    let remaining;

    if (queue.length > 1) {
      next = queue[1];
      remaining = queue.slice(1);
    } else {
      // Every unique question in this mode has been used.
      // Start a new shuffled round.
      remaining = shuffle(createPool(mode));
      next = remaining[0];
    }

    setQueue(remaining);
    setQuestion(next);
    setInput("");
    setResult(null);
    startTimer();
  }

  function changeMode(nextMode) {
    setMode(nextMode);

    const freshQueue = shuffle(createPool(nextMode));
    setQueue(freshQueue);
    setQuestion(freshQueue[0]);
    setInput("");
    setResult(null);
    startTimer();
  }

  function updateTrick(type, letter, value) {
    setTricks((old) => {
      if (type === "pair") {
        const opposite = ALPHABET[25 - ALPHABET.indexOf(letter)];

        return {
          ...old,
          pair: {
            ...old.pair,
            [letter]: value,
            [opposite]: value,
          },
        };
      }

      return {
        ...old,
        [type]: {
          ...old[type],
          [letter]: value,
        },
      };
    });
  }

  function resetSession() {
    setHistory([]);
    changeMode(mode);
  }

  const correctCount = history.filter((item) => item.correct).length;
  const averageTime = history.length
    ? history.reduce((sum, item) => sum + item.timeMs, 0) / history.length
    : 0;

  const currentTrick = getTrick(question, tricks);
  const remainingCount = queue.length;

  return (
    <main className="trainer">
      <header className="topbar">
        <div>
          <p className="eyebrow">DAILY BRAIN TRAINING</p>
          <h1>Alphabet Sprint</h1>
          <p className="muted">
            Build recall, improve speed, and use your own memory tricks.
          </p>
        </div>

        <div className="live-score">
          <span>Accuracy</span>
          <strong>
            {history.length
              ? Math.round((correctCount / history.length) * 100)
              : 0}
            %
          </strong>
        </div>
      </header>

      <section className="stats">
        <Stat label="Attempted" value={history.length} />
        <Stat label="Correct" value={correctCount} />
        <Stat label="Avg. time" value={formatTime(averageTime)} />
      </section>

      <section className="practice panel">
        <label className="section-label" htmlFor="mode">
          PRACTICE MODE
        </label>

        <select
          id="mode"
          value={mode}
          onChange={(event) => changeMode(event.target.value)}
        >
          {MODES.map((item) => (
            <option key={item} value={item}>
              {
                {
                  mixed: "Mixed challenge",
                  position: "Alphabet positions",
                  next: "Next letter",
                  previous: "Previous letter",
                  pair: "Opposite pairs (A–Z)",
                }[item]
              }
            </option>
          ))}
        </select>

        <div className="question">
          <span className="question-number">
            {remainingCount} QUESTIONS LEFT IN THIS ROUND
          </span>

          <h2>{question.prompt}</h2>

          <p className="muted">
            {question.type === "position"
              ? "Type a number from 1 to 26."
              : "Type one letter. The answer checks automatically."}
          </p>

          {/* {currentTrick && (
            <div className="memory-hint">
              <span>YOUR MEMORY TRICK</span>
              <strong>{currentTrick}</strong>
            </div>
          )} */}
        </div>

        <div className="answer-row">
          <input
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                if (result) nextQuestion();
                else checkAnswer(input);
              }
            }}
            disabled={Boolean(result)}
            placeholder={question.type === "position" ? "e.g. 12" : "e.g. Y"}
            type={question.type === "position" ? "number" : ""}
            aria-label="Your answer"
            autoComplete="off"
          />

          {!result ? (
            <button
              className="primary"
              onClick={() => checkAnswer(input)}
              disabled={!input.trim()}
            >
              Check
            </button>
          ) : (
            <button autoFocus className="primary" onClick={nextQuestion}>
              Next question →
            </button>
          )}
        </div>

        {result && (
          <div
            className={`feedback ${result.correct ? "correct" : "incorrect"}`}
            role="status"
          >
            <strong>{result.correct ? "Correct!" : "Incorrect"}</strong>

            <p>
              Your answer: <b>{result.yourAnswer}</b>
              {" · "}
              Correct answer: <b>{result.correctAnswer}</b>
            </p>

            <p>
              Time taken: <b>{formatTime(result.timeMs)}</b>
              {" · "}
              Submitted: <b>{result.timestamp}</b>
            </p>

            {result.trick && (
              <p className="memory-hint">
                Memory trick: <b>{result.trick}</b>
              </p>
            )}
          </div>
        )}

        <p className="keyboard-hint">
          Enter checks your answer or advances to the next question.
        </p>
      </section>

      <section className="panel history-panel">
        <div className="history-heading">
          <div>
            <h2>Session history</h2>
            <p className="muted">
              Answers, mnemonics, accuracy, and response times.
            </p>
          </div>

          <button
            className="secondary"
            onClick={resetSession}
            disabled={!history.length}
          >
            Reset
          </button>
        </div>

        {!history.length ? (
          <p className="empty">Your attempts will appear here.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Your answer</th>
                  <th>Time</th>
                  <th>Result</th>
                  <th>Memory trick</th>
                  <th>Submitted</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.prompt}</td>
                    <td>
                      {item.yourAnswer}
                      {!item.correct && (
                        <span className="correct-answer">
                          {" → "}
                          {item.correctAnswer}
                        </span>
                      )}
                    </td>
                    <td>{formatTime(item.timeMs)}</td>
                    <td>
                      <span
                        className={item.correct ? "status-good" : "status-bad"}
                      >
                        {item.correct ? "Correct" : "Incorrect"}
                      </span>
                    </td>
                    <td>{item.trick || "—"}</td>
                    <td>{item.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* <section className="panel tricks-panel">
        <h2>My memory tricks</h2>
        <p className="muted">
          Add your mnemonics here. They appear with matching questions and in
          the answer history.
        </p>

        <div className="trick-editor">
          <label htmlFor="position-letter">Position trick for letter</label>
          <div className="trick-fields">
            <select
              id="position-letter"
              value={question.type === "position" ? question.letter : "L"}
              onChange={(event) => {
                const letter = event.target.value;
                setQuestion(makeQuestion("position", ALPHABET.indexOf(letter)));
                setInput("");
                setResult(null);
                startTimer();
              }}
            >
              {ALPHABET.map((letter) => (
                <option key={letter} value={letter}>
                  {letter}
                </option>
              ))}
            </select>

            <input
              value={
                tricks.position?.[
                  question.type === "position" ? question.letter : "L"
                ] || ""
              }
              onChange={(event) =>
                updateTrick(
                  "position",
                  question.type === "position" ? question.letter : "L",
                  event.target.value,
                )
              }
              placeholder="e.g. 1.2-litre engine"
            />
          </div>

          <label htmlFor="pair-letter">Pair trick for letter</label>
          <div className="trick-fields">
            <select
              id="pair-letter"
              value={question.type === "pair" ? question.letter : "B"}
              onChange={(event) => {
                const letter = event.target.value;
                setQuestion(makeQuestion("pair", ALPHABET.indexOf(letter)));
                setInput("");
                setResult(null);
                startTimer();
              }}
            >
              {ALPHABET.map((letter) => (
                <option key={letter} value={letter}>
                  {letter}
                </option>
              ))}
            </select>

            <input
              value={
                tricks.pair?.[
                  question.type === "pair" ? question.letter : "B"
                ] || ""
              }
              onChange={(event) =>
                updateTrick(
                  "pair",
                  question.type === "pair" ? question.letter : "B",
                  event.target.value,
                )
              }
              placeholder="e.g. BoY"
            />
          </div>
        </div>

        <p className="keyboard-hint">
          These edits currently last only until you refresh the page. Add
          localStorage persistence if you want to keep them permanently.
        </p>
      </section> */}
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat panel">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
