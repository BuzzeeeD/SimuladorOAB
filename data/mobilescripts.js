let countdown; // Variável global para controle do cronômetro
let duration = 5 * 60 * 60; // Tempo inicial configurado (em segundos) - 5 horas
let timeRemaining = duration; // Tempo restante

document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('#layout-container');
   
// Função para iniciar o cronômetro
function startCountdown(durationInput) {
    duration = durationInput;
    timeRemaining = duration;

    const timeLeftSpan = document.getElementById('time-left');
    const timerDiv = document.getElementById('timer');
    timerDiv.style.display = 'block';

    if (countdown) {
        clearInterval(countdown);
    }

    countdown = setInterval(function() {
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;

        timeLeftSpan.textContent = `${hours}h ${minutes}m ${seconds}s`;

        if (timeRemaining <= 0) {
            clearInterval(countdown);
            timeLeftSpan.textContent = 'Tempo esgotado!';
            alert('O tempo da prova se esgotou.');
        }

        timeRemaining--;
    }, 1000);
}

    // Função para carregar as questões do Excel
    function loadExcelFile(examNumber, callback) {
        const filePath = `data/Provas/dados/${examNumber}OAB.xlsx`;

        fetch(filePath).then(response => response.arrayBuffer()).then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            callback(jsonData);
        });
    }

// Função para exibir as questões no layout
function displayQuestions(questions) {
    const container = document.querySelector('#layout-container');
    container.innerHTML = '';

    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');

        const questionText = document.createElement('p');
        questionText.textContent = `${index + 1}. ${question.Questão}`; // Texto da questão
        questionDiv.appendChild(questionText);

        const answerContainer = document.createElement('div');
        answerContainer.classList.add('answer-container');

        // Criar as opções de resposta com formato "Letra + )"
        ['A', 'B', 'C', 'D'].forEach(option => {
            const optionLabel = document.createElement('label');
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = `question${index + 1}`; // Agrupar os radio buttons por questão
            radioInput.value = option; // Atribui valor A, B, C ou D ao radio button
        
            // Texto do label no formato "A)", "B)", etc.
            optionLabel.appendChild(radioInput);
            optionLabel.appendChild(document.createTextNode(`${option}) ${question[`Alternativa (${option})`]}`)); // Texto da alternativa com letra
            answerContainer.appendChild(optionLabel);
        });

        questionDiv.appendChild(answerContainer);
        container.appendChild(questionDiv);
    });
}

      
    // Exibir o popup de confirmação de início de prova
    document.getElementById('examSelect').addEventListener('change', function() {
        const selectedExam = this.value;
        if (selectedExam === "") return;

        const popup = document.createElement('div');
        popup.classList.add('popup-overlay');

        popup.innerHTML = `
            <div class="popup-box">
                <p>Você selecionou o ${selectedExam}º Exame de Ordem Unificado. Deseja começar agora?</p>
                <button id="popup-confirm">Confirmar</button>
                <button id="popup-cancel">Cancelar</button>
            </div>
        `;

        document.body.appendChild(popup);

        document.getElementById('popup-confirm').addEventListener('click', function() {
            popup.remove();
            startCountdown(5 * 60 * 60); // Iniciar cronômetro
            loadExcelFile(selectedExam, displayQuestions);
        });

        document.getElementById('popup-cancel').addEventListener('click', function() {
            popup.remove();
            document.getElementById('examSelect').value = ""; // Redefinir a seleção
        });
    });
});
// Função para exibir o PDF em um popup
function showPDFPopup(pdfPath, title) {
    // Cria o overlay e o popup
    const popup = document.createElement('div');
    popup.classList.add('popup-overlay');
    
    popup.innerHTML = `
      <div class="popup-box large">
        <h2>${title}</h2>
        <iframe src="${pdfPath}" width="100%" height="500px"></iframe>
        <button id="popup-close">Fechar</button>
      </div>
    `;
    
    document.body.appendChild(popup);
  
    // Fechar o popup quando o botão for clicado
    document.getElementById('popup-close').addEventListener('click', function() {
      popup.remove();
    });
  }
  
  // Função para consultar o gabarito do exame selecionado
  document.getElementById('consultGabarito').addEventListener('click', function() {
    const selectedExam = document.getElementById('examSelect').value;
    if (selectedExam === "") {
      alert("Por favor, selecione um exame para consultar o gabarito.");
      return;
    }
    
    // Caminho para o PDF do gabarito
    const gabaritoPath = `data/Gabaritos/${selectedExam}.pdf`;
    
    // Exibir o PDF do gabarito em um popup
    showPDFPopup(gabaritoPath, `Gabarito do ${selectedExam}º Exame de Ordem Unificado`);
  });
  
  // Função para consultar o edital do exame selecionado
  document.getElementById('consultEdital').addEventListener('click', function() {
    const selectedExam = document.getElementById('examSelect').value;
    if (selectedExam === "") {
      alert("Por favor, selecione um exame para consultar o edital.");
      return;
    }
  
    // Caminho para o PDF do edital
    const editalPath = `data/Editais/${selectedExam}.pdf`;
  
    // Exibir o PDF do edital em um popup
    showPDFPopup(editalPath, `Edital do ${selectedExam}º Exame de Ordem Unificado`);
  });

