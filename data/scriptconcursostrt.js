const examsData = {};
let correctCount = 0;
let incorrectCount = 0;
let startTime = 0;
let totalTime = 0;
let responseTimes = []; // Armazena tempos de resposta individuais
let mensagensCache = []; // Armazena cache de mensagens para o chat
let chatAberto = false; // Controle de estado do chat
let questaoSelecionada = null; // Armazena a questão atual 
// Função para carregar a planilha ao abrir a página

// Definir a URL base do servidor
const SERVER_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/chat' 
    : 'https://professor-ia-c39492e02422.herokuapp.com/chat';  // URL do Heroku

function loadExcel() {
    fetch('data/dados/TRT/data.XLSX')
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });

            // Iterar sobre as folhas da planilha
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Armazenar os dados da planilha, indexando pelo nome da folha
                examsData[sheetName] = jsonData;
            });

            // Preencher os filtros após carregar os dados
            populateOrgaoFilter();
            populateFiltersFromExcel();
        })
        .catch(error => console.error('Erro ao carregar a planilha:', error));
}

// Função para preencher os filtros de Disciplina, Órgão e Ano
function populateFiltersFromExcel() {
    const disciplinasSet = new Set();
    const orgaosSet = new Set();
    const anosSet = new Set();

    // Iterar pelos dados da planilha para extrair disciplinas, órgãos e anos
    Object.keys(examsData).forEach(sheetName => {
        const sheetData = examsData[sheetName];
        if (sheetData && sheetData.length > 1) {
            sheetData.forEach((row, index) => {
                if (index === 0) return;  // Ignorar o cabeçalho

                const disciplina = row[4];  // Coluna da Disciplina
                const orgao = row[7];  // Coluna H (Órgão)
                const ano = row[5];  // Coluna F (Ano)

                // Adicionar dados válidos aos sets
                if (disciplina) disciplinasSet.add(disciplina);
                if (orgao) orgaosSet.add(orgao);
                if (ano) anosSet.add(ano);
            });
        }
    });

    // Preencher os selects de disciplina, órgão e ano
    populateSelectList('filtroDisciplina', Array.from(disciplinasSet).sort(), 'Selecione a Disciplina');
    populateSelectList('filtroOrgaoMateria', Array.from(orgaosSet).sort(), 'Selecione o Órgão');
    populateSelectList('filtroAnoMateria', Array.from(anosSet).sort(), 'Selecione o Ano');
}

// Função para preencher os filtros de órgão
function populateOrgaoFilter() {
    const orgaosSet = new Set();

    // Iterar pelos dados da planilha para extrair os órgãos
    Object.keys(examsData).forEach(sheetName => {
        const sheetData = examsData[sheetName];
        if (sheetData && sheetData.length > 1) {
            const firstRow = sheetData[1];
            const orgao = firstRow[7]; // Coluna H (Índice 7)
            if (orgao) orgaosSet.add(orgao);
        }
    });

    populateSelectList('filtroOrgao', Array.from(orgaosSet).sort(), 'Órgão');
}
// Função para atualizar os filtros disponíveis com base nas seleções
function updateFilterStates() {
    const filtroOrgao = document.getElementById('filtroOrgao');
    const filtroAno = document.getElementById('filtroAno');
    const filtroCargo = document.getElementById('filtroCargo');

    // Inicialmente desativar os filtros de Ano e Cargo
    filtroAno.disabled = true;
    filtroCargo.disabled = true;

    // Quando um órgão for selecionado
    filtroOrgao.addEventListener('change', function() {
        const orgaoSelecionado = filtroOrgao.value;

        // Limpar e desativar os selects de Ano e Cargo até que algo seja selecionado
        filtroAno.innerHTML = '<option value="">Selecione o Ano</option>';
        filtroCargo.innerHTML = '<option value="">Selecione o Cargo</option>';
        filtroAno.disabled = true;
        filtroCargo.disabled = true;

        if (orgaoSelecionado !== "") {
            // Preencher o filtro de anos com base no órgão selecionado
            const anosFiltrados = new Set();
            Object.keys(examsData).forEach(sheetName => {
                const sheetData = examsData[sheetName];
                if (sheetData && sheetData.length > 1) {
                    const firstRow = sheetData[1];
                    const orgao = firstRow[7]; // Coluna H (índice 7)
                    const ano = firstRow[5];   // Coluna F (índice 5)
                    if (orgao === orgaoSelecionado && ano) {
                        anosFiltrados.add(ano);
                    }
                }
            });
            populateSelectList('filtroAno', Array.from(anosFiltrados).sort(), 'Ano');
            filtroAno.disabled = false;
        }
    });

    // Quando um ano for selecionado
    filtroAno.addEventListener('change', function() {
        const orgaoSelecionado = filtroOrgao.value;
        const anoSelecionado = filtroAno.value;

        // Limpar e desativar o select de Cargo até que algo seja selecionado
        filtroCargo.innerHTML = '<option value="">Selecione o Cargo</option>';
        filtroCargo.disabled = true;

        if (anoSelecionado !== "") {
            // Preencher o filtro de cargos com base no órgão e ano selecionados
            const cargosFiltrados = new Set();
            Object.keys(examsData).forEach(sheetName => {
                const sheetData = examsData[sheetName];
                if (sheetData && sheetData.length > 1) {
                    const firstRow = sheetData[1];
                    const orgao = firstRow[7]; // Coluna H (índice 7)
                    const ano = firstRow[5];   // Coluna F (índice 5)
                    const cargo = firstRow[3]; // Coluna D (índice 3)
                    if (orgao === orgaoSelecionado && ano === anoSelecionado && cargo) {
                        cargosFiltrados.add(cargo);
                    }
                }
            });
            populateSelectList('filtroCargo', Array.from(cargosFiltrados).sort(), 'Cargo');
            filtroCargo.disabled = false;
        }
    });
}
// Função para filtrar e exibir questões com base nos filtros selecionados
filtroCargo.addEventListener('change', function() {
    const orgaoSelecionado = filtroOrgao.value;
    const anoSelecionado = filtroAno.value;
    const cargoSelecionado = filtroCargo.value;

    if (cargoSelecionado !== "") {
        // Filtrar as questões com base nos filtros de órgão, ano e cargo
        const examNumber = Object.keys(examsData).find(sheetName => {
            const sheetData = examsData[sheetName];
            if (sheetData && sheetData.length > 1) {
                const firstRow = sheetData[1];
                const orgao = firstRow[7]; // Coluna H (Órgão)
                const ano = firstRow[5];   // Coluna F (Ano)
                const cargo = firstRow[3]; // Coluna D (Cargo)
                
                return orgao === orgaoSelecionado && ano === anoSelecionado && cargo === cargoSelecionado;
            }
            return false;
        });

        if (examNumber) {
            displayQuestions(examNumber);  // Exibir as questões
        } else {
            console.error('Nenhum exame encontrado com os critérios selecionados.');
            layoutContainer.innerHTML = 'Nenhum exame encontrado para os critérios selecionados.';
        }
    }
});

