document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('answer-sheet');
  let countdown; // Variável global para o cronômetro
  let duration = 5 * 60 * 60; // 5 horas em segundos (18000 segundos)
  let timeRemaining; // Variável global para o tempo restante
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  if (isIOS || isAndroid) {
    // Esconde o conteúdo principal da página
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; background-color: #f4f4f4;">
        <div style="padding: 20px; background-color: white; border: 2px solid #ccc; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); max-width: 400px;">
          <h1 style="color: #ff0000;">Atenção!</h1>
          <p style="font-size: 18px; color: #333;">Telefone não é ferramenta de estudo, procure um computador e venha estudar de verdade!</p>
        </div>
      </div>
    `;
    return; // Impede o carregamento do restante do código
  }
  //Tela Cheia
  document.getElementById('fullscreen-btn').addEventListener('click', function() {
    if (!document.fullscreenElement) {
      // Se não estiver em tela cheia, solicitar a tela cheia
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Erro ao tentar entrar em tela cheia: ${err.message} (${err.name})`);
      });
    } else {
      // Se já estiver em tela cheia, sair dela
      document.exitFullscreen();
    }
  });
// Função para limpar o cartão resposta
document.getElementById('clear-answer-sheet').addEventListener('click', function() {
  // Exibir um popup de confirmação
  showPopup('Deseja realmente limpar o cartão resposta?', function() {
    // Desmarcar todas as respostas
    const inputs = document.querySelectorAll('#answer-sheet input[type="radio"]');
    inputs.forEach(input => input.checked = false);
    
    // Reiniciar o cronômetro de 5 horas (18000 segundos)
    startCountdown(5 * 60 * 60);  // Reiniciar o cronômetro
  });
});
// Função que inicia o cronômetro regressivo
function startCountdown(durationInput) {
  duration = durationInput; // Define o tempo total da prova
  timeRemaining = duration; // Inicializa o tempo restante com a duração total
  const timeLeftSpan = document.getElementById('time-left');
  const timerDiv = document.getElementById('timer');
  
  timerDiv.style.display = 'block'; // Mostrar o cronômetro

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

// Função para ler o arquivo Excel e identificar questões anuladas
function loadExcelFile(examNumber, callback) {
  const filePath = `data/Gabaritos/${examNumber}.xlsx`;

  fetch(filePath).then(response => response.arrayBuffer()).then(data => {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0]; // Pega a primeira aba
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet); // Converte para JSON
      
      // Verifica quais questões estão anuladas
      const anuladas = jsonData
        .filter(row => row.Answer === 'Anulada') // Filtra apenas questões anuladas
        .map(row => row.Question); // Cria uma lista apenas com os números das questões


      // Chama a função de callback passando o JSON e a lista de anuladas
      callback(jsonData, anuladas);
  });
}

// Função para criar cada pergunta com opções, verificando as anuladas
function createQuestion(questionNumber, anuladas) {
  const questionDiv = document.createElement('div');
  questionDiv.classList.add('question');
  
  const questionLabel = document.createElement('label');
  questionLabel.textContent = `Questão ${questionNumber}: `;
  
  questionDiv.appendChild(questionLabel);
  
  if (anuladas.includes(questionNumber)) {
    // Se a questão está anulada, exibe "Anulada" e fundo amarelo
    const anuladaLabel = document.createElement('p');
    anuladaLabel.textContent = 'Anulada';
    anuladaLabel.style.backgroundColor = 'yellow';
    questionDiv.style.backgroundColor = 'yellow'; // Fundo amarelo no container da questão
    questionDiv.appendChild(anuladaLabel);
  } else {
    // Caso contrário, gera as opções de resposta
    ['A', 'B', 'C', 'D'].forEach(option => {
      const optionLabel = document.createElement('label');
      const radioInput = document.createElement('input');
      
      radioInput.type = 'radio';
      radioInput.name = `question${questionNumber}`;
      radioInput.value = option;
      
      optionLabel.appendChild(radioInput);
      optionLabel.appendChild(document.createTextNode(option));
      questionDiv.appendChild(optionLabel);
    });
  }
  
  form.appendChild(questionDiv);
}

// Função para gerar o cartão resposta, verificando as anuladas
function generateAnswerSheet(gabarito, anuladas) {
  form.innerHTML = ''; // Limpa o cartão anterior
  for (let i = 1; i <= 80; i++) {
      createQuestion(i, anuladas);
  }
}

