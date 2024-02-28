import logo from "./logo.svg";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Form } from "react-bootstrap";
import questions from "./questions.json"; // Adjust the path if your JSON is located elsewhere

function App() {
  const shuffleQuestions = (questions) => {
    let shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
    }
    return shuffled;
  };

  // eslint-disable-next-line
  const [allQuestions, setAllQuestions] = useState(shuffleQuestions(questions));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [showCorrect, setShowCorrect] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const inputRef = useRef(null);

  const allTags = [...new Set(questions.flatMap((question) => question.tags))];
  const [includedTags, setIncludedTags] = useState(allTags);
  const [excludedTags, setExcludedTags] = useState([]);

  const findNextQuestionIndex = useCallback(
    (currentIndex) => {
      let nextIndex = currentIndex;
      do {
        nextIndex = (nextIndex + 1) % allQuestions.length; // Circular queue
        const question = allQuestions[nextIndex];
        const includesConditionMet =
          includedTags.length === 0 ||
          includedTags.some((tag) => question.tags.includes(tag));
        const excludesConditionMet = !excludedTags.some((tag) =>
          question.tags.includes(tag)
        );

        if (includesConditionMet && excludesConditionMet) {
          return nextIndex;
        }
      } while (nextIndex !== currentIndex); // Avoid infinite loop

      return -1; // In case no suitable question is found
    },
    [allQuestions, includedTags, excludedTags]
  );

  const selectAllIncluded = () => {
    setIncludedTags(allTags);
    setExcludedTags([]); // Deselect all in excluded
  };

  const deselectAllIncluded = () => {
    setIncludedTags([]);
  };

  const selectAllExcluded = () => {
    setExcludedTags(allTags);
    setIncludedTags([]); // Deselect all in included
  };

  const deselectAllExcluded = () => {
    setExcludedTags([]);
  };

  const handleTagChange = (tag, isChecked, isIncluded) => {
    if (isIncluded) {
      // If the tag is being included, add it to the includedTags and remove from excludedTags
      setIncludedTags((prev) =>
        isChecked ? [...prev, tag] : prev.filter((t) => t !== tag)
      );
      setExcludedTags((prev) => prev.filter((t) => t !== tag)); // Remove from excluded if present
    } else {
      // If the tag is being excluded, add it to the excludedTags and remove from includedTags
      setExcludedTags((prev) =>
        isChecked ? [...prev, tag] : prev.filter((t) => t !== tag)
      );
      setIncludedTags((prev) => prev.filter((t) => t !== tag)); // Remove from included if present
    }
  };

  const handleSubmit = useCallback(() => {
    const correct =
      allQuestions[currentQuestionIndex].answer === currentAnswer.trim();
    setIsCorrect(correct);
    setQuestionAnswered(true);

    if (!reviewMode) {
      if (correct) {
        setStreakCount(streakCount + 1);
      } else {
        setStreakCount(0); // Reset streak if the answer is wrong
        // Add currentQuestionIndex to incorrectQuestions list if not already added
        if (!incorrectQuestions.includes(currentQuestionIndex)) {
          setIncorrectQuestions([...incorrectQuestions, currentQuestionIndex]);
        }
      }
    }
  }, [
    allQuestions,
    currentQuestionIndex,
    currentAnswer,
    incorrectQuestions,
    streakCount,
  ]);

  const handleNext = useCallback(() => {
    let nextIndex;
    if (reviewMode) {
      // Find the next question in the incorrectQuestions list
      const currentIncorrectIndex =
        incorrectQuestions.indexOf(currentQuestionIndex);
      const nextIncorrectIndex =
        (currentIncorrectIndex + 1) % incorrectQuestions.length;
      nextIndex = incorrectQuestions[nextIncorrectIndex];
    } else {
      nextIndex = findNextQuestionIndex(currentQuestionIndex);
    }

    if (nextIndex !== -1) {
      setCurrentQuestionIndex(nextIndex);
      setCurrentAnswer(""); // Clear textbox
      if (inputRef.current) {
        inputRef.current.focus(); // Set focus
      }
      setQuestionAnswered(false);
    } else {
      console.log("No more questions match the criteria.");
    }
  }, [
    reviewMode,
    incorrectQuestions,
    inputRef,
    currentQuestionIndex,
    findNextQuestionIndex,
  ]);

  const handleReviewModeToggle = (e) => {
    const enabled = e.target.checked;
    setReviewMode(enabled);

    if (enabled && incorrectQuestions.length > 0) {
      const firstIncorrectIndex = incorrectQuestions[0];
      setCurrentQuestionIndex(firstIncorrectIndex);
      setCurrentAnswer(""); // Clear the answer input field
      setQuestionAnswered(false); // Ensure the state reflects that the new question hasn't been answered yet

      // Optionally focus the input field if needed
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  useEffect(() => {
    if (!reviewMode) {
      setIncorrectQuestions([]); // Clear incorrect questions when exiting review mode
    }
  }, [reviewMode]);

  useEffect(() => {
    const handleGlobalKeyPress = (e) => {
      if (e.key === "Enter") {
        if (!questionAnswered || !showCorrect & !isCorrect) {
          handleSubmit();
        } else {
          handleNext();
        }
      }
    };

    // Add event listener when component mounts
    window.addEventListener("keydown", handleGlobalKeyPress);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyPress);
    };
  }, [questionAnswered, handleSubmit, handleNext, isCorrect, showCorrect]);

  useEffect(() => {
    // Automatically focus the input box if the question has not been answered
    if (!questionAnswered && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestionIndex, questionAnswered]);

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Python Snippets Dry-Run Quiz</h2>
      <p>
        These snippets are designed to test basic knowledge of the EdExcel 9-1
        GCSE Programming Language Subset. For this GCSE you are given a copy of
        this document in the practical exam so you may wish to use a printed
        copy for these exercises or web-search for an online copy. You can press
        [Enter] to submit an answer and also to move to the next question.
      </p>
      <div className="row">
        <div className="col-md-4">
          <Form>
            <Form.Check
              type="switch"
              id="show-correct-switch"
              label="Show Correct Answers"
              checked={showCorrect}
              onChange={(e) => setShowCorrect(e.target.checked)}
            />
            <Form.Check
              type="switch"
              id="review-mode-switch"
              label={`Review Correction Mode (${incorrectQuestions.length})`}
              checked={reviewMode}
              onChange={handleReviewModeToggle}
              disabled={incorrectQuestions.length === 0}
            />
          </Form>
          <div className="tag-selection">
            <h4 className="heading-padding-top">Include Tags</h4>
            <div className="mb-2">
              <a
                href="#"
                className="mr-2 bootstrap-margin-right"
                onClick={(e) => {
                  e.preventDefault();
                  selectAllIncluded();
                }}
              >
                Select All
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  deselectAllIncluded();
                }}
              >
                Select None
              </a>
            </div>

            {allTags.map((tag) => (
              <div key={tag}>
                <input
                  type="checkbox"
                  checked={includedTags.includes(tag)}
                  onChange={(e) => handleTagChange(tag, e.target.checked, true)}
                />{" "}
                {tag}
              </div>
            ))}

            <h4 className="heading-padding-top">Exclude Tags</h4>
            <div className="mb-2">
              <a
                href="#"
                className="mr-2 bootstrap-margin-right"
                onClick={(e) => {
                  e.preventDefault();
                  selectAllExcluded();
                }}
              >
                Select All
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  deselectAllExcluded();
                }}
              >
                Select None
              </a>
            </div>

            {allTags.map((tag) => (
              <div key={tag + "-exclude"}>
                <input
                  type="checkbox"
                  checked={excludedTags.includes(tag)}
                  onChange={(e) =>
                    handleTagChange(tag, e.target.checked, false)
                  }
                />{" "}
                {tag}
              </div>
            ))}
          </div>

          <div className="toggle-buttons">
            {/* Placeholder for future toggle buttons */}
          </div>
        </div>
        <div className="col-md-8">
          <div
            className="question-area mb-3"
            style={{
              border: reviewMode ? "2px solid red" : "none",
              padding: reviewMode ? "15px" : "0",
            }}
          >
            <h2>Question:</h2>
            <pre className="bg-light p-3 border rounded">
              <code>{allQuestions[currentQuestionIndex].question}</code>
            </pre>{" "}
          </div>
          <div className="answer-area mb-3">
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Enter your answer here"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              disabled={questionAnswered && showCorrect}
            />
          </div>
          <div className="navigation-buttons mb-3">
            <button
              onClick={handleSubmit}
              disabled={questionAnswered && showCorrect}
              className="btn btn-primary mr-2 bootstrap-margin-right"
            >
              {questionAnswered ? (isCorrect ? "✓ " : "✗ ") : ""}Submit
            </button>
            <button
              onClick={handleNext}
              disabled={!questionAnswered}
              className="btn btn-secondary bootstrap-margin-right"
            >
              Next
            </button>
            {questionAnswered && !isCorrect && showCorrect && (
              <div className="feedback incorrect">
                The correct answer was:{"  "}
                <pre>{allQuestions[currentQuestionIndex].answer}</pre>
              </div>
            )}
          </div>
          {!reviewMode && (
            <div className="streak-counter">Streak: {streakCount}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