// Função para exibir as questões filtradas
function displayQuestions(examNumber) {
    // Reiniciar o contador de acertos e erros
    correctCount = 0;
    incorrectCount = 0;
    totalTime = 0;
    responseTimes = [];
    updateFloatingCounter(); // Atualizar a exibição do contador com os valores zerados

    const layoutContainer = document.getElementById('layout-container');
    layoutContainer.innerHTML = '';  // Limpar o container antes de exibir as questões

    // Exibir o contador de acertos e erros ao exibir questões
    const counterDiv = document.getElementById('floating-counter');
    if (counterDiv) {
        counterDiv.style.display = 'block';  // Exibir o contador
    }

    if (!examsData[examNumber]) {
        console.error(`Exame ${examNumber} não encontrado em examsData.`);
        return;
    }

    const questions = examsData[examNumber];
    let navigationCounter = 1;  // Contador de navegação para rolar suavemente entre questões
    // Iniciar o tempo para a primeira questão
    startTime = new Date().getTime();
    
    questions.forEach((row, index) => {
        if (index === 0) return;  // Ignorar o cabeçalho

        // Criar o container da questão
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');

        // Cabeçalho da questão
        const questionHeader = document.createElement('div');
        questionHeader.classList.add('small-text');
        questionHeader.innerHTML = `<strong>${navigationCounter})</strong> ${row[8]} / ${row[6]} / ${row[7]} / ${row[4]}`;
        questionDiv.appendChild(questionHeader);

        // Texto do Enunciado
        const questionText = document.createElement('p');
        questionText.textContent = row[9];
        questionDiv.appendChild(questionText);

        const answerContainer = document.createElement('div');
        answerContainer.classList.add('answer-container');

        let correctAnswer = row[15];  // Coluna P ("Resposta Certa")

        // Criar as alternativas
        ['A', 'B', 'C', 'D', 'E'].forEach((letter, i) => {
            const alternativeText = row[i + 10];
            if (alternativeText) {
                // Criar o container para a tesoura e a alternativa
                const optionContainer = document.createElement('div');
                optionContainer.classList.add('icon-container');

                // Adicionar o ícone da tesoura
                const scissorsIcon = document.createElement('div');
                scissorsIcon.classList.add('icon');

                // Criar o label para a alternativa
                const optionLabel = document.createElement('label');
                optionLabel.style.display = 'block';

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = `question${index}`;
                radioInput.value = letter;

                const optionText = document.createElement('span');
                optionText.textContent = `${letter}) ${alternativeText}`;
                optionText.classList.add(`alternative-${letter}`);  // Adiciona uma classe para identificar a alternativa

                // Adicionar funcionalidade da tesoura
                scissorsIcon.addEventListener('click', () => {
                    const isDisabled = radioInput.disabled;
                    radioInput.disabled = !isDisabled;  // Alterna o estado de habilitado/desabilitado
                    if (radioInput.disabled) {
                        optionText.classList.add('scissor-striked');  // Aplica o riscado cinza da tesoura
                    } else {
                        optionText.classList.remove('scissor-striked');  // Remove o riscado da tesoura
                    }
                });

                // Adicionar ícone e opção ao container
                optionContainer.appendChild(scissorsIcon);
                optionLabel.appendChild(radioInput);
                optionLabel.appendChild(optionText);
                optionContainer.appendChild(optionLabel);

                // Adicionar o container da opção ao container de respostas
                answerContainer.appendChild(optionContainer);
            }
        });

        questionDiv.appendChild(answerContainer);

        // Criar o container para o botão e feedback
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');  // Certificar-se de que o container tenha a classe correta

        // Criar um elemento para exibir o feedback (certo/errado)
        const feedbackMessage = document.createElement('div');
        feedbackMessage.classList.add('feedback-message');
        buttonContainer.appendChild(feedbackMessage);  // Mover o feedback para dentro do buttonContainer

        // Criar o botão de "Corrigir"
        const correctButton = document.createElement('button');
        correctButton.textContent = 'Corrigir';
        correctButton.classList.add('correct-button');
        buttonContainer.appendChild(correctButton);  // Adicionar o botão ao container

        // Ação do botão "Corrigir"
        correctButton.addEventListener('click', () => {
            // Limitar o escopo ao questionDiv para garantir que as seleções funcionem corretamente
            const selectedAnswer = questionDiv.querySelector(`input[name="question${index}"]:checked`);
    if (!selectedAnswer) {
        alert('Por favor, selecione uma resposta antes de corrigir!');
        return;
    }
            const correctOption = questionDiv.querySelector(`.alternative-${correctAnswer}`);  // Alternativa correta
            const correctIcon = '<i class="fas fa-check" style="color:green;"></i>';
            const wrongIcon = '<i class="fas fa-times" style="color:red;"></i>';

            // Tornar os radio buttons inalteráveis
            const allInputs = questionDiv.querySelectorAll(`input[name="question${index}"]`);
            allInputs.forEach(input => input.disabled = true);

            // Desabilitar as tesouras após a correção
            const allScissors = questionDiv.querySelectorAll('.icon');
            allScissors.forEach(scissorsIcon => {
                scissorsIcon.style.pointerEvents = 'none';  // Desativa a interação com a tesoura
                scissorsIcon.style.opacity = '0.5';  // Reduz a opacidade para indicar que está desativado
            });

            // Taxar e colorir as alternativas incorretas
            ['A', 'B', 'C', 'D', 'E'].forEach((letter) => {
                const optionElement = questionDiv.querySelector(`.alternative-${letter}`);
                if (letter !== correctAnswer && optionElement) {
                    optionElement.classList.add('incorrect-striked');  // Aplica o riscado e cor vermelha na correção
                }
            });

            // Calcular o tempo de resposta
            const endTime = new Date().getTime();
            const responseTime = (endTime - startTime) / 1000;  // Tempo em segundos
            responseTimes.push(responseTime);
            totalTime += responseTime;

            // Atualizar o tempo para a próxima questão
            startTime = endTime;

            if (selectedAnswer) {
                const selectedValue = selectedAnswer.value;  // Obter a alternativa selecionada
                if (selectedValue === correctAnswer) {
                    // Usuário acertou
                    correctOption.classList.add('correct');  // Deixar a alternativa correta verde
                    feedbackMessage.innerHTML = `${correctIcon} Você Acertou!`;
                    correctCount++;  // Incrementa o contador de acertos
                } else {
                    // Usuário errou
                    const wrongOption = questionDiv.querySelector(`.alternative-${selectedValue}`);
                    wrongOption.classList.add('incorrect-striked');  // Aplica o riscado e cor vermelha na alternativa errada
                    correctOption.classList.add('correct');  // Deixar a alternativa correta verde
                    feedbackMessage.innerHTML = `${wrongIcon} Você Errou! Alternativa Correta: ${correctAnswer}`;
                    incorrectCount++;  // Incrementa o contador de erros
                }
                updateFloatingCounter();  // Atualiza o contador flutuante
            } else {
                alert('Selecione uma resposta antes de corrigir!');
            }
        });

 // Adicionar o botão "Tirar Dúvidas"
 const duvidasButton = document.createElement('button');
 duvidasButton.classList.add('duvidas-button');
 duvidasButton.textContent = 'Tirar Dúvidas';
             // Aqui, você atribui o navigationCounter ao botão para referência futura
    duvidasButton.setAttribute('data-navigation-id', navigationCounter);

        // Função que abre o popup de chat
        buttonContainer.appendChild(duvidasButton);  // Adicionar o botão ao container
        duvidasButton.onclick = () => {
            questaoSelecionada = questionDiv; // Atribui a questão atual como a selecionada
            toggleChatPopup(navigationCounter); // Chama a função de abrir o chat
        };
        // Adicionar o container com o botão e feedback à questão
        questionDiv.appendChild(buttonContainer);

        layoutContainer.appendChild(questionDiv);  // Adicionar a questão ao layout
        navigationCounter++;  // Incrementar o contador de navegação
    });
}