// Função de validação e finalização da prova
document.getElementById('finalize-exam').addEventListener('click', function() {

    const selectedExam = document.getElementById('examSelect').value;

    // Validação de seleção do exame
    if (selectedExam === "") {
        alert("Por favor, selecione um exame para finalizar.");
        return;
    }

    console.log("Exame selecionado: " + selectedExam); // Debugging - Verificar se o exame foi selecionado

    // Exibir popup de confirmação antes de finalizar
    showConfirmationPopup(function() {
        clearInterval(countdown); // Pausar cronômetro
        const timeElapsed = duration - timeRemaining; // Tempo decorrido

        // Carregar o gabarito para calcular os resultados
        const gabaritoPath = `data/Gabaritos/${selectedExam}.xlsx`;

        fetch(gabaritoPath)
            .then(response => response.arrayBuffer())
            .then(data => {
                console.log("Gabarito carregado com sucesso"); // Debugging - Verificar se o gabarito foi carregado
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const gabaritoData = XLSX.utils.sheet_to_json(worksheet);

                // Calcular as estatísticas
                const statistics = calculateStatistics(gabaritoData);

                // Exibir resultados em um popup
                showResultsPopup(statistics, timeElapsed);
            })
            .catch(error => {
                console.error("Erro ao carregar o gabarito:", error);
            });
    });
});

// Função para exibir o popup de confirmação
function showConfirmationPopup(onConfirm) {
    const popup = document.createElement('div');
    popup.classList.add('popup-overlay');
    
    popup.innerHTML = `
      <div class="popup-box">
        <p>Deseja realmente finalizar a prova? O cronômetro será pausado e os resultados serão calculados.</p>
        <button id="confirm-finish">Confirmar</button>
        <button id="cancel-finish">Cancelar</button>
      </div>
    `;

    document.body.appendChild(popup);

    // Finalizar se o usuário confirmar
    document.getElementById('confirm-finish').addEventListener('click', function() {
        popup.remove(); // Remover o popup
        if (onConfirm) onConfirm(); // Executa o callback se confirmado
    });

    // Cancelar a finalização
    document.getElementById('cancel-finish').addEventListener('click', function() {
        popup.remove(); // Fechar o popup
    });
}

