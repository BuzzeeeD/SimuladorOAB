document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header'); // Seleciona o header  
    const examSelect = document.getElementById('examSelect');
    const questionNavigator = document.getElementById('question-navigator');
    const layoutContainer = document.getElementById('layout-container');
    const countdownTimer = document.getElementById('countdown-timer'); // Referência ao cronômetro
    const gabaritoBtn = document.getElementById('gabarito-btn'); // Botão Gabarito
    const finalizarProvaBtn = document.getElementById('finalizar-prova-btn'); // Botão Finalizar Prova
    const popupGabarito = document.createElement('div'); // Criar o popup dinamicamente
    countdownTimer.style.display = "none";
    gabaritoBtn.style.display = 'none';
    finalizarProvaBtn.style.display = 'none';
    questionNavigator.style.display = 'none'; 
    popupGabarito.id = 'popup-gabarito';
    document.body.appendChild(popupGabarito); // Adicionar o popup ao body
    displayDescriptionContainer(); // Exibir a descrição inicialmente
    let examsData = {};  // Para armazenar os dados de cada exame
    let selectedAnswers = {}; // Para armazenar as respostas do usuário
    let countdownInterval; // Variável para armazenar o intervalo do cronômetro

    window.addEventListener('scroll', function() {
        const headerBottom = header.offsetTop + header.offsetHeight; // Calcula o limite inferior do header
        const scrollPosition = window.scrollY; // Posição atual do scroll

        // Oculta o question-navigator quando ele ultrapassa a linha inferior do header
        if (scrollPosition > headerBottom) {
            questionNavigator.style.display = 'flex'; // Oculta o question-navigator
        } else {
            questionNavigator.style.display = 'none'; // Exibe o question-navigator
        }
    });

    // Navegar até a questão com base no número inserido pelo usuário
document.getElementById('go-to-question-btn').addEventListener('click', function() {
    const questionNumber = document.getElementById('question-number').value;  // Valor digitado pelo usuário
    
    // Selecionar a questão pela ID secundária (data-navigation-id)
    const questionElement = document.querySelector(`[data-navigation-id="${questionNumber}"]`);
    
    if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth' });  // Rolagem suave até a questão
    } else {
        alert('Questão não encontrada!');
    }
});

// Atualiza o campo de número da questão ao rolar a página
window.addEventListener('scroll', function() {
    let questions = document.querySelectorAll('.question');
    let currentQuestionNumber = null;

    questions.forEach((question) => {
        const rect = question.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
            currentQuestionNumber = question.getAttribute('data-navigation-id');  // Pegue o valor do data-navigation-id
        }
    });

    if (currentQuestionNumber) {
        document.getElementById('question-number').value = currentQuestionNumber;  // Atualiza o número da questão visível
    }
});
    // Função para iniciar o cronômetro
    function startCountdown(duration) {
        let timer = duration, hours, minutes, seconds;
        clearInterval(countdownInterval); // Limpa qualquer cronômetro anterior

        countdownInterval = setInterval(function () {
            hours = Math.floor(timer / 3600);          // Calcula horas
            minutes = Math.floor((timer % 3600) / 60); // Calcula minutos
            seconds = timer % 60;                      // Calcula segundos

            // Adiciona zero à esquerda para manter o formato hh:mm:ss
            hours = hours < 10 ? '0' + hours : hours;
            minutes = minutes < 10 ? '0' + minutes : minutes;
            seconds = seconds < 10 ? '0' + seconds : seconds;

            countdownTimer.textContent = `${hours}:${minutes}:${seconds}`;
            
            // Verifica se o "Escolha o Exame" foi selecionado para esconder o cronômetro
            if (examSelect.value === "Escolha o Exame") {
                countdownTimer.style.display = 'none'; // Oculta o cronômetro
                clearInterval(countdownInterval); // Para o cronômetro
            }
            
            if (--timer < 0) {
                clearInterval(countdownInterval); // Para o cronômetro ao término
                countdownTimer.textContent = "Tempo esgotado!";
            }
        }, 1000);
    }

    // Função para carregar a planilha ao abrir a página
    function loadExcel() {
        fetch('data/dados/OAB/dataoab.xlsx')
            .then(response => response.arrayBuffer())
            .then(data => {
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Iterar sobre as folhas (Exames 30 ao 41)
                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                    // Extrair o número do exame (30 ao 41)
                    const examNumber = sheetName.match(/\d+/)[0];
                    examsData[examNumber] = jsonData;  // Armazenar os dados da planilha
                });

                // Calcular o número total de questões
                let totalQuestionsAll = 0;
                for (let i = 20; i <= 41; i++) {
                    if (examsData[i] && examsData[i].length > 1) {
                        totalQuestionsAll += examsData[i].length - 1; // Descontar o cabeçalho
                    }
                }

                // Exibir o número total de questões na descrição
                displayDescriptionContainer(totalQuestionsAll);

                // Preencher o seletor de exames após o carregamento
                populateExamSelect();  
            })
            .catch(error => console.error('Erro ao carregar a planilha:', error));
    }