// Criar o contador flutuante ao carregar a página
createFloatingCounter();

// Inicializar o carregamento da planilha e os eventos dos filtros
document.addEventListener('DOMContentLoaded', function() {
    loadExcel();
    updateFilterStates();
});

// Função para preencher os filtros de Disciplina, Órgão e Ano de maneira interdependente
function updateFilters() {
    const disciplinaSelecionada = document.getElementById('filtroDisciplina').value;
    const orgaoSelecionado = document.getElementById('filtroOrgaoMateria').value;
    const anoSelecionado = document.getElementById('filtroAnoMateria').value;

    const disciplinasSet = new Set();
    const orgaosSet = new Set();
    const anosSet = new Set();

    // Iterar pelos dados da planilha para aplicar os filtros dinamicamente
    Object.keys(examsData).forEach(sheetName => {
        const sheetData = examsData[sheetName];
        if (sheetData && sheetData.length > 1) {
            sheetData.forEach((row, index) => {
                if (index === 0) return;  // Ignorar o cabeçalho

                const disciplina = row[4];  // Coluna Disciplina
                const orgao = row[7];       // Coluna Órgão
                const ano = row[5];         // Coluna Ano

                // Adicionar disciplinas, órgãos e anos correspondentes aos filtros selecionados
                if (
                    (disciplinaSelecionada === '' || disciplina === disciplinaSelecionada) &&
                    (orgaoSelecionado === '' || orgao === orgaoSelecionado) &&
                    (anoSelecionado === '' || ano == anoSelecionado)
                ) {
                    if (disciplina) disciplinasSet.add(disciplina);
                    if (orgao) orgaosSet.add(orgao);
                    if (ano) anosSet.add(ano);
                }
            });
        }
    });

    // Atualizar os selects com base nos valores filtrados
    populateSelectList('filtroDisciplina', Array.from(disciplinasSet).sort(), 'Selecione a Disciplina');
    populateSelectList('filtroOrgaoMateria', Array.from(orgaosSet).sort(), 'Selecione o Órgão');
    populateSelectList('filtroAnoMateria', Array.from(anosSet).sort(), 'Selecione o Ano');
}

