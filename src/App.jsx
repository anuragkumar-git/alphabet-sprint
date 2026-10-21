import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Add or edit your personal memory tricks here.
// Keys are the relevant letters. Values are your own mnemonics.
const MEMORY_TRICKS = {
  position: {
    F: "F-6 Function Key, F-16 jet",
    G: "G-7 Summit",
    H: "H can be 8",
    I: "Intel i9 Proccessor",
    J: "Samsungs J-10",
    K: "Panjab Kings XI(11)",
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
    K: "PK movie, Panjab Kings 11",
    P: "PK movie, Panjab Kings 11",
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
  // The queue includes the current question at index 0, followed by unasked questions.
  const [queue, setQueue] = useState([]);
  const [question, setQuestion] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [tricks] = useState(MEMORY_TRICKS);

  const startedAt = useRef(null);
  const finished = useRef(false);
  const inputRef = useRef(null);
  const nextButtonRef = useRef(null);
  const startButtonRef = useRef(null);
  const restartButtonRef = useRef(null);

  // UX: move keyboard focus to the next useful control after every state change.
  // This lets the whole quiz run with typing + Enter, without cursor travel.
  useEffect(() => {
    if (hasStarted && question) {
      if (result) nextButtonRef.current?.focus();
      else inputRef.current?.focus();
    } else if (isComplete) {
      restartButtonRef.current?.focus();
    } else {
      startButtonRef.current?.focus();
    }
  }, [hasStarted, isComplete, question?.id, result]);

  const startTimer = () => {
    startedAt.current = performance.now();
    finished.current = false;
  };

  const startTest = (selectedMode = mode) => {
    const freshQueue = shuffle(createPool(selectedMode));
    setMode(selectedMode);
    setQueue(freshQueue);
    setQuestion(freshQueue[0] ?? null);
    setInput("");
    setResult(null);
    setTestResults([]);
    setHasStarted(true);
    setIsComplete(false);
    startTimer();
  };

  const checkAnswer = useCallback(
    (rawAnswer) => {
      if (finished.current || !question || !rawAnswer.trim()) return;

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
      setTestResults((old) => [...old, record]);
    },
    [question, tricks],
  );

  function handleInputChange(value) {
    if (finished.current || !question) return;
    setInput(value);

    if (question.type === "position") {
      // Two-digit positions auto-check. For 1–9, press Check or Enter to avoid
      // prematurely checking the first digit of a two-digit answer.
      if (/^\d{2}$/.test(value.trim())) checkAnswer(value);
    } else if (/^[a-z]$/i.test(value.trim())) {
      checkAnswer(value);
    }
  }

  function nextQuestion() {
    if (!result || queue.length <= 1) return;

    const remaining = queue.slice(1);
    setQueue(remaining);
    setQuestion(remaining[0]);
    setInput("");
    setResult(null);
    startTimer();
  }

  function changeMode(nextMode) {
    // Selecting a category prepares its test, but the user must press Start.
    setMode(nextMode);
    setQueue([]);
    setQuestion(null);
    setInput("");
    setResult(null);
    setTestResults([]);
    setHasStarted(false);
    setIsComplete(false);
    finished.current = false;
    startedAt.current = null;
  }

  function finishTest() {
    if (!result || queue.length > 1) return;
    setIsComplete(true);
    setHasStarted(false);
    setQuestion(null);
    setInput("");
  }

  function resetSession() {
    setHistory([]);
    setTestResults([]);
    startTest(mode);
  }

  const correctCount = history.filter((item) => item.correct).length;
  const averageTime = history.length
    ? history.reduce((sum, item) => sum + item.timeMs, 0) / history.length
    : 0;
  const testCorrect = testResults.filter((item) => item.correct).length;
  const testAverage = testResults.length
    ? testResults.reduce((sum, item) => sum + item.timeMs, 0) /
      testResults.length
    : 0;

  // Remaining means questions after the currently displayed question.
  // Before answering, include the current question in the displayed count;
  // after answering, subtract it. Thus the final answered question shows 0.
  const remainingCount = !hasStarted
    ? 0
    : Math.max(0, queue.length - (result ? 1 : 0));
  const totalQuestions = hasStarted || isComplete ? createPool(mode).length : 0;
  const answeredInTest = testResults.length;
  const currentQuestionNumber = hasStarted
    ? answeredInTest + (result ? 0 : 1)
    : totalQuestions;

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
          <span>Overall accuracy</span>
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

        {!hasStarted && !isComplete && (
          <div className="test-intro">
            <h2>Ready to practise?</h2>
            <p className="muted">
              {createPool(mode).length} unique questions in this round.
              Questions are shuffled and won't repeat until the round is
              complete.
            </p>
            <button
              ref={startButtonRef}
              className="primary start-button"
              onClick={() => startTest(mode)}
            >
              Start test
            </button>
          </div>
        )}

        {hasStarted && question && (
          <>
            <div className="round-status">
              <span>
                QUESTION {currentQuestionNumber} OF {totalQuestions}
              </span>
              <span>{remainingCount} LEFT AFTER THIS</span>
            </div>
            {/* Helpful addition: a progress bar makes it clear how far through the test you are. */}
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Test progress"
              aria-valuemin={0}
              aria-valuemax={totalQuestions}
              aria-valuenow={answeredInTest}
            >
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (answeredInTest / Math.max(1, totalQuestions)) * 100)}%`,
                }}
              />
            </div>

            <div className="question">
              <h2>{question.prompt}</h2>
              <p className="muted">
                {question.type === "position"
                  ? "Type a number from 1 to 26."
                  : "Type one letter. The answer checks automatically."}
              </p>
            </div>

            <div className="answer-row">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => handleInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    if (result) {
                      if (queue.length > 1) nextQuestion();
                      else finishTest();
                    } else {
                      checkAnswer(input);
                    }
                  }
                }}
                disabled={Boolean(result)}
                placeholder={
                  question.type === "position" ? "e.g. 12" : "e.g. Y"
                }
                type={question.type === "position" ? "number" : "text"}
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
              ) : queue.length > 1 ? (
                <button
                  ref={nextButtonRef}
                  className="primary"
                  onClick={nextQuestion}
                >
                  Next question →
                </button>
              ) : (
                <button
                  ref={nextButtonRef}
                  className="primary"
                  onClick={finishTest}
                >
                  Finish test
                </button>
              )}
            </div>

            {result && (
              <div
                className={`feedback ${result.correct ? "correct" : "incorrect"}`}
                role="status"
              >
                <strong>{result.correct ? "Correct!" : "Incorrect"}</strong>
                {!result.correct && (
                  <p>
                    Your answer: <b>{result.yourAnswer}</b>
                    {" · "}Correct answer: <b>{result.correctAnswer}</b>
                  </p>
                )}
                <p>
                  Time taken: <b>{formatTime(result.timeMs)}</b>
                  {" · "}Submitted: <b>{result.timestamp}</b>
                </p>
                {result.trick && (
                  <p className="result-trick">
                    Memory trick: <b>{result.trick}</b>
                  </p>
                )}
              </div>
            )}
            <p className="keyboard-hint">
              Press Enter to check or advance. The timer stops when you submit.
            </p>
          </>
        )}

        {isComplete && (
          <div className="completion">
            <p className="eyebrow">ROUND COMPLETE</p>
            <h2>Test finished</h2>
            <p className="muted">
              You've answered all {testResults.length} unique questions in this
              round.
            </p>
            <div className="completion-stats">
              <Stat
                label="Correct"
                value={`${testCorrect}/${testResults.length}`}
              />
              <Stat
                label="Accuracy"
                value={`${testResults.length ? Math.round((testCorrect / testResults.length) * 100) : 0}%`}
              />
              <Stat label="Avg. time" value={formatTime(testAverage)} />
            </div>
            <button
              ref={restartButtonRef}
              className="primary start-button"
              onClick={() => startTest(mode)}
            >
              Start again
            </button>
            <button
              className="secondary start-button"
              onClick={() => changeMode(mode)}
            >
              Back to test setup
            </button>
          </div>
        )}
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
            Reset history & restart
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
                  <tr
                    key={item.id}
                    style={
                      !item.correct ? { backgroundColor: "#e9f7ed" } : undefined
                    }
                  >
                    <td>
                      <span
                        className={item.correct ? "status-good" : "status-bad"}
                      >
                        {item.correct ? "Correct" : "Incorrect"}
                      </span>
                    </td>
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
                    <td>{item.trick || "—"}</td>
                    <td>{item.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