// Função para calcular o número de acertos, erros, respondidas, em branco e percentual de acertos
function calculateResults(gabarito) {
  let totalAcertos = 0;
  let totalErros = 0;
  let totalRespondidas = 0;
  const acertosPorDisciplina = {};
  const errosPorDisciplina = {};

  for (let i = 1; i <= 80; i++) {
    const userAnswer = document.querySelector(`input[name="question${i}"]:checked`);
    const gabaritoQuestion = gabarito.find(row => row.Question === i);
    
    if (gabaritoQuestion && gabaritoQuestion.Answer !== 'Anulada') {
      if (userAnswer) {
        totalRespondidas++;
        const disciplina = gabaritoQuestion.Disciplina;

        if (userAnswer.value === gabaritoQuestion.Answer) {
          totalAcertos++;
          
          // Conta os acertos por disciplina
          if (!acertosPorDisciplina[disciplina]) {
            acertosPorDisciplina[disciplina] = 0;
          }
          acertosPorDisciplina[disciplina]++;
        } else {
          totalErros++;

          // Conta os erros por disciplina
          if (!errosPorDisciplina[disciplina]) {
            errosPorDisciplina[disciplina] = 0;
          }
          errosPorDisciplina[disciplina]++;
        }
      }
    }
  }

  // Calcula questões em branco e percentual de acertos
  const totalEmBranco = 80 - totalRespondidas;
  const percentualAcerto = ((totalAcertos / 80) * 100).toFixed(2); // Percentual de acerto formatado como string com 2 casas decimais

  return { 
    totalAcertos, 
    totalErros, 
    totalRespondidas, 
    totalEmBranco, 
    percentualAcerto, 
    acertosPorDisciplina, 
    errosPorDisciplina 
  };
}

  // Evento para a seleção do exame
  document.getElementById('examSelect').addEventListener('change', function() {
    const selectedExam = this.value;
  
    // Verificar se o usuário escolheu uma opção válida
    if (selectedExam === "") {
      return; // Não faz nada se for "Escolha o Exame"
    }
  
    // Exibir pop-up estilizado ao invés de confirm nativo
    showPopup(`Você selecionou o ${selectedExam}º Exame de Ordem Unificado. A prova terá duração de 5 horas. Deseja começar agora?`, function() {
      // Iniciar o cronômetro de 5 horas (18000 segundos)
      startCountdown(5 * 60 * 60); // 5 horas em segundos
      
      // Caminho base dos PDFs
      const basePath = 'data/Provas/';
      
      // Monta o caminho completo para o PDF
      const pdfPath = `${basePath}${selectedExam}.pdf`;
      
      // Seleciona o iframe e atualiza o src
      document.getElementById('pdf-frame').src = pdfPath;
  
      // Carrega o gabarito do exame e gera o cartão resposta, incluindo anuladas
      loadExcelFile(selectedExam, generateAnswerSheet);
    }, function() {
      // Callback ao cancelar o popup: redefine o examSelect para a opção inicial
      document.getElementById('examSelect').value = ""; // Retorna para a opção "Escolha o Exame"
    });
  });

// Evento para finalizar a prova e calcular os resultados
document.getElementById('finalize-exam').addEventListener('click', function() {
  const selectedExam = document.getElementById('examSelect').value;
  
  if (!selectedExam) {
    alert("Por favor, selecione um exame.");
    return;
  }

  // Mostrar popup de confirmação
  showConfirmationPopup(function() {
    // Executa essa função se o usuário confirmar que deseja finalizar a prova
    if (countdown) {
      clearInterval(countdown); // Pausar o cronômetro
    }
    
    const timeElapsed = duration - timeRemaining; // Calcula o tempo decorrido

    loadExcelFile(selectedExam, function(gabarito) {
      const resultados = calculateResults(gabarito);
      
      showResultsPopup(
        resultados.totalAcertos, 
        resultados.totalErros, 
        resultados.totalRespondidas,
        resultados.totalEmBranco,
        resultados.percentualAcerto,
        resultados.acertosPorDisciplina, 
        resultados.errosPorDisciplina,
        formatTimeElapsed(timeElapsed) // Exibe o tempo de prova decorrido
      );
    });
  });
});

function resetAnswerSheet() {
  const questionDivs = document.querySelectorAll('#answer-sheet .question');
  questionDivs.forEach(div => div.remove()); // Remove todas as divs de questões
}

function resetPDFViewer() {
  const pdfFrame = document.getElementById('pdf-frame');
  pdfFrame.src = ""; // Reseta o iframe para uma página em branco
}