// Função para preencher uma select list com valores e manter a consistência dos filtros
function populateSelectList(selectId, values, placeholder = 'Selecione') {
    const select = document.getElementById(selectId);
    if (select) {
        const currentValue = select.value;  // Manter o valor selecionado atualmente
        select.innerHTML = `<option value="">${placeholder}</option>`;
        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        // Restaura a seleção anterior se o valor ainda for válido
        if (values.includes(currentValue)) {
            select.value = currentValue;
        }
    }
}

// Função que dispara quando um dos filtros muda, atualizando os outros
function onFilterChange() {
    updateFilters();  // Atualizar as opções dos filtros com base na seleção atual
    filterAndDisplayQuestions();  // Filtrar e exibir as questões
}

// Adicionar eventos para aplicar os filtros e exibir questões dinamicamente
document.getElementById('filtroDisciplina').addEventListener('change', onFilterChange);
document.getElementById('filtroOrgaoMateria').addEventListener('change', onFilterChange);
document.getElementById('filtroAnoMateria').addEventListener('change', onFilterChange);

// Função para filtrar e exibir questões com base nos filtros selecionados
function filterAndDisplayQuestions() {
    const disciplinaSelecionada = document.getElementById('filtroDisciplina').value;
    const orgaoSelecionado = document.getElementById('filtroOrgaoMateria').value;
    const anoSelecionado = document.getElementById('filtroAnoMateria').value;

    const filteredQuestions = [];

    // Iterar pelos exames e aplicar os filtros
    Object.keys(examsData).forEach(sheetName => {
        const sheetData = examsData[sheetName];
        if (sheetData && sheetData.length > 1) {
            sheetData.forEach((row, index) => {
                if (index === 0) return;  // Ignorar o cabeçalho

                const disciplina = row[4];
                const orgao = row[7];
                const ano = row[5];

                // Aplicar os filtros
                if (
                    (disciplinaSelecionada === '' || disciplina === disciplinaSelecionada) &&
                    (orgaoSelecionado === '' || orgao === orgaoSelecionado) &&
                    (anoSelecionado === '' || ano == anoSelecionado)
                ) {
                    filteredQuestions.push(row);
                }
            });
        }
    });

    displayFilteredQuestions(filteredQuestions);

    const counterDiv = document.getElementById('floating-counter');
    if (filteredQuestions.length > 0 && counterDiv) {
        counterDiv.style.display = 'block';  // Exibir o contador
    }
}