// Preencher o seletor de exames
function populateExamSelect() {
    const examSelect = document.getElementById('examSelect');
    examSelect.innerHTML = '';  // Limpar o seletor antes de preenchê-lo

    let totalQuestionsExams = 0;  // Variável para contar o total de questões de exames (30 a 41)
    let totalQuestionsAll = 0;  // Variável para contar o total de questões de todas as folhas (20 a 41)
    let examList = [];  // Criar um array para armazenar os exames com seus anos
    
    // Iterar pelos exames e contar as questões de todas as folhas (20 a 41)
    for (let i = 20; i <= 41; i++) {
        if (examsData[i] && examsData[i][1] && examsData[i][1][5]) {
            const questionCount = examsData[i].length - 1; // Contar o número de questões, descontando o cabeçalho
            totalQuestionsAll += questionCount;  // Somar ao total de todas as questões
            if (i >= 30 && i <= 41) {
                totalQuestionsExams += questionCount;  // Somar ao total de questões para exames (30 a 41)
                const examYear = examsData[i][1][5]; // Acessar o ano na coluna 5
                examList.push({ examNumber: i, year: examYear, questionCount }); // Adicionar o número de questões por exame
            }
        }
    }

    // Adicionar a opção "Escolha o Exame" com o total de questões de exames 30 a 41
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = `Escolha o Exame (${totalQuestionsExams} questões)`;
    examSelect.appendChild(defaultOption);  // Adicionar ao seletor

    // Adicionar a opção "Questões por Matéria" com o total de questões de todas as folhas 20 a 41
    const materiaOption = document.createElement('option');
    materiaOption.value = "filtro";
    materiaOption.textContent = `Questões por Matéria (${totalQuestionsAll} questões)`; // Adicionar o número total de questões
    examSelect.appendChild(materiaOption);  // Adicionar ao seletor

    // Ordenar a lista de exames em ordem Decrescente pelo número do exame
    examList.sort((a, b) => b.examNumber - a.examNumber);

    // Preencher o seletor com os exames ordenados e o número de questões
    examList.forEach(exam => {
        const option = document.createElement('option');
        option.value = exam.examNumber;
        option.textContent = `${exam.examNumber}º Exame de Ordem - ${exam.year} (${exam.questionCount} questões)`;
        examSelect.appendChild(option);
    });

    // Aplicar fadeIn ao seletor após ele ser preenchido
    $('#examSelect').fadeIn(100);
}

