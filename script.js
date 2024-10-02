document.addEventListener('DOMContentLoaded', function() {  
    const examSelect = document.getElementById('examSelect');
    const layoutContainer = document.getElementById('layout-container');
    const countdownTimer = document.getElementById('countdown-timer'); // Referência ao cronômetro
    const gabaritoBtn = document.getElementById('gabarito-btn'); // Botão Gabarito
    const finalizarProvaBtn = document.getElementById('finalizar-prova-btn'); // Botão Finalizar Prova
    const popupGabarito = document.createElement('div'); // Criar o popup dinamicamente
    countdownTimer.style.display = "none";
    popupGabarito.id = 'popup-gabarito';
    document.body.appendChild(popupGabarito); // Adicionar o popup ao body
    displayDescriptionContainer(); // Exibir a descrição inicialmente
    let examsData = {};  // Para armazenar os dados de cada exame
    let selectedAnswers = {}; // Para armazenar as respostas do usuário
    let countdownInterval; // Variável para armazenar o intervalo do cronômetro

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

                populateExamSelect();  // Preencher o seletor de exames
            })
            .catch(error => console.error('Erro ao carregar a planilha:', error));
    }

    // Preencher o seletor de exames
    function populateExamSelect() {
        // Criar um array para armazenar os exames com seus anos
        let examList = [];
        
        for (let i = 30; i <= 41; i++) {
            if (examsData[i] && examsData[i][1] && examsData[i][1][5]) {
                const examYear = examsData[i][1][5]; // Acessar o ano na coluna 5
                examList.push({ examNumber: i, year: examYear });
            }
        }
    
        // Ordenar a lista de exames em ordem decrescente pelo número do exame
        examList.sort((a, b) => b.examNumber - a.examNumber);
    
        // Preencher o seletor com os exames ordenados
        examList.forEach(exam => {
            const option = document.createElement('option');
            option.value = exam.examNumber;
            option.textContent = `${exam.examNumber}º Exame de Ordem - ${exam.year}`;
            examSelect.appendChild(option);
        });
    }

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
        layoutContainer.innerHTML = '';  // Limpar o container antes de exibir as questões
        const questions = examsData[examNumber];
        selectedAnswers = {};  // Resetar as respostas selecionadas pelo usuário
    
        questions.forEach((row, index) => {
            if (index === 0) return;  // Ignorar o cabeçalho
    
            // Criar o container da questão
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question');
            questionDiv.id = `question-${index}`; // ID exclusivo da questão
    
            // Verificar se a questão foi anulada
            let anulada = row[15] && row[15].toLowerCase() === "anulada";
    
            // Se for anulada, alterar o estilo do container para amarelo
            if (anulada) {
                questionDiv.style.backgroundColor = 'rgba(255, 248, 179, 0.8)'; // Amarelo suave e sóbrio com transparência
            }
    
            // Cabeçalho da questão com fonte menor
            const questionHeader = document.createElement('div');
            questionHeader.classList.add('small-text');
            questionHeader.innerHTML = `
                <strong style="font-size: 1.25em;">${row[0]})</strong>
                <strong>${row[8]}</strong> / 
                ${row[6]} / 
                ${row[7]} / 
                ${row[4]}
                ${anulada ? '<span style="color: red; font-weight: bold;"> ANULADA!</span>' : ''}
            `;
            questionDiv.appendChild(questionHeader);
    
            // Texto do Enunciado
            const questionText = document.createElement('p');
            questionText.innerHTML = `<strong>${row[9]}</strong>`;
            questionDiv.appendChild(questionText);
    
            const answerContainer = document.createElement('div');
            answerContainer.classList.add('answer-container');
    
            ['A', 'B', 'C', 'D', 'E'].forEach((letter, i) => {
                const alternativeText = row[i + 10];
                if (alternativeText) {
                    const optionLabel = document.createElement('label');
                    optionLabel.style.display = 'block';
    
                    const radioInput = document.createElement('input');
                    radioInput.type = 'radio';
                    radioInput.name = `question${index}`;
                    radioInput.value = letter;
    
                    // Se a questão for anulada, desativar os radio buttons
                    if (anulada) {
                        radioInput.disabled = true;
                    }
    
                    const optionText = document.createElement('span');
                    optionText.textContent = `${letter}) ${alternativeText}`;
    
                    // Armazena a resposta marcada pelo usuário
                    radioInput.addEventListener('change', () => {
                        selectedAnswers[`question${index}`] = letter;
                    });
    
                    optionLabel.appendChild(radioInput);
                    optionLabel.appendChild(optionText);
                    answerContainer.appendChild(optionLabel);
                }
            });
    
            questionDiv.appendChild(answerContainer);
            layoutContainer.appendChild(questionDiv);
        });
    }
    

    // Exibir o popup com gabarito e respostas do usuário
    gabaritoBtn.addEventListener('click', function() {
        // Limpar e criar o conteúdo do popup
        popupGabarito.innerHTML = '<button id="close-popup">Finalizar</button>';
        const popupContent = document.createElement('div');
        popupContent.classList.add('popup-content');

        const userTitle = document.createElement('h3');
        userTitle.textContent = "Alternativas Marcadas - Gabarito";
        popupContent.appendChild(userTitle);

        examsData[examSelect.value].forEach((row, index) => {
            if (index > 0) {  // Ignorar o cabeçalho
                const gabaritoRow = document.createElement('p');
const respostaCerta = row[15];  // Coluna "Resposta Certa"
const respostaUsuario = selectedAnswers[`question${index}`] || "Não respondida";

// Verificar se a questão foi anulada
if (respostaCerta && respostaCerta.toLowerCase() === "anulada") {
    gabaritoRow.innerHTML = `<span class="gabarito-question" data-question-id="question-${index}"> ${index}: <strong style="color: red;">ANULADA!</strong></span> `;
    gabaritoRow.style.backgroundColor = "rgba(255, 248, 179, 0.8)"; // Amarelo suave e sóbrio
    gabaritoRow.style.color = "#000000"; // Texto preto para contraste
} else {
    // Exibir a resposta marcada pelo usuário e o gabarito, se a questão não for anulada
    gabaritoRow.innerHTML = `<span class="gabarito-question" data-question-id="question-${index}"> Questão ${index} - Resp: (${respostaUsuario}) || Gab: (${respostaCerta})</span>`;

    if (respostaUsuario === "Não respondida") {
        gabaritoRow.style.backgroundColor = "#f3f3f3"; // Cinza claro para "Não respondida"
        gabaritoRow.style.color = "#000000"; // Texto preto
    } else if (respostaUsuario === respostaCerta) {
        gabaritoRow.style.backgroundColor = "rgba(0, 200, 0, 0.5)"; // Verde suave para correta
        gabaritoRow.style.color = "#000000"; // Texto preto para contraste
    } else {
        gabaritoRow.style.backgroundColor = "rgba(255, 69, 0, 0.5)"; // Vermelho suave para errada
        gabaritoRow.style.color = "#000000"; // Texto preto para contraste
    }
}

                gabaritoRow.querySelector('span').addEventListener('click', function() {
                    const questionElement = document.getElementById(this.getAttribute('data-question-id'));
                    if (questionElement) {
                        questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        popupGabarito.style.display = 'none';
                    }
                });

                popupContent.appendChild(gabaritoRow);
            }
        });

        popupGabarito.appendChild(popupContent);
        popupGabarito.style.display = 'block';

        // Fechar o popup ao clicar no botão de fechar
        document.getElementById('close-popup').addEventListener('click', function() {
            popupGabarito.style.display = 'none';
            document.removeEventListener('click', closePopupOnClickOutside); // Remove o listener para evitar duplicidade
        });

        // Função para fechar o popup ao clicar fora dele
        function closePopupOnClickOutside(event) {
            if (!popupGabarito.contains(event.target) && event.target !== gabaritoBtn) {
                popupGabarito.style.display = 'none';
                document.removeEventListener('click', closePopupOnClickOutside); // Remove o listener ao fechar
            }
        }

        // Adicionar o evento para fechar ao clicar fora do popup
        setTimeout(() => {
            document.addEventListener('click', closePopupOnClickOutside);
        }, 100); // Timeout pequeno para garantir que o evento seja ativado após abrir o popup
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

        // Fechar o popup ao clicar fora dele
        document.addEventListener('click', function(event) {
            if (!popupContent.contains(event.target) && !finalizarProvaBtn.contains(event.target)) {
                popupEstatisticas.remove();  // Fecha o popup
            }
        });
    // Evento de clique para o botão de "Cancelar" (novo)
    cancelBtn.addEventListener('click', function() {
        popupEstatisticas.style.display = 'none';  // Fecha o popup

        // Retomar o cronômetro de onde parou
        const timeParts = countdownTimer.textContent.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = parseInt(timeParts[2], 10);
        
        // Converter de volta para segundos e retomar
        const remainingTimeInSeconds = (hours * 3600) + (minutes * 60) + seconds;
        startCountdown(remainingTimeInSeconds);  // Retomar o cronômetro
    });

        // Aplicar estilo ao popup
        popupEstatisticas.style.display = 'block';
    });

    // Função para carregar a planilha ao abrir a página
    loadExcel();

    // Função para exibir o container de descrição
    function displayDescriptionContainer() {
        layoutContainer.innerHTML = ''; // Limpar o conteúdo anterior
    
        const descriptionDiv = document.createElement('div');
        descriptionDiv.classList.add('description-container');
    
        // Criar o texto descritivo
        const descriptionText = document.createElement('p');
        descriptionText.innerHTML = `
            Bem-vindo à nossa plataforma de simulados! <br><br>
            Esta iniciativa é totalmente gratuita e foi criada para ajudar você a se preparar para suas provas. 
            No entanto, para manter a plataforma no ar, existem custos operacionais.<br><br>
            Se você gostou da plataforma e quer colaborar, fique à vontade para fazer uma doação no valor que desejar. 
            Basta escanear o QR code abaixo ou clicar nele para doar.
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

    // Verificar a seleção de exame e exibir o container de descrição
    examSelect.addEventListener('change', function() {
        const selectedExam = this.value;
    
        if (selectedExam === "Escolha o Exame" || !selectedExam) {
            location.reload();  // Recarrega a página inteira
        } else {
            // Limpar o container e exibir questões se um exame válido for selecionado
            layoutContainer.innerHTML = ''; 
            displayQuestions(selectedExam);  // Exibir as questões do exame selecionado
            countdownTimer.style.display = 'block'; // Mostrar o cronômetro
            startCountdown(5 * 60 * 60);  // Iniciar o cronômetro de 5 horas
        }
    });
});