// Criar o contador flutuante ao carregar a página
function createFloatingCounter() {
    const counterDiv = document.createElement('div');
    counterDiv.id = 'floating-counter';
    counterDiv.innerHTML = `Acertos: ${correctCount} / Erros: ${incorrectCount} |  Tempo de Resposta: 0s`;
    counterDiv.style.position = 'fixed';
    counterDiv.style.top = '10px';
    counterDiv.style.left = '50%';
    counterDiv.style.transform = 'translateX(-50%)';
    counterDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    counterDiv.style.color = 'white';
    counterDiv.style.padding = '10px';
    counterDiv.style.borderRadius = '5px';
    counterDiv.style.zIndex = '1000';
    document.body.appendChild(counterDiv);  // Adicionar o contador ao corpo da página
}

// Função para atualizar o contador de acertos, erros e Tempo de Resposta
function updateFloatingCounter() {
    const counterDiv = document.getElementById('floating-counter');
    if (counterDiv) {
        const averageTime = responseTimes.length > 0 ? (totalTime / responseTimes.length).toFixed(2) : 0;
        counterDiv.innerHTML = `Acertos: ${correctCount} / Erros: ${incorrectCount} | Tempo de Resposta: ${averageTime}s`;
    }
}
// Função para exibir as questões filtradas com alternativas, tesoura e correção
function displayFilteredQuestions(filteredQuestions) {
    // Reiniciar o contador de acertos, erros e tempo
    correctCount = 0;
    incorrectCount = 0;
    totalTime = 0;
    responseTimes = [];
    updateFloatingCounter();  // Atualizar a exibição do contador com os valores zerados

    const layoutContainer = document.getElementById('layout-container');
    layoutContainer.innerHTML = '';  // Limpar o container antes de exibir as questões filtradas

    if (filteredQuestions.length === 0) {
        layoutContainer.innerHTML = '<p>Nenhuma questão encontrada para os filtros selecionados.</p>';
        return;
    }

    let navigationCounter = 1;  // Inicializar contador de navegação
    // Iniciar o tempo quando o usuário vê a primeira questão
    startTime = new Date().getTime();

    filteredQuestions.forEach((row, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');
        questionDiv.setAttribute('data-navigation-id', navigationCounter);  // Navegação com ID

        // Cabeçalho da questão
        const questionHeader = document.createElement('div');
        questionHeader.classList.add('small-text');
        questionHeader.innerHTML = `<strong>${navigationCounter})</strong> ${row[8]} / ${row[6]} / ${row[7]} / ${row[4]}`;
        questionDiv.appendChild(questionHeader);

        // Texto do Enunciado
        const questionText = document.createElement('p');
        questionText.textContent = row[9];
        questionDiv.appendChild(questionText);

        const answerContainer = document.createElement('div');
        answerContainer.classList.add('answer-container');

        let correctAnswer = row[15];  // Coluna P ("Resposta Certa")

        // Criar as alternativas
        ['A', 'B', 'C', 'D', 'E'].forEach((letter, i) => {
            const alternativeText = row[i + 10];
            if (alternativeText) {
                // Criar o container para a tesoura e a alternativa
                const optionContainer = document.createElement('div');
                optionContainer.classList.add('icon-container');

                // Adicionar o ícone da tesoura
                const scissorsIcon = document.createElement('div');
                scissorsIcon.classList.add('icon');

                // Criar o label para a alternativa
                const optionLabel = document.createElement('label');
                optionLabel.style.display = 'block';

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = `question${index}`;
                radioInput.value = letter;

                const optionText = document.createElement('span');
                optionText.textContent = `${letter}) ${alternativeText}`;
                optionText.classList.add(`alternative-${letter}`);  // Adiciona uma classe para identificar a alternativa

                // Adicionar funcionalidade da tesoura
                scissorsIcon.addEventListener('click', () => {
                    const isDisabled = radioInput.disabled;
                    radioInput.disabled = !isDisabled;  // Alterna o estado de habilitado/desabilitado
                    if (radioInput.disabled) {
                        optionText.classList.add('scissor-striked');  // Aplica o riscado cinza da tesoura
                    } else {
                        optionText.classList.remove('scissor-striked');  // Remove o riscado da tesoura
                    }
                });

                // Adicionar ícone e opção ao container
                optionContainer.appendChild(scissorsIcon);
                optionLabel.appendChild(radioInput);
                optionLabel.appendChild(optionText);
                optionContainer.appendChild(optionLabel);

                // Adicionar o container da opção ao container de respostas
                answerContainer.appendChild(optionContainer);
            }
        });

        questionDiv.appendChild(answerContainer);

        // Criar o container para o botão e feedback
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');  // Certificar-se de que o container tenha a classe correta

        // Criar um elemento para exibir o feedback (certo/errado)
        const feedbackMessage = document.createElement('div');
        feedbackMessage.classList.add('feedback-message');
        buttonContainer.appendChild(feedbackMessage);  // Mover o feedback para dentro do buttonContainer

        // Criar o botão de "Corrigir"
        const correctButton = document.createElement('button');
        correctButton.textContent = 'Corrigir';
        correctButton.classList.add('correct-button');
        buttonContainer.appendChild(correctButton);  // Adicionar o botão ao container

        // Ação do botão "Corrigir"
        correctButton.addEventListener('click', () => {
            const selectedAnswer = questionDiv.querySelector(`input[name="question${index}"]:checked`);
            const correctOption = questionDiv.querySelector(`.alternative-${correctAnswer}`);  // Alternativa correta
            const correctIcon = '<i class="fas fa-check" style="color:green;"></i>';
            const wrongIcon = '<i class="fas fa-times" style="color:red;"></i>';

            // Tornar os radio buttons inalteráveis
            const allInputs = questionDiv.querySelectorAll(`input[name="question${index}"]`);
            allInputs.forEach(input => input.disabled = true);

            // Desabilitar as tesouras após a correção
            const allScissors = questionDiv.querySelectorAll('.icon');
            allScissors.forEach(scissorsIcon => {
                scissorsIcon.style.pointerEvents = 'none';  // Desativa a interação com a tesoura
                scissorsIcon.style.opacity = '0.5';  // Reduz a opacidade para indicar que está desativado
            });

            // Taxar e colorir as alternativas incorretas
            ['A', 'B', 'C', 'D', 'E'].forEach((letter) => {
                const optionElement = questionDiv.querySelector(`.alternative-${letter}`);
                if (letter !== correctAnswer && optionElement) {
                    optionElement.classList.add('incorrect-striked');  // Aplica o riscado e cor vermelha na correção
                }
            });

            // Calcular o tempo de resposta
            const endTime = new Date().getTime();
            const responseTime = (endTime - startTime) / 1000;  // Tempo em segundos
            responseTimes.push(responseTime);
            totalTime += responseTime;

            // Atualizar o tempo para a próxima questão
            startTime = endTime;

            if (selectedAnswer) {
                const selectedValue = selectedAnswer.value;  // Obter a alternativa selecionada
                if (selectedValue === correctAnswer) {
                    // Usuário acertou
                    correctOption.classList.add('correct');  // Deixar a alternativa correta verde
                    feedbackMessage.innerHTML = `${correctIcon} Você Acertou!`;
                    correctCount++;  // Incrementa o contador de acertos
                } else {
                    // Usuário errou
                    const wrongOption = questionDiv.querySelector(`.alternative-${selectedValue}`);
                    wrongOption.classList.add('incorrect-striked');  // Aplica o riscado e cor vermelha na alternativa errada
                    correctOption.classList.add('correct');  // Deixar a alternativa correta verde
                    feedbackMessage.innerHTML = `${wrongIcon} Você Errou! Alternativa Correta: ${correctAnswer}`;
                    incorrectCount++;  // Incrementa o contador de erros
                }
                updateFloatingCounter();  // Atualiza o contador flutuante
            } else {
                alert('Selecione uma resposta antes de corrigir!');
            }
        });

        // Adicionar o botão "Tirar Dúvidas"
        const duvidasButton = document.createElement('button');
        duvidasButton.classList.add('duvidas-button');
        duvidasButton.textContent = 'Tirar Dúvidas';

        // Aqui, você atribui o navigationCounter ao botão para referência futura
        duvidasButton.setAttribute('data-navigation-id', navigationCounter);

        // Função que abre o popup de chat
        duvidasButton.onclick = () => {
            questaoSelecionada = questionDiv; // Atribui a questão atual como a selecionada
            toggleChatPopup(navigationCounter); // Chama a função de abrir o chat
        };

        buttonContainer.appendChild(duvidasButton);  // Adicionar o botão ao container

        // Adicionar o container com o botão e feedback à questão
        questionDiv.appendChild(buttonContainer);

        layoutContainer.appendChild(questionDiv);  // Adicionar a questão ao layout
        navigationCounter++;  // Incrementar o contador de navegação
    });
}

