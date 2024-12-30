const cardsData = [
    { id: 1, question: "A capital da França é Paris?", answer: true, explanation: "Paris é a capital da França." },
    { id: 2, question: "O Sol gira em torno da Terra?", answer: false, explanation: "A Terra gira em torno do Sol." },
    { id: 3, question: "A fórmula química da água é H2O?", answer: true, explanation: "H2O é a fórmula correta da água." },
  ];
  
  let currentIndex = 0;
  let score = 0;
  let answered = 0;
  let correct = 0;
  let wrong = 0;
  let isMoving = false;
  
  const cardContainer = document.getElementById("card-container");
  const scoreElement = document.getElementById("score");
  const answeredElement = document.getElementById("answered");
  const correctElement = document.getElementById("correct");
  const wrongElement = document.getElementById("wrong");
  const progressElement = document.getElementById("progress");
  
  /**
   * Cria um cartão e adiciona ao container.
   * Inclui toda a lógica de arraste e descarte do cartão.
   */
  function createCard(questionData) {
    const card = document.createElement("div");
    card.className = "flashcards-card";
    card.innerHTML = `<p>${questionData.question}</p>`;
    cardContainer.appendChild(card);
  
    // Variáveis de arraste
    let startX = 0;
    let offsetX = 0;
    let isDragging = false;
  
    // Percentual para deslizar
    const threshold = card.offsetWidth * 0.2; // 20% da largura
  
    // EVENTOS
    function onMouseDown(e) {
      if (isMoving) return; // Evita interação caso ainda esteja em transição
      isDragging = true;
      startX = e.clientX;
      card.style.transition = "none"; // Desativa animações enquanto arrasta
    }
  
    function onMouseMove(e) {
      if (!isDragging) return;
      offsetX = e.clientX - startX;
      card.style.transform = `translateX(${offsetX}px) rotate(${offsetX / 20}deg)`;
  
      if (offsetX > 0) {
        // Arrastando para a direita -> verde
        card.style.backgroundColor = `rgba(40, 167, 69, ${Math.min(offsetX / threshold, 1)})`;
      } else {
        // Arrastando para a esquerda -> vermelho
        card.style.backgroundColor = `rgba(220, 53, 69, ${Math.min(-offsetX / threshold, 1)})`;
      }
    }
  
    function onMouseUp() {
      if (!isDragging) return;
      isDragging = false;
  
      if (Math.abs(offsetX) > threshold) {
        // Determina se foi arrastado para a direita ou esquerda
        const direction = offsetX > 0 ? "right" : "left";
        processAnswer(direction, card, questionData.answer);
      } else {
        // Reseta o cartão se arraste insuficiente
        resetCard(card);
      }
    }
  
    // Lógica de reiniciar o cartão
    function resetCard(card) {
      card.style.transition = "transform 0.3s ease, background-color 0.3s ease";
      card.style.transform = "translateX(0) rotate(0)";
      card.style.backgroundColor = "white";
    }
  
    // Adiciona listeners ao PRÓPRIO cartão
    card.addEventListener("mousedown", onMouseDown);
    card.addEventListener("mousemove", onMouseMove);
    card.addEventListener("mouseup", onMouseUp);
  
    // Touch Events (para mobile)
    card.addEventListener("touchstart", (e) => {
      if (isMoving) return;
      isDragging = true;
      startX = e.touches[0].clientX;
      card.style.transition = "none";
    });
  
    card.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      offsetX = e.touches[0].clientX - startX;
      card.style.transform = `translateX(${offsetX}px) rotate(${offsetX / 20}deg)`;
  
      if (offsetX > 0) {
        card.style.backgroundColor = `rgba(40, 167, 69, ${Math.min(offsetX / threshold, 1)})`;
      } else {
        card.style.backgroundColor = `rgba(220, 53, 69, ${Math.min(-offsetX / threshold, 1)})`;
      }
    });
  
    card.addEventListener("touchend", () => {
      if (!isDragging) return;
      isDragging = false;
  
      if (Math.abs(offsetX) > threshold) {
        const direction = offsetX > 0 ? "right" : "left";
        processAnswer(direction, card, questionData.answer);
      } else {
        resetCard(card);
      }
    });
  }
  
  /**
   * Processa a resposta com base na direção.
   * Remove o cartão atual e carrega o próximo.
   */
  function processAnswer(direction, card, correctAnswer) {
    isMoving = true; // Bloqueia interações durante a animação
    const userIsCorrect =
      (direction === "right" && correctAnswer) ||
      (direction === "left" && !correctAnswer);
  
    updateStats(userIsCorrect);
  
    // Anima o cartão para fora
    const translateX = direction === "right" ? "200%" : "-200%";
    const rotateVal = direction === "right" ? "30deg" : "-30deg";
    card.style.transition = "transform 0.5s ease, opacity 0.5s ease";
    card.style.transform = `translateX(${translateX}) rotate(${rotateVal})`;
    card.style.opacity = "0";
  
    setTimeout(() => {
      card.remove();
      isMoving = false;
      loadNextCard();
    }, 500);
  }
  
  /**
   * Atualiza dados de pontuação e progresso.
   */
  function updateStats(isCorrect) {
    answered++;
    if (isCorrect) {
      correct++;
      score++;
    } else {
      wrong++;
      score--;
    }
    scoreElement.textContent = score;
    answeredElement.textContent = answered;
    correctElement.textContent = correct;
    wrongElement.textContent = wrong;
    progressElement.style.width = `${(answered / cardsData.length) * 100}%`;
  }
  
  /**
   * Carrega o próximo card ou finaliza.
   */
  function loadNextCard() {
    if (currentIndex >= cardsData.length - 1) {
      alert("Fim dos FlashCards!");
      return;
    }
    currentIndex++;
    createCard(cardsData[currentIndex]);
  }
  
  /**
   * Inicializa o primeiro cartão.
   */
  createCard(cardsData[currentIndex]);
  