// Exemplo de chamada para preencher a lista de exames
$(document).ready(function() {
    populateExamSelect();
});

    // Exibir questões ao selecionar um exame e iniciar cronômetro
    examSelect.addEventListener('change', function() {
        const selectedExam = this.value;

        if (selectedExam === "Escolha o Exame" || !selectedExam) {
            // Ocultar o cronômetro e resetar o texto dele
            countdownTimer.style.display = 'none'; 
            countdownTimer.textContent = "05:00:00"; // Resetar o tempo
            displayDescriptionContainer(); // Exibir a descrição se "Escolha o Exame" for selecionado
            clearInterval(countdownInterval); // Parar o cronômetro
        } else {
            // Limpar o container e exibir questões se um exame válido for selecionado
            layoutContainer.innerHTML = ''; 
            displayQuestions(selectedExam);
            countdownTimer.style.display = 'block'; // Mostrar o cronômetro
            startCountdown(5 * 60 * 60);  // Iniciar o cronômetro de 5 horas
        }
    });

   // Função para exibir as questões e capturar as respostas
   function displayQuestions(examNumber) {
    // Verificar se o usuário selecionou o filtro de disciplina
    if (examNumber === "filtro") {
        //console.log('Exibindo questões por disciplina...');
        populateDisciplinaSelect(); // Exibe o seletor de disciplinas
        return; // Sai da função sem tentar acessar examsData
    }

    // Verificar se o exame existe em examsData
    if (!examsData[examNumber]) {
        console.error(`Exame ${examNumber} não encontrado em examsData.`);
        return; // Sai da função se os dados não forem encontrados
    }

    layoutContainer.innerHTML = '';  // Limpar o container antes de exibir as questões
    const questions = examsData[examNumber];
    selectedAnswers = {};  // Resetar as respostas selecionadas pelo usuário
    let navigationCounter = 1;  // Inicializar o contador de navegação secundária

    questions.forEach((row, index) => {
        if (index === 0) return;  // Ignorar o cabeçalho

        // Criar o container da questão
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');
        questionDiv.id = `question-${examNumber}-${index}`; // ID exclusivo da questão (gabarito)

        // Atribuir uma ID secundária para navegação
        questionDiv.setAttribute('data-navigation-id', navigationCounter);  // ID para navegação

        // Verificar se a questão foi anulada
        let anulada = row[15] && row[15].toLowerCase() === "anulada";

        if (anulada) {
            questionDiv.style.backgroundColor = 'rgba(255, 248, 179, 0.8)'; // Amarelo suave para anulada
        }

        // Cabeçalho da questão
        const questionHeader = document.createElement('div');
        questionHeader.classList.add('small-text');
        questionHeader.innerHTML = `<strong style="font-size: 1.25em;">${navigationCounter})</strong> ${row[8]} / ${row[6]} / ${row[7]} / ${row[4]}`;
        questionDiv.appendChild(questionHeader);

        // Texto do Enunciado
        const questionText = document.createElement('p');
        questionText.style.marginLeft = "10px"; 
        questionText.innerHTML = `${row[9]}`;
        questionDiv.appendChild(questionText);

        const answerContainer = document.createElement('div');
        answerContainer.classList.add('answer-container');

        ['A', 'B', 'C', 'D', 'E'].forEach((letter, i) => {
            const alternativeText = row[i + 10];
            if (alternativeText) {
                // Criar o container que envolve a tesoura e a alternativa
                const optionContainer = document.createElement('div');
                optionContainer.classList.add('icon-container');

                // Adicionar o ícone da tesoura
                const scissorsIcon = document.createElement('div');
                scissorsIcon.classList.add('icon');

                // Verifica se a questão foi anulada
                if (!anulada) {
                    scissorsIcon.addEventListener('click', () => {
                        const label = optionContainer.querySelector('label');
                        const radioInput = label.querySelector('input');
                        const optionText = label.querySelector('span');

                        if (radioInput.checked) {
                            radioInput.checked = false;
                            delete selectedAnswers[`question${index}`];
                        }

                        if (radioInput.disabled) {
                            radioInput.disabled = false;
                            optionText.classList.remove('striked');
                        } else {
                            radioInput.disabled = true;
                            optionText.classList.add('striked');
                        }
                    });
                } else {
                    scissorsIcon.style.opacity = 0.5; 
                    scissorsIcon.style.cursor = 'not-allowed';
                }

                const optionLabel = document.createElement('label');
                optionLabel.style.display = 'block';

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = `question${index}`;
                radioInput.value = letter;

                if (anulada) radioInput.disabled = true;

                const optionText = document.createElement('span');
                optionText.textContent = `${letter}) ${alternativeText}`;

                radioInput.addEventListener('click', () => {
                    const questionKey = `question${examNumber}-${index}`;
                    if (radioInput.checked && selectedAnswers[questionKey] === letter) {
                        radioInput.checked = false;
                        delete selectedAnswers[questionKey];
                    } else {
                        selectedAnswers[questionKey] = letter;
                    }
                    //console.log("Respostas capturadas até agora:", selectedAnswers); // Verificar as respostas armazenadas
                });

                optionLabel.appendChild(radioInput);
                optionLabel.appendChild(optionText);
                optionContainer.appendChild(scissorsIcon);
                optionContainer.appendChild(optionLabel);
                answerContainer.appendChild(optionContainer);
            }
        });

        questionDiv.appendChild(answerContainer);
        layoutContainer.appendChild(questionDiv);
        navigationCounter++;  // Incrementa o contador de navegação
    });
}

// Função para ir ao topo da página
document.getElementById('scroll-top-btn').addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Função para ir ao final da página
document.getElementById('scroll-bottom-btn').addEventListener('click', function() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
});