// Criar o contador flutuante ao carregar a página
createFloatingCounter();

// Inicializar o carregamento da planilha e os eventos dos filtros
document.addEventListener('DOMContentLoaded', function() {
    loadExcel();
});


// Adicionar eventos para aplicar os filtros e exibir questões
document.getElementById('filtroDisciplina').addEventListener('change', filterAndDisplayQuestions);
document.getElementById('filtroOrgaoMateria').addEventListener('change', filterAndDisplayQuestions);
document.getElementById('filtroAnoMateria').addEventListener('change', filterAndDisplayQuestions);

// Função para fechar o chat popup e limpar o cache e o conteúdo do chat
function fecharChatPopup() {
    const chatPopup = document.getElementById('chat-popup');
    if (chatPopup) {
        chatPopup.style.display = 'none';  
        limparCache();  
        document.getElementById('chat-content').innerHTML = '';  
        document.getElementById('chat-input').value = '';  
        questaoSelecionada = null;  
        chatAberto = false;  
    }
}

// Adicionar o event listener ao botão de fechar (close-btn)
document.querySelector('.close-btn').addEventListener('click', function() {
    fecharChatPopup();  
});

// Função para exibir/ocultar o chat e mostrar a mensagem inicial do Professor IA
function toggleChatPopup(navigationCounter) {
    
    const chatPopup = document.getElementById('chat-popup');
    
    if (chatPopup) {
        if (!chatAberto) {
            chatPopup.style.display = 'block';
            chatAberto = true;


            const instrucoes = `\n\n**Bem-vindo(a) ao Professor IA!**\n
            Para tirar suas dúvidas sobre a questão é necessário que <strong>siga as instruções abaixo:</strong>\n
            1. Para contextualizar digite <strong>"Gabarito"</strong>.\n
            2. Para dúvidas sobre a questão, <strong>primeiro digite "Gabarito"</strong>, depois faça perguntas diretamente sobre a questão.\n
            3. Fechar o chat: Clique no botão "X".`;
            adicionarMensagemAoChat('Professor IA', instrucoes, 'resposta');

        } else {
            chatPopup.style.display = 'none';
            chatAberto = false;
        }
    } else {
        console.error("Elemento chat-popup não encontrado!");
    }
}
function adicionarMensagemAoChat(remetente, mensagem, classe) {
    const chatContent = document.getElementById('chat-content');
    const mensagemDiv = document.createElement('div');
    mensagemDiv.classList.add('mensagem', classe);
    
    const formattedMessage = mensagem
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
        .replace(/\n/g, '<br>'); 
    
    mensagemDiv.innerHTML = `<strong>${remetente}:</strong> ${formattedMessage}`;
    
    chatContent.appendChild(mensagemDiv);
    chatContent.scrollTop = chatContent.scrollHeight; 
}
async function enviarPergunta() {
    const chatInput = document.getElementById('chat-input');
    const userMessage = chatInput.value.trim();

    if (userMessage !== "") {
        adicionarMensagemAoChat('Você', userMessage, 'remetente');
        adicionarMensagemAoCache('user', userMessage);

        if (userMessage.toLowerCase().includes('gabarito')) {
            if (!questaoSelecionada) {
                adicionarMensagemAoChat('Professor IA', 'Nenhuma questão selecionada para exibir o gabarito. Por favor, escolha uma questão antes.', 'resposta');
                return;
            }

            const dadosQuestao = coletarDadosDaQuestao(questaoSelecionada);
            if (!dadosQuestao) {
                adicionarMensagemAoChat('Professor IA', 'Erro ao coletar dados da questão. Tente novamente.', 'resposta');
                return;
            }

            const mensagemParaAPI = {
                role: 'user',
                content: `**Sou aluno e concurseiro e agora preciso que você incorpore o papel de professor acadêmico sob as seguintes instruções:**\n\n
                1. Você deverá ter linguagem acessível para abordar todos os aspectos da questão, do enúnciado, da fundamentação, e da explicação acerca da matéria relacionada.\n
                2. Você terá que avaliar o enunciado da questão com atenção especial para o comando da questão, para as alternativas e a resposta certa para fornecer um gabarito comentado.\n
                3. O gabarito comentado deverá conter o porquê determinada alternativa está errada ou correta.\n
                4. Deverá apresentar sugestões de próximas interações com o conteúdo da questão.\n
                5. Seja objetivo e didático.\n
                6. Se possível e necessário, faça busca na internet para buscar respostas mais precisas e acertivas.\n
                7. Nunca entre em contradição e sempre considere ${dadosQuestao.respostaCorreta} como resposta correta.
                8. Sempre que a questão for relacionada a matéria jurídica, forneça a lei, o código, o artigo ou a jurisprudência se houver.
                Sendo assim, me forneça um gabarito comentado para a seguinte questão:\n\n
                **Enunciado da Questão**:\n${dadosQuestao.enunciado}\n\n
                **Classificação da Disciplina**: [Indique aqui a disciplina relacionada à questão, por exemplo: Direito Penal, Português, etc.]\n
                **Palavras-chave**: [Liste aqui as palavras-chave relevantes que ajudam a entender o assunto da questão.]\n\n
                **Análise das Alternativas**:\n
                ${dadosQuestao.alternativas.map((alt, i) => {
                    return `**Alternativa ${String.fromCharCode(65 + i)}**: ${alt}\n
                    *Discussão*: [Aqui, você pode adicionar uma breve análise sobre esta alternativa, como sua validade, possíveis erros ou acertos.]\n`;
                }).join('\n')}\n
                **Resposta Correta**: ${dadosQuestao.respostaCorreta}\n\n`
            };
            
            adicionarMensagemAoCache('user', mensagemParaAPI.content);
        }

        chatInput.value = '';  // Limpar o campo de input do usuário

        // Montar o payload para enviar ao servidor
        const payload = {
            sessionId: 'sessao-exemplo', // Usar um sessionId adequado
            messages: mensagensCache // Enviar o cache acumulado de mensagens
        };

        try {
            const response = await axios.post(SERVER_URL, payload);
            adicionarMensagemAoChat('Professor IA', response.data.reply, 'resposta');
            adicionarMensagemAoCache('assistant', response.data.reply);
        } catch (error) {
            console.error('Erro ao enviar a pergunta:', error);
            adicionarMensagemAoChat('Professor IA', 'Erro ao processar o gabarito. Tente novamente.', 'resposta');
        }
    } else {
        adicionarMensagemAoChat('Professor IA', 'Por favor, digite uma mensagem antes de enviar.', 'resposta');
    }
}