function resetTimer() {
  const timerDiv = document.getElementById('timer');
  timerDiv.style.display = 'none'; // Esconde o cronômetro
  if (countdown) {
    clearInterval(countdown); // Cancela o cronômetro
  }
  document.getElementById('time-left').textContent = ''; // Limpa o tempo restante
}

function formatTimeElapsed(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function showResultsPopup(totalAcertos, totalErros, totalRespondidas, totalEmBranco, percentualAcerto, acertosPorDisciplina, errosPorDisciplina, timeElapsed) {
  const resultadoFinal = totalAcertos >= 40 ? "APROVADO" : "REPROVADO";
  
  const popup = document.createElement('div');
  popup.classList.add('popup-overlay');
  
  popup.innerHTML = `
    <div class="popup-box large">
      <h2>Resultados da Prova - <span class="${resultadoFinal === 'APROVADO' ? 'aprovado' : 'reprovado'}">${resultadoFinal}</span></h2>
      
      <div class="result-container">
        <div class="result-section">
          <h3>Resultado da Prova</h3>
          <p>Total de acertos: <strong>${totalAcertos}</strong> / 80</p>
          <p>Total de erros: <strong>${totalErros}</strong> / 80</p>
          <p>Questões respondidas: <strong>${totalRespondidas}</strong></p>
          <p>Questões em branco: <strong>${totalEmBranco}</strong></p>
          <p>Percentual de acerto: <strong>${percentualAcerto}%</strong></p>
          <p>Tempo de prova: <strong>${timeElapsed}</strong></p> <!-- Exibe o tempo decorrido -->
        </div>

        <!-- Seções de acertos e erros por disciplina -->
        <div class="result-section">
          <h3>Acertos por Disciplina</h3>
          <ul>
            ${Object.keys(acertosPorDisciplina).map(disciplina => 
              `<li>${disciplina}: ${acertosPorDisciplina[disciplina]} </li>`).join('')}
          </ul>
        </div>
        <div class="result-section">
          <h3>Erros por Disciplina</h3>
          <ul>
            ${Object.keys(errosPorDisciplina).map(disciplina => 
              `<li>${disciplina}: ${errosPorDisciplina[disciplina]} </li>`).join('')}
          </ul>
        </div>
      </div>
      
      <button id="popup-close">Fechar</button>
    </div>
  `;
  
  document.body.appendChild(popup);

  document.getElementById('popup-close').addEventListener('click', function() {
    popup.remove();
    resetPDFViewer(); // Resetar o PDF viewer
    resetTimer(); // Desativar o cronômetro
    resetAnswerSheet(); // Reiniciar o Cartão Resposta
    document.getElementById('examSelect').value = ""; // Retorna para a opção "Escolha o Exame"
  });
}


  // Função genérica para exibir um pop-up estilizado
  function showPopup(message, onConfirm, onCancel) {
    const popup = document.createElement('div');
    popup.classList.add('popup-overlay');
    
    popup.innerHTML = `
      <div class="popup-box">
        <p>${message}</p>
        <button id="popup-confirm">Confirmar</button>
        <button id="popup-cancel">Cancelar</button>
      </div>
    `;
    
    document.body.appendChild(popup);
  
    document.getElementById('popup-confirm').addEventListener('click', function() {
      popup.remove(); // Remove o pop-up
      if (onConfirm) onConfirm(); // Executa a função de confirmação, se fornecida
    });
  
    document.getElementById('popup-cancel').addEventListener('click', function() {
      popup.remove(); // Apenas remove o pop-up
      if (onCancel) onCancel(); // Executa a função de cancelamento, se fornecida
    });
  }
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
function showConfirmationPopup(onConfirm) {
  const popup = document.createElement('div');
  popup.classList.add('popup-overlay');
  
  popup.innerHTML = `
    <div class="popup-box">
      <p>Ao finalizar, você não poderá retomar a prova. Deseja continuar?</p>
      <button id="confirm-finish">Confirmar</button>
      <button id="cancel-finish">Cancelar</button>
    </div>
  `;
  
  document.body.appendChild(popup);

  document.getElementById('confirm-finish').addEventListener('click', function() {
    popup.remove(); // Remove o popup de confirmação
    if (onConfirm) onConfirm(); // Chama a função de callback para confirmar a finalização
  });

  document.getElementById('cancel-finish').addEventListener('click', function() {
    popup.remove(); // Fecha o popup e não faz mais nada, permitindo que o usuário continue a prova
  });
}