gabaritoBtn.addEventListener('click', function() {
    // Limpar e criar o conteúdo do popup
    popupGabarito.innerHTML = '<button id="close-popup">Fechar</button>';
    const popupContent = document.createElement('div');
    popupContent.classList.add('popup-content');

    const userTitle = document.createElement('h3');
    userTitle.textContent = "Alternativas Marcadas - Gabarito";
    popupContent.appendChild(userTitle);

    const displayedQuestions = document.querySelectorAll('.question'); // Seleciona todas as questões visíveis
    //console.log("displayedQuestions:", displayedQuestions);  // Verifica quantas questões visíveis foram encontradas

    displayedQuestions.forEach(questionDiv => {
        // Depurando o ID da questão
        //console.log("Processando questão com ID:", questionDiv.id);

        const idParts = questionDiv.id.split('-');
        const examNumber = idParts[1];  // Número do exame
        const questionIndex = idParts[2];  // Índice da questão

        // Verificando se os valores de examNumber e questionIndex foram corretamente extraídos
        //console.log(`ExamNumber: ${examNumber}, QuestionIndex: ${questionIndex}`);

        // Acessa os dados da questão
        const row = examsData[examNumber][questionIndex];
       // console.log("Dados da questão (row):", row);  // Verifica se os dados da questão estão corretos

        const gabaritoRow = document.createElement('p');
        const respostaCerta = row[15];  // Coluna "Resposta Certa"
        const questionID = row[1];
        const respostaUsuario = selectedAnswers[`question${examNumber}-${questionIndex}`] || "Não respondida";


        // Verificando as respostas
        //console.log(`Resposta correta: ${respostaCerta}, Resposta do usuário: ${respostaUsuario}, QuestionID: ${questionID}`);

        // Verificar se a questão foi anulada
        if (respostaCerta && respostaCerta.toLowerCase() === "anulada") {
            gabaritoRow.innerHTML = `<span class="gabarito-question" data-question-id="question-${examNumber}-${questionIndex}"> ${questionID} - Resp: (${respostaUsuario}) || Gab: (${respostaCerta})</span>`;
            gabaritoRow.style.backgroundColor = "rgba(255, 248, 179, 0.8)"; // Amarelo suave
            gabaritoRow.style.color = "#000000"; // Texto preto para contraste
        } else {
            // Exibir a resposta marcada pelo usuário e o gabarito, se a questão não for anulada
            gabaritoRow.innerHTML = `<span class="gabarito-question" data-question-id="question-${examNumber}-${questionIndex}"> ${questionID} - Resp: (${respostaUsuario}) || Gab: (${respostaCerta})</span>`;
           
            if (respostaUsuario === "Não respondida") {
                gabaritoRow.style.backgroundColor = "#f3f3f3"; // Cinza claro para "Não respondida"
                gabaritoRow.style.color = "#000000";
                //console.log(`Questão ${questionID} não respondida.`);
            } else if (respostaUsuario === respostaCerta) {
                gabaritoRow.style.backgroundColor = "rgba(0, 200, 0, 0.5)"; // Verde suave para correta
                gabaritoRow.style.color = "#000000"; // Texto preto para contraste
                //console.log(`Questão ${questionID} correta.`);
            } else {
                gabaritoRow.style.backgroundColor = "rgba(255, 69, 0, 0.5)"; // Vermelho suave para errada
                gabaritoRow.style.color = "#000000"; // Texto preto para contraste
                //console.log(`Questão ${questionID} errada.`);
            }
        }

        // Adicionar evento de clique para rolar até a questão correspondente
        gabaritoRow.querySelector('span').addEventListener('click', function() {
            const questionElement = document.getElementById(this.getAttribute('data-question-id'));
            if (questionElement) {
                //console.log(`Rolando até a questão: ${this.getAttribute('data-question-id')}`);
                questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                popupGabarito.style.display = 'none';
            }
        });

        popupContent.appendChild(gabaritoRow);
    });

    popupGabarito.appendChild(popupContent);
    $(popupGabarito).fadeIn(100);
    popupGabarito.style.display = 'block';

    // Fechar o popup ao clicar no botão de fechar
    document.getElementById('close-popup').addEventListener('click', function() {
        $(popupGabarito).fadeOut(200);
    });

    // Função para fechar o popup ao clicar fora dele
    function closePopupOnClickOutside(event) {
        if (!popupGabarito.contains(event.target) && event.target !== gabaritoBtn) {
            //console.log("Fechando o popup ao clicar fora.");
            $(popupGabarito).fadeOut(200);
            document.removeEventListener('click', closePopupOnClickOutside);
        }
    }

    // Adicionar o evento para fechar ao clicar fora do popup
    setTimeout(() => {
        document.addEventListener('click', closePopupOnClickOutside);
    }, 100);  // Timeout para garantir que o evento de clique seja ativado após abrir o popup
});



    // Função "Finalizar a Prova" com estatísticas