// Função para adicionar o botão "Tirar Dúvidas" a cada questão
function adicionarBotaoTirarDuvidas(questionDiv, navigationCounter) {
// Adicionar o botão "Tirar Dúvidas"
const duvidasButton = document.createElement('button');
duvidasButton.classList.add('duvidas-button');
duvidasButton.textContent = 'Tirar Dúvidas';

// Adiciona o evento de clique ao botão "Tirar Dúvidas"
duvidasButton.addEventListener('click', () => {
    
    toggleChatPopup(navigationCounter);
});

// Função que abre o popup de chat
buttonContainer.appendChild(duvidasButton);  // Adicionar o botão ao container

}

// Função para enviar os dados da questão para o chat
async function enviarDadosParaChat(dadosQuestao) {
    const mensagemParaAPI = {
        role: 'user',
        content: `Por favor, forneça o gabarito comentado para a seguinte questão:\n
        **Enunciado**: ${dadosQuestao.enunciado}\n
        **Alternativas**:\n${dadosQuestao.alternativas.map((alt, i) => `${String.fromCharCode(65 + i)}) ${alt}`).join('\n')}\n
        **Resposta Correta**: ${dadosQuestao.respostaCorreta}`
    };

    adicionarMensagemAoCache('user', mensagemParaAPI.content);

    const payload = {
        sessionId: 'sessao-exemplo',  // Ajuste conforme necessário
        messages: mensagensCache
    };

    try {
        const response = await axios.post('https://professor-ia-c39492e02422.herokuapp.com/chat', payload);
        adicionarMensagemAoChat('Professor IA', response.data.reply, 'resposta');
        adicionarMensagemAoCache('assistant', response.data.reply);
    } catch (error) {
        console.error('Erro ao enviar a pergunta:', error);
        adicionarMensagemAoChat('Professor IA', 'Erro ao processar o gabarito. Tente novamente.', 'resposta');
    }
}