// Função para calcular as estatísticas
function calculateStatistics(gabarito) {
    const userAnswers = document.querySelectorAll('.answer-container input[type="radio"]:checked');
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;
    let disciplineStats = {};

    userAnswers.forEach((answer, index) => {
        const userAnswer = answer.value.trim().toUpperCase(); // Resposta selecionada pelo usuário
        const correctAnswer = gabarito[index]['Answer'].trim().toUpperCase(); // Resposta correta do gabarito


        // Comparar as respostas
        if (userAnswer === correctAnswer) {
            correctAnswers++;
        } else {
            wrongAnswers++;
        }
        // Atualizar estatísticas por disciplina
        const discipline = gabarito[index]['Disciplina'];
        if (!disciplineStats[discipline]) {
            disciplineStats[discipline] = { correct: 0, wrong: 0 };
        }
        if (userAnswer === correctAnswer) {
            disciplineStats[discipline].correct++;
        } else {
            disciplineStats[discipline].wrong++;
        }
    });

    // Calcular questões não respondidas
    const totalQuestions = gabarito.length;
    unanswered = totalQuestions - userAnswers.length;

    return {
        correctAnswers,
        wrongAnswers,
        unanswered,
        totalQuestions,
        disciplineStats,
        accuracy: ((correctAnswers / totalQuestions) * 100).toFixed(2) // Percentual de acerto
    };
}

// Função para exibir o popup de resultados
function showResultsPopup(stats, timeElapsed) {
    const totalAnswered = stats.correctAnswers + stats.wrongAnswers;
    const timeElapsedFormatted = formatTime(timeElapsed); // Função auxiliar para formatar tempo

    const popup = document.createElement('div');
    popup.classList.add('popup-overlay');

    let popupContent = `
        <div class="popup-box large">
            <h2>Resultados da Prova</h2>
            <p>Total de acertos: ${stats.correctAnswers}</p>
            <p>Total de erros: ${stats.wrongAnswers}</p>
            <p>Questões respondidas: ${totalAnswered} de ${stats.totalQuestions}</p>
            <p>Questões em branco: ${stats.unanswered}</p>
            <p>Percentual de acertos: ${stats.accuracy}%</p>
            <p>Tempo de prova: ${timeElapsedFormatted}</p>
            <h3>Estatísticas por Disciplina:</h3>
            <ul>
    `;

    for (const discipline in stats.disciplineStats) {
        const correct = stats.disciplineStats[discipline].correct;
        const wrong = stats.disciplineStats[discipline].wrong;
        popupContent += `<li>${discipline}: ${correct} acertos, ${wrong} erros</li>`;
    }

    // Verificar status de aprovação (exemplo: 50% de acertos é necessário para aprovação)
    const passingGrade = 50; // Defina a porcentagem necessária para aprovação
    const passStatus = stats.accuracy >= passingGrade ? 'Aprovado' : 'Reprovado';
    popupContent += `</ul>
            <h3>Status: ${passStatus}</h3>
            <button id="popup-close">Fechar</button>
        </div>
    `;

    popup.innerHTML = popupContent;
    document.body.appendChild(popup);

    // Fechar o popup e resetar o sistema
    document.getElementById('popup-close').addEventListener('click', function() {
        popup.remove();

        // Remover o conteúdo da prova ao fechar o popup
        const container = document.querySelector('#layout-container');
        container.innerHTML = ''; // Limpar as questões e opções da prova
        document.getElementById('timer').style.display = 'none'; // Ocultar o cronômetro
        resetSystem(); // Chamar função para resetar o sistema
    });
}

// Função auxiliar para formatar o tempo
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

// Função para resetar o sistema
function resetSystem() {
    document.getElementById('examSelect').value = ""; // Resetar o seletor de exame
    document.getElementById('time-left').textContent = ""; // Limpar o cronômetro
    clearInterval(countdown); // Limpar o cronômetro antes de reiniciar
    timeRemaining = duration; // Resetar o tempo restante
    const questionContainers = document.querySelectorAll('.answer-container input[type="radio"]:checked');
    questionContainers.forEach(input => input.checked = false); // Desmarcar todas as questões
}