finalizarProvaBtn.addEventListener('click', function() {
    clearInterval(countdownInterval);  // Pausar o cronômetro

    // Criar o popup de estatísticas
    const popupEstatisticas = document.createElement('div');
    popupEstatisticas.id = 'popup-estatisticas';

    // Criar o conteúdo do popup
    const popupContent = document.createElement('div');
    popupContent.classList.add('popup-content');

    // Container 1: Título até Questões Certas e Erradas
    const container1 = document.createElement('div');
    container1.classList.add('container-contraste');

    // Título e introdução
    const titulo = document.createElement('h2');
    titulo.textContent = "Parabéns! Prova Finalizada!";
    container1.appendChild(titulo);

    // Obter o tempo decorrido de prova (baseado no cronômetro)
    const tempoDecorrido = document.createElement('div');
    tempoDecorrido.classList.add('estatistica-item');
    tempoDecorrido.innerHTML = `<strong>Tempo decorrido de Prova:</strong> ${countdownTimer.textContent}`;
    container1.appendChild(tempoDecorrido);

    // Contar as questões certas, erradas e anuladas
let questoesCertas = 0;
let questoesErradas = 0;
let questoesAnuladas = 0;

examsData[examSelect.value].forEach((row, index) => {
    if (index > 0) {  // Ignorar o cabeçalho
        const respostaCerta = row[15];  // Coluna onde está a "Resposta Certa"
        const respostaUsuario = selectedAnswers[`question${index}`];

        // Se a questão for anulada, conta como certa
        if (respostaCerta && respostaCerta.toLowerCase() === "anulada") {
            questoesCertas++;
            questoesAnuladas++;  // Contabiliza as anuladas
        } 
        // Se a questão não for anulada, verifica a resposta do usuário
        else if (respostaUsuario === respostaCerta) {
            questoesCertas++;
        } else if (respostaUsuario) {
            questoesErradas++;
        }
    }
});

// Exibir o resultado de aprovação ou reprovação
const resultadoProva = document.createElement('div');
resultadoProva.classList.add('estatistica-item');

// Lógica de aprovação permanece inalterada: Aprovado se tiver mais de 40 questões certas (incluindo as anuladas)
if (questoesCertas > 40) {
    resultadoProva.innerHTML = '<strong>Status:</strong> <span class="aprovado">Aprovado!</span>';
} else {
    resultadoProva.innerHTML = '<strong>Status:</strong> <span class="reprovado">Reprovado!</span>';
}

container1.appendChild(resultadoProva);

        // Exibir o número de questões certas e erradas
        const questoesCertasErradas = document.createElement('div');
        questoesCertasErradas.classList.add('estatistica-item');
        const totalQuestoes = examsData[examSelect.value].length - 1; // Desconta o cabeçalho
        questoesCertasErradas.innerHTML = `
    <div style="font-size: 1.0em; margin-bottom: 10px;">
        <strong>Questões Certas:</strong> 
        <span class="certas" style="color: green; font-weight: bold;">(${questoesCertas})</span> 
    </div>
    <div style="font-size: 1.0em; margin-bottom: 10px;">
        <strong>Questões Erradas:</strong> 
        <span class="erradas" style="color: red; font-weight: bold;">(${questoesErradas})</span> 
    </div>
    <div style="font-size: 1.0em; margin-bottom: 10px;">
        <strong>Questões Anuladas:</strong> 
        <span class="anuladas" style="color: orange; font-weight: bold;">(${questoesAnuladas})</span> 
    </div>
    <div style="font-size: 1.0em; margin-bottom: 10px;">
        <strong>Total de Questões:</strong> 
        <span class="total" style="color: blue; font-weight: bold;">(${totalQuestoes})</span>
    </div>
`;
        container1.appendChild(questoesCertasErradas);

        // Adicionar o container 1 ao popup
        popupContent.appendChild(container1);

        // Container 2: Questões Certas e Erradas por Disciplina
        const container2 = document.createElement('div');
        container2.classList.add('container-contraste');

        // Estatísticas por disciplina (usando a coluna 4 para as disciplinas)
        const tituloDisciplinas = document.createElement('h3');
        tituloDisciplinas.textContent = "Questões Certas e Erradas por Disciplina";
        container2.appendChild(tituloDisciplinas);

        // Agrupar as questões por disciplina (coluna 4)
        const disciplinas = {};
        examsData[examSelect.value].forEach((row, index) => {
            if (index > 0) {  // Ignorar o cabeçalho
                const disciplina = row[4];  // Coluna 4 contém a disciplina
                const respostaCerta = row[15];
                const respostaUsuario = selectedAnswers[`question${index}`];

                if (!disciplinas[disciplina]) {
                    disciplinas[disciplina] = { certas: 0, erradas: 0 };
                }

                if (respostaUsuario === respostaCerta) {
                    disciplinas[disciplina].certas++;
                } else if (respostaUsuario) {
                    disciplinas[disciplina].erradas++;
                }
            }
        });

        // Exibir as disciplinas com o número de acertos e erros
        Object.keys(disciplinas).forEach(disciplina => {
            const statsDisciplina = document.createElement('div');
            statsDisciplina.classList.add('estatistica-item');
            statsDisciplina.innerHTML = `<strong>${disciplina}</strong>: <span class="certas"> (${disciplinas[disciplina].certas})</span> / <span class="erradas"> (${disciplinas[disciplina].erradas})</span>`;
            container2.appendChild(statsDisciplina);
        });

        // Adicionar o container 2 ao popup
        popupContent.appendChild(container2);

        // Botão para fechar o popup
        const closeBtn = document.createElement('button');
        closeBtn.id = 'close-popup-estatisticas';
        closeBtn.textContent = 'Finalizar';
        popupContent.appendChild(closeBtn);
        
                // Botão de "Cancelar" (novo botão)
                const cancelBtn = document.createElement('button');
                cancelBtn.id = 'cancel-popup';
                cancelBtn.textContent = 'Retomar';

                popupContent.appendChild(cancelBtn);

        // Evento de fechar o popup de estatísticas e recarregar a página
        closeBtn.addEventListener('click', function() {
            location.reload();  // Recarrega a página inteira
        });

        // Adicionar o conteúdo ao popup e exibir
        popupEstatisticas.appendChild(popupContent);
        document.body.appendChild(popupEstatisticas);
        $(popupEstatisticas).fadeIn(100);

        // Fechar o popup ao clicar fora dele
        document.addEventListener('click', function(event) {
        if (!popupContent.contains(event.target) && !finalizarProvaBtn.contains(event.target)) {
        // Retomar o cronômetro antes de fechar o popup
        const timeParts = countdownTimer.textContent.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = parseInt(timeParts[2], 10);
        
        // Converter de volta para segundos e retomar
        const remainingTimeInSeconds = (hours * 3600) + (minutes * 60) + seconds;
        startCountdown(remainingTimeInSeconds);  // Retomar o cronômetro

        // Aplicar a animação de fadeOut
        $(popupEstatisticas).fadeOut(400, function() {
            // Depois da animação, remove o popup do DOM
            popupEstatisticas.remove();
        });
    }
});
        // Evento de clique para o botão de "Cancelar" (novo)
        cancelBtn.addEventListener('click', function() {

        // Retomar o cronômetro de onde parou
        const timeParts = countdownTimer.textContent.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = parseInt(timeParts[2], 10);
        
        // Converter de volta para segundos e retomar
        const remainingTimeInSeconds = (hours * 3600) + (minutes * 60) + seconds;
        startCountdown(remainingTimeInSeconds);  // Retomar o cronômetro

        $(popupEstatisticas).fadeOut(400, function() {
            // Depois da animação, remove o popup do DOM
            popupEstatisticas.remove();
        });
    });

        // Aplicar estilo ao popup
        popupEstatisticas.style.display = 'block';
    });

    // Função para carregar a planilha ao abrir a página
    loadExcel();

   // Função para exibir o container de descrição com o número total de questões
