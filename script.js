document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    const newQuizBtn = document.getElementById('new-quiz-btn');
    const setupScreen = document.querySelector('.setup-screen');
    const quizScreen = document.querySelector('.quiz-screen');
    const resultsScreen = document.querySelector('.results-screen');
    const loadingScreen = document.querySelector('.loading-screen');
    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options');
    const scoreElement = document.getElementById('score');
    const currentQuestionElement = document.getElementById('current-question');
    const totalQuestionsElement = document.getElementById('total-questions');
    const timerElement = document.getElementById('time');
    const finalScoreElement = document.getElementById('final-score');
    const maxScoreElement = document.getElementById('max-score');
    const correctAnswersElement = document.getElementById('correct-answers');
    const timeTakenElement = document.getElementById('time-taken');

    // Quiz variables
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timer;
    let timeLeft = 30;
    let quizStartTime;
    let quizDuration = 0;

    // Event Listeners
    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', showNextQuestion);
    restartBtn.addEventListener('click', restartQuiz);
    newQuizBtn.addEventListener('click', newQuiz);

    // Start quiz function
    async function startQuiz() {
        const category = document.getElementById('category').value;
        const difficulty = document.getElementById('difficulty').value;
        const amount = document.getElementById('amount').value;

        setupScreen.classList.add('hidden');
        loadingScreen.classList.remove('hidden');

        try {
            questions = await fetchQuestions(category, difficulty, amount);
            loadingScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            
            // Initialize quiz state
            currentQuestionIndex = 0;
            score = 0;
            scoreElement.textContent = score;
            totalQuestionsElement.textContent = questions.length;
            
            showQuestion();
            quizStartTime = new Date();
        } catch (error) {
            loadingScreen.classList.add('hidden');
            setupScreen.classList.remove('hidden');
            alert(`Error: ${error.message}`);
        }
    }

    // Fetch questions from Open Trivia DB API
    async function fetchQuestions(category, difficulty, amount) {
        let apiUrl = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
        
        if (category !== 'any') apiUrl += `&category=${category}`;
        if (difficulty !== 'any') apiUrl += `&difficulty=${difficulty}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.response_code !== 0) {
            throw new Error('Could not load questions. Please try again.');
        }

        // Decode HTML entities in questions and answers
        return data.results.map(question => ({
            ...question,
            question: decodeHTML(question.question),
            correct_answer: decodeHTML(question.correct_answer),
            incorrect_answers: question.incorrect_answers.map(a => decodeHTML(a))
        }));
    }

    // Decode HTML entities
    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    // Show current question
    function showQuestion() {
        resetTimer();
        startTimer();
        
        const question = questions[currentQuestionIndex];
        const options = [...question.incorrect_answers, question.correct_answer];
        
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        currentQuestionElement.textContent = currentQuestionIndex + 1;
        questionElement.textContent = question.question;
        optionsContainer.innerHTML = '';

        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-btn');
            button.addEventListener('click', () => selectAnswer(option, question.correct_answer));
            optionsContainer.appendChild(button);
        });

        nextBtn.classList.add('hidden');
    }

    // Select answer
    function selectAnswer(selectedAnswer, correctAnswer) {
        clearInterval(timer);
        const isCorrect = selectedAnswer === correctAnswer;
        const optionButtons = document.querySelectorAll('.option-btn');

        // Disable all buttons and show correct/incorrect
        optionButtons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
            
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            } else if (button.textContent === selectedAnswer && !isCorrect) {
                button.classList.add('incorrect');
            }
        });

        // Update score
        if (isCorrect) {
            score++;
            scoreElement.textContent = score;
        }

        nextBtn.classList.remove('hidden');
    }

    // Show next question
    function showNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
            nextBtn.classList.add('hidden');
        } else {
            endQuiz();
        }
    }

    // End quiz
    function endQuiz() {
        clearInterval(timer);
        quizDuration = Math.floor((new Date() - quizStartTime) / 1000);
        
        quizScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        
        // Update results
        finalScoreElement.textContent = score;
        maxScoreElement.textContent = questions.length;
        correctAnswersElement.textContent = score;
        timeTakenElement.textContent = quizDuration;
    }

    // Restart the same quiz
    function restartQuiz() {
        resultsScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        currentQuestionIndex = 0;
        score = 0;
        scoreElement.textContent = score;
        showQuestion();
        quizStartTime = new Date();
    }

    // Start a new quiz
    function newQuiz() {
        resultsScreen.classList.add('hidden');
        setupScreen.classList.remove('hidden');
    }

    // Timer functions
    function startTimer() {
        timeLeft = 30;
        timerElement.textContent = timeLeft;
        timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                autoSelectAnswer();
            }
        }, 1000);
    }

    function resetTimer() {
        clearInterval(timer);
        timeLeft = 30;
        timerElement.textContent = timeLeft;
    }

    function autoSelectAnswer() {
        const optionButtons = document.querySelectorAll('.option-btn');
        const unansweredButtons = Array.from(optionButtons).filter(
            btn => !btn.disabled
        );
        
        if (unansweredButtons.length > 0) {
            unansweredButtons[0].click();
        }
    }
});