function formatarGabarito(gabarito) {
    // Exemplo de formatação para aplicar negrito às respostas e quebra de linha
    return gabarito
        .replace(/Alternativa Correta:/g, '<strong>Alternativa Correta:</strong>') // Negrito na resposta correta
        .replace(/\n/g, '<br>'); // Adiciona quebras de linha
}
// Função para coletar dados da questão
function coletarDadosDaQuestao(questionDiv) {
    const enunciado = questionDiv.querySelector('p')?.textContent;
    const alternativas = Array.from(questionDiv.querySelectorAll('.answer-container label span'))
        .map(alt => alt.textContent);
    const respostaCorreta = questionDiv.querySelector('.correct')?.textContent || "Resposta correta não disponível";

    if (!enunciado || alternativas.length === 0) {
        console.error("Dados da questão estão incompletos.");
        return null;
    }

    return {
        enunciado: enunciado.trim(),
        alternativas: alternativas.map(alt => alt.trim()),
        respostaCorreta: respostaCorreta.trim()
    };
}


// Adicionar o event listener para o envio do chat
document.getElementById('chat-submit').addEventListener('click', enviarPergunta);

// Função para adicionar mensagem ao cache
function adicionarMensagemAoCache(role, content) {
    if (!mensagensCache.some(msg => msg.content === content)) {
        mensagensCache.push({ role: role, content: content });
    }
}

// Função para limpar o cache (opcional, se você quiser resetar)
function limparCache() {
    mensagensCache = [];
}