function displayDescriptionContainer(totalQuestionsAll) {
    layoutContainer.innerHTML = ''; // Limpar o conteúdo anterior

    const descriptionDiv = document.createElement('div');
    descriptionDiv.classList.add('description-container');

    // Criar o texto descritivo com o número total de questões dinâmico
    const descriptionText = document.createElement('p');
    descriptionText.innerHTML = `
        <div style="text-align: center; font-size: 20px; font-weight: bold;">
            Bem-vindo à nossa plataforma de simulados!
        </div>
        <br>
        <p style="font-size: 16px; line-height: 1.6;">
            Criamos este espaço gratuito para facilitar sua preparação, oferecendo um ambiente acessível e eficiente para você estudar e conquistar seus objetivos.
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
            Atualmente, nossa plataforma conta com <strong>${totalQuestionsAll} questões</strong> da FGV disponíveis para você treinar e melhorar seu desempenho.
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
            Entretanto, manter a plataforma em funcionamento envolve custos operacionais. Se você achou nosso serviço útil e deseja apoiar a continuidade deste projeto, sua colaboração será muito bem-vinda.
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
            Sinta-se à vontade para doar qualquer valor. Basta escanear ou clicar no QR code abaixo. Toda ajuda faz a diferença!
        </p>
    `;

    // Criar o QR code
    const qrCode = document.createElement('img');
    qrCode.src = 'data/logos/qr-code.png'; // Caminho da imagem do QR code
    qrCode.alt = 'QR Code para doação';
    qrCode.style.width = '250px'; // Ajustar tamanho do QR code
    qrCode.style.cursor = 'pointer';

    // Adicionar um link ao QR code para redirecionar a página
    const qrLink = document.createElement('a');
    qrLink.href = 'https://nubank.com.br/cobrar/whu36/66fabc3b-cb28-4faa-9c3d-02659c132816'; // Substitua pelo link da doação
    qrLink.target = '_blank'; // Abre em uma nova aba
    qrLink.appendChild(qrCode);

    // Adicionar o texto e o QR code ao container
    descriptionDiv.appendChild(descriptionText);
    descriptionDiv.appendChild(qrLink);
    
    // Adicionar o container descritivo ao layout-container
    layoutContainer.appendChild(descriptionDiv);
}

// Exemplo de como chamar a função após calcular o total de questões
examSelect.addEventListener('change', function() {
    const selectedExam = this.value;

    // Calcular o número total de questões de todas as folhas (20 a 41)
    let totalQuestionsAll = 0;
    for (let i = 20; i <= 41; i++) {
        if (examsData[i] && examsData[i].length > 1) {
            totalQuestionsAll += examsData[i].length - 1; // Descontar o cabeçalho
        }
    }

    if (selectedExam === "filtro") {
        document.getElementById('disciplinaSelect').style.display = 'block'; // Exibe o select de disciplinas
        populateDisciplinaSelect(); // Popula a lista de disciplinas
        displayDescriptionContainer(totalQuestionsAll); // Passar o número total de questões
        countdownTimer.style.display = 'none'; // Oculta o cronômetro
        gabaritoBtn.style.display = 'none';
        finalizarProvaBtn.style.display = 'none'; // Oculta o botão "Finalizar Prova"
    } else if (selectedExam === "Escolha o Exame" || !selectedExam) {
        countdownTimer.style.display = 'none';
        countdownTimer.textContent = "05:00:00";
        displayDescriptionContainer(totalQuestionsAll); // Passar o número total de questões
        clearInterval(countdownInterval);
        document.getElementById('disciplinaSelect').style.display = 'none'; // Oculta o select de disciplinas
        finalizarProvaBtn.style.display = 'none'; // Oculta o botão "Finalizar Prova"
        gabaritoBtn.style.display = 'none';
    } else {
        document.getElementById('disciplinaSelect').style.display = 'none'; // Oculta o select de disciplinas
        layoutContainer.innerHTML = ''; 
        displayQuestions(selectedExam); // Somente exibe questões para um exame válido
        countdownTimer.style.display = 'block'; // Exibe o cronômetro
        gabaritoBtn.style.display = 'block';
        finalizarProvaBtn.style.display = 'block';
        startCountdown(5 * 60 * 60);  
    }
});

    function populateDisciplinaSelect() {
        const disciplinaSelect = document.getElementById('disciplinaSelect');
        disciplinaSelect.innerHTML = '<option value="">Escolha a Disciplina</option>'; // Resetar
    
        let disciplinasContagem = {};  // Objeto para contar as questões por disciplina
    
        // Iterar por todas as provas para coletar as disciplinas e contar as questões
        Object.keys(examsData).forEach(examNumber => {
            examsData[examNumber].forEach((row, index) => {
                if (index > 0) {  // Ignorar o cabeçalho
                    const disciplina = row[4];  // Coluna de disciplina
                    if (disciplina) {
                        // Se a disciplina já existir, incrementar o contador, senão iniciar com 1
                        if (disciplinasContagem[disciplina]) {
                            disciplinasContagem[disciplina]++;
                        } else {
                            disciplinasContagem[disciplina] = 1;
                        }
                    }
                }
            });
        });
    
        // Popula o select com as disciplinas e o número de questões
        Object.keys(disciplinasContagem).forEach(disciplina => {
            const option = document.createElement('option');
            option.value = disciplina;
            option.textContent = `${disciplina} (${disciplinasContagem[disciplina]} questões)`;  // Exibir disciplina e número de questões
            disciplinaSelect.appendChild(option);
        });
    
        // Mostrar questões ao selecionar uma disciplina
        disciplinaSelect.addEventListener('change', function() {
            const selectedDisciplina = this.value;
            if (selectedDisciplina) {
                displayFilteredQuestions(selectedDisciplina);
                gabaritoBtn.style.display = 'block';
            }
        });
    }
    
    let currentOrder = 'Decrescente'; // Ordem inicial Decrescente

function displayFilteredQuestions(disciplina) {
    layoutContainer.innerHTML = '';  // Limpa o container antes de exibir as questões filtradas
    selectedAnswers = {};  // Reseta as respostas selecionadas pelo usuário
    let navigationCounter = 1;  // Inicializar o contador de navegação secundária

    // Coletar as questões correspondentes à disciplina
    let filteredQuestions = [];

    Object.keys(examsData).forEach(examNumber => {
        const questions = examsData[examNumber];

        questions.forEach((row, index) => {
            if (index === 0 || row[4] !== disciplina) return;  // Ignorar o cabeçalho e disciplinas diferentes
            filteredQuestions.push({ examNumber, index, year: row[5], questionData: row });
        });
    });

    // Ordenar por ano de acordo com a ordem atual
    if (currentOrder === 'Decrescente') {
        filteredQuestions.sort((a, b) => b.year - a.year);
    } else if (currentOrder === 'Crescente') {
        filteredQuestions.sort((a, b) => a.year - b.year);
    } else if (currentOrder === 'Randomizado') {
        filteredQuestions.sort(() => Math.random() - 0.5);  // Randomizar a ordem
    }

    const orderButton = document.createElement('button');
    orderButton.id = 'order-toggle-btn';  // Adiciona o ID para estilização
    orderButton.textContent = ` ${currentOrder}`;
    orderButton.addEventListener('click', toggleOrder);
    layoutContainer.appendChild(orderButton);

    // Adicionar o botão ao layout-container
    layoutContainer.appendChild(orderButton);
    // Criar o botão de "Gabarito"
    const gabaritoButton = document.createElement('button');
    gabaritoButton.id = 'gabarito-inline-btn';  // ID para estilização
    gabaritoButton.textContent = 'Ver Gabarito';

    // Adicionar o evento de clique ao botão de Gabarito
    gabaritoButton.addEventListener('click', function() {
        gabaritoBtn.click();  // Simula o clique no botão gabaritoBtn original
    });

    // Adicionar os dois botões ao layout-container
    layoutContainer.appendChild(orderButton);
    layoutContainer.appendChild(gabaritoButton);
    // Exibir as questões filtradas após ordenação
    filteredQuestions.forEach(({ examNumber, index, questionData }) => {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');
        questionDiv.id = `question-${examNumber}-${index}`;  // ID único da questão (gabarito)
        questionDiv.setAttribute('data-navigation-id', navigationCounter);  // ID para navegação

        // Verificar se a questão foi anulada
        let anulada = questionData[15] && questionData[15].toLowerCase() === "anulada";
        if (anulada) {
            questionDiv.style.backgroundColor = 'rgba(255, 248, 179, 0.8)';  // Amarelo suave para anulada
        }

        // Cabeçalho da questão
        const questionHeader = document.createElement('div');
        questionHeader.classList.add('small-text');
        questionHeader.innerHTML = `<strong style="font-size: 1.25em;">${navigationCounter})</strong> ${questionData[8]} / ${questionData[6]} / ${questionData[7]} / ${questionData[4]} / ${questionData[5]}`;
        questionDiv.appendChild(questionHeader);

        // Enunciado da questão
        const questionText = document.createElement('p');
        questionText.style.marginLeft = "10px"; 
        questionText.innerHTML = `${questionData[9]}`;
        questionDiv.appendChild(questionText);

        // Alternativas da questão
        const answerContainer = document.createElement('div');
        answerContainer.classList.add('answer-container');
        ['A', 'B', 'C', 'D', 'E'].forEach((letter, i) => {
            const alternativeText = questionData[i + 10];
            if (alternativeText) {
                const optionContainer = document.createElement('div');
                optionContainer.classList.add('icon-container');

                const scissorsIcon = document.createElement('div');
                scissorsIcon.classList.add('icon');

                if (!anulada) {
                    scissorsIcon.addEventListener('click', () => {
                        const label = optionContainer.querySelector('label');
                        const radioInput = label.querySelector('input');
                        const optionText = label.querySelector('span');

                        if (radioInput.checked) {
                            radioInput.checked = false;
                            delete selectedAnswers[`question${index}`];
                        }

                        if (radioInput.disabled) {
                            radioInput.disabled = false;
                            optionText.classList.remove('striked');
                        } else {
                            radioInput.disabled = true;
                            optionText.classList.add('striked');
                        }
                    });
                } else {
                    scissorsIcon.style.opacity = 0.5;
                    scissorsIcon.style.cursor = 'not-allowed';
                }

                const optionLabel = document.createElement('label');
                optionLabel.style.display = 'block';

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = `question${examNumber}-${index}`;  // Usar um name único para cada questão
                radioInput.value = letter;
                if (anulada) radioInput.disabled = true;

                const optionText = document.createElement('span');
                optionText.textContent = `${letter}) ${alternativeText}`;

                radioInput.addEventListener('click', () => {
                    const questionKey = `question${examNumber}-${index}`;
                    if (radioInput.checked && selectedAnswers[questionKey] === letter) {
                        radioInput.checked = false;
                        delete selectedAnswers[questionKey];
                    } else {
                        selectedAnswers[questionKey] = letter;
                    }
                });

                optionLabel.appendChild(radioInput);
                optionLabel.appendChild(optionText);
                optionContainer.appendChild(scissorsIcon);
                optionContainer.appendChild(optionLabel);
                answerContainer.appendChild(optionContainer);
            }
        });

        questionDiv.appendChild(answerContainer);
        layoutContainer.appendChild(questionDiv);
        navigationCounter++;  // Incrementa o contador de navegação
    });
}

function toggleOrder() {
    if (currentOrder === 'Decrescente') {
        currentOrder = 'Crescente';
    } else if (currentOrder === 'Crescente') {
        currentOrder = 'Randomizado';
    } else {
        currentOrder = 'Decrescente';
    }

    // Atualizar a exibição com a nova ordem
    displayFilteredQuestions(document.getElementById('disciplinaSelect').value);
}
    
});
