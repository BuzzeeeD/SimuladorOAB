$(document).ready(function () {
    let chartInstance = null;  // Agora é garantido que está no escopo global
    let disciplineData = {};  // Para armazenar dados das disciplinas
    let jsonData = [];  // Definindo jsonData como variável global
    let totalQuestions = 0;
    let annulledQuestions = 0;
    function loadExcel() {
        // Reinicializa os contadores para evitar acumulação
        totalQuestions = 0;
        annulledQuestions = 0;
        disciplineData = {};

        fetch('data/dados/OAB/dataoab.xlsx') // Caminho do arquivo Excel
            .then(response => response.arrayBuffer())
            .then(data => {
                const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
                
                // Limpa jsonData antes de adicionar novos dados
                jsonData = [];
                
                // Processa todas as folhas e acumula os dados no jsonData
                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const sheetData = XLSX.utils.sheet_to_json(sheet, { skipHeader: true });
                    jsonData = jsonData.concat(sheetData);  // Adiciona dados da folha atual ao jsonData consolidado
                });

                // Processa jsonData consolidado para construir disciplineData
                jsonData.forEach(row => {
                    totalQuestions++;
                    if (row["Resposta Certa"] === "Anulada") {
                        annulledQuestions++;
                    }
                    const disciplina = row["Disciplina"];
                    if (disciplina) {
                        if (!disciplineData[disciplina]) {
                            disciplineData[disciplina] = { total: 0, breadcrumbs: {} };
                        }
                        disciplineData[disciplina].total += 1;
                        
                        // Percorre todas as colunas que começam com "Breadcrumb"
                        Object.keys(row).forEach(key => {
                            if (key.startsWith("Breadcrumb") && row["Disciplina"] === disciplina) {  // Verifica a correspondência exata
                                const breadcrumb = row[key];
                                if (breadcrumb) {
                                    const level = parseInt(key.match(/\d+/)[0], 10);  // Identifica o nível do breadcrumb
                                    if (!disciplineData[disciplina].breadcrumbs[level]) {
                                        disciplineData[disciplina].breadcrumbs[level] = {};
                                    }
                                    disciplineData[disciplina].breadcrumbs[level][breadcrumb] =
                                        (disciplineData[disciplina].breadcrumbs[level][breadcrumb] || 0) + 1;
                                }
                            }
                        });
                    }
                });

                displayQuestionCounter();
                renderDisciplineChart(disciplineData, 'discipline');
                populateDisciplineTable(disciplineData);
            })
            .catch(error => console.error('Erro ao carregar a planilha:', error));
    }
    
    function displayQuestionCounter() {
        const validQuestions = totalQuestions - annulledQuestions;
        const counterElement = document.getElementById('questionCounter');
        counterElement.textContent = `Nosso banco de dados possui ${totalQuestions} questões verificadas, ${validQuestions} atualizadas, ${annulledQuestions} filtradas entre desatualizadas e anuladas.`;
    }

    loadExcel();
    // Função para renderizar o gráfico de disciplinas
    $('#chartSelector').on('change', function () {
        const selectedValue = $(this).val();

        // Fazer fadeOut do gráfico atual antes de atualizar
        $('#chartDiscipline').fadeOut(200, function () {
            // Atualizar o gráfico depois que o fadeOut estiver completo
            renderDisciplineChart(disciplineData, selectedValue); // Atualiza o gráfico
            // Fazer fadeIn do gráfico depois de ser atualizado
            $('#chartDiscipline').fadeIn(300);
        });
    });

    // Animações para o seletor de gráficos
    $('#chartSelector').on('focus', function () {
        $(this).css('box-shadow', '0 0 10px rgba(0, 123, 255, 0.7)');
    });

    $('#chartSelector').on('blur', function () {
        $(this).css('box-shadow', 'none');
    });

    $('#chartSelector').on('mouseenter', function () {
        $(this).animate({
            'border-color': '#0056b3',
            'background-color': '#e2e6ea'
        }, 200);
    }).on('mouseleave', function () {
        $(this).animate({
            'border-color': '#007bff',
            'background-color': '#f8f9fa'
        }, 200);
    });

    function populateDisciplineTable(disciplineData) {
        const $disciplineBody = $('#disciplineBody');
        $disciplineBody.empty();
    
        const sortedDisciplines = Object.entries(disciplineData).sort((a, b) => b[1].total - a[1].total);
        let disciplineCounter = 1;
        sortedDisciplines.forEach(([disciplina, data], index) => {
            const parentNumber = `${disciplineCounter}`;
            const $row = $(`<tr class="discipline-row" data-index="${index}" data-disciplina="${disciplina}">
                <td class="discipline-expandable">
                    <span class="toggle-arrow" data-expanded="false">▶</span> ${parentNumber}. ${truncateText(disciplina)}
                </td>
                <td class="quantity-column">${data.total} questões</td>
            </tr>`);
            $row.appendTo($disciplineBody);
    
            $row.on('click', function () {
                const isLoaded = $row.attr('data-loaded');
                const $arrow = $row.find('.toggle-arrow');
                const selectedDisciplina = $row.attr('data-disciplina');
    
                if (!isLoaded) {
                    renderBreadcrumbs(data.breadcrumbs, index, $row, parentNumber, selectedDisciplina);
                    $row.attr('data-loaded', 'true');
                }
                toggleBreadcrumbVisibility(index, 1, $arrow);
            });
            disciplineCounter++;
        });
    }
    

    function renderDisciplineChart(disciplineData, chartType = 'discipline') {
        if (chartInstance) {
            chartInstance.destroy();  // Destruir o gráfico anterior
        }
    
        const ctx = document.getElementById('chartDiscipline').getContext('2d');
    
        if (chartType === 'discipline') {
            // Exibir disciplinas
            const sortedData = Object.entries(disciplineData).sort((a, b) => b[1].total - a[1].total);
            const top18Data = sortedData.slice(0, 18);
            const labels = top18Data.map(([disciplina]) => truncateText(disciplina));
            const values = top18Data.map(([, data]) => data.total);
    
            const colors = top18Data.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`);
    
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Quantidade de questões',
                        data: values,
                        backgroundColor: colors,
                        borderColor: colors.map(color => color.replace('0.7', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        x: {
                            ticks: {
                                callback: function(value) {
                                    if (value.length > 10) {
                                        return value.substr(0, 10) + '...';  // Trunca os rótulos longos
                                    }
                                    return value;
                                }
                            }
                        },
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        tooltip: {
                            bodyFont: {
                                size: 16
                            },
                            titleFont: {
                                size: 18
                            },
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.raw + ' questões';
                                }
                            }
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            });
    
            function adjustLegendLayout() {
                const legendContainer = document.getElementById('custom-legend');
                legendContainer.innerHTML = '';  // Limpar a legenda anterior
            
                // Detectar o tamanho da tela para ajustar o layout da legenda
                if (window.innerWidth <= 768) {  // Verificar se a largura da janela é menor ou igual a 768px (mobile)
                    // Estilos para dispositivos móveis (uma coluna ocupando toda a largura)
                    legendContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(100%, 1fr))';
                    legendContainer.style.padding = '0px';  // Sem padding para economizar espaço
                } else {
                    // Estilos para desktop (3 colunas)
                    legendContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';  // 3 colunas no desktop
                    legendContainer.style.padding = '10px';  // Adicionar padding no desktop
                    legendContainer.style.columnGap = '5px';  // Espaço entre as colunas
                    legendContainer.style.rowGap = '10px';  // Espaço entre as linhas
                }
            
                // Aplicar estilo de contêiner para criar colunas
                legendContainer.style.display = 'grid';
            
                labels.forEach((label, index) => {
                    const legendItem = document.createElement('div');
                    const quantity = values[index];  // O valor correspondente ao número de questões
            
                    // Conteúdo da legenda com a quantidade de questões
                    legendItem.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <div style="width: 15px; height: 15px; background-color: ${colors[index]}; margin-right: 10px; border-radius: 3px;"></div>
                        <span style="font-size: 14px; font-weight: 500;">${label}</span>
                        <span style="font-size: 14px; font-weight: 500; margin-left: 5px;"> <span style="color: #6128ff;"> (${quantity} questões)</span>
                    </div>
                `;
            
                    // Adicionar o evento de "hover" para destacar o respectivo item no gráfico
                    legendItem.addEventListener('mouseover', () => {
                        const meta = chartInstance.getDatasetMeta(0);
                        const rect = meta.data[index];
            
                        // Simula a exibição do tooltip no gráfico
                        chartInstance.tooltip.setActiveElements([{ datasetIndex: 0, index: index }], {
                            x: rect.x,
                            y: rect.y
                        });
                        chartInstance.update();
                    });
            
                    legendItem.addEventListener('mouseout', () => {
                        // Esconde o tooltip quando o mouse sai do item da legenda
                        chartInstance.tooltip.setActiveElements([], {});
                        chartInstance.update();
                    });
            
                    legendContainer.appendChild(legendItem);
                });
            }
            // Chamar a função para ajustar a legenda inicialmente
            adjustLegendLayout();
 
            // Reajustar a legenda quando a janela for redimensionada
        window.addEventListener('resize', adjustLegendLayout);
        } else if (chartType === 'breadcrumbs') {
            // Exibir breadcrumbs (Assuntos)
            const breadcrumbData = processBreadcrumbData(jsonData);  // Processa todos os breadcrumbs no jsonData
            const sortedBreadcrumbs = Object.entries(breadcrumbData).sort((a, b) => b[1] - a[1]);
            const top20Breadcrumbs = sortedBreadcrumbs.slice(0, 20);
    
            const labels = top20Breadcrumbs.map(([breadcrumb]) => truncateText(breadcrumb));
            const values = top20Breadcrumbs.map(([, count]) => count);
    
            const colors = top20Breadcrumbs.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`);
    
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Quantidade de questões',
                        data: values,
                        backgroundColor: colors,
                        borderColor: colors.map(color => color.replace('0.7', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        x: {
                            ticks: {
                                callback: function(value) {
                                    if (value.length > 10) {
                                        return value.substr(0, 10) + '...';
                                    }
                                    return value;
                                }
                            }
                        },
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        tooltip: {
                            bodyFont: {
                                size: 16
                            },
                            titleFont: {
                                size: 18
                            },
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.raw + ' questões';
                                }
                            }
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            });
    
            // Criar a legenda manualmente para breadcrumbs
            const legendContainer = document.getElementById('custom-legend');
            legendContainer.innerHTML = '';  // Limpar a legenda anterior
                        // Detectar o tamanho da tela para ajustar o layout da legenda
                        if (window.innerWidth <= 768) {  // Verificar se a largura da janela é menor ou igual a 768px (mobile)
                            // Estilos para dispositivos móveis (uma coluna ocupando toda a largura)
                            legendContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(100%, 1fr))';
                            legendContainer.style.padding = '0px';  // Sem padding para economizar espaço
                        } else {
                            // Estilos para desktop (3 colunas)
                            legendContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';  // 3 colunas no desktop
                            legendContainer.style.padding = '10px';  // Adicionar padding no desktop
                            legendContainer.style.columnGap = '5px';  // Espaço entre as colunas
                            legendContainer.style.rowGap = '10px';  // Espaço entre as linhas
                        }
                    
                        // Aplicar estilo de contêiner para criar colunas
                        legendContainer.style.display = 'grid';
                    
                        labels.forEach((label, index) => {
                            const legendItem = document.createElement('div');
                            const quantity = values[index];  // O valor correspondente ao número de questões
                    
                            // Conteúdo da legenda com a quantidade de questões
                            legendItem.innerHTML = `
                            <div style="display: flex; align-items: center;">
                                <div style="width: 15px; height: 15px; background-color: ${colors[index]}; margin-right: 10px; border-radius: 3px;"></div>
                                <span style="font-size: 14px; font-weight: 500;">${label}</span>
                                <span style="font-size: 14px; font-weight: 500; margin-left: 5px;"> <span style="color: #6128ff;"> (${quantity} questões)</span>
                            </div>
                        `;
                            legendContainer.appendChild(legendItem);
                        });
                    }
                }
                

function processBreadcrumbData(jsonData) {
    const breadcrumbData = {};

    jsonData.forEach(row => {
        // Percorre todas as colunas de breadcrumb
        Object.keys(row).forEach(key => {
            if (key.startsWith("Breadcrumb")) {  // Seleciona apenas colunas de breadcrumb
                const breadcrumb = row[key];
                
                if (breadcrumb) {
                    // Incrementa o contador para cada breadcrumb específico
                    breadcrumbData[breadcrumb] = (breadcrumbData[breadcrumb] || 0) + 1;
                }
            }
        });
    });

    return breadcrumbData;
}
    // Outras funções de manipulação dos breadcrumbs e animações
    function toggleBreadcrumbVisibility(index, level, $arrow) {
        const $allRows = $(`.breadcrumb-row-${index}`);
        const $levelRows = $(`.breadcrumb-row-${index}[data-level="${level}"]`);

        // Alternar a visibilidade do nível atual
        $levelRows.toggle();

        if ($levelRows.is(':visible')) {
            $arrow.text('▼'); // Alterar a seta para baixo
        } else {
            $arrow.text('▶'); // Alterar a seta para direita

            // Se estamos ocultando o nível atual, também ocultar todos os níveis abaixo
            $allRows.each(function () {
                const rowLevel = parseInt($(this).attr('data-level'), 10);
                if (rowLevel > level) {
                    $(this).hide(); // Ocultar todos os níveis subsequentes
                }
            });
        }
    }


// Função para buscar todas as linhas que contêm o breadcrumb específico no banco de dados
function getRowData(breadcrumb, discipline) {
    return jsonData.filter(row =>
        row["Disciplina"] === discipline &&
        Object.values(row).includes(breadcrumb)
    );
}

function countQuestionsForBreadcrumb(breadcrumb, discipline) {
    return jsonData.filter(row =>
        row["Disciplina"] === discipline &&
        Object.keys(row).some(key => key.startsWith("Breadcrumb") && row[key] === breadcrumb)
    ).length;
}

function renderBreadcrumbs(breadcrumbsByLevel, index, $parentRow, parentNumber, selectedDisciplina) {
    const $fragment = $(document.createDocumentFragment());

    // Itera pelos níveis de breadcrumbs
    $.each(breadcrumbsByLevel, function (level, breadcrumbs) {
        // Cria uma array de breadcrumbs com suas contagens calculadas
        const breadcrumbsWithCounts = Object.keys(breadcrumbs).map(breadcrumb => {
            const questionCount = countQuestionsForBreadcrumb(breadcrumb, selectedDisciplina);
            return { breadcrumb, questionCount };
        });

        // Ordena os breadcrumbs em ordem decrescente de contagem
        const sortedBreadcrumbs = breadcrumbsWithCounts.sort((a, b) => b.questionCount - a.questionCount);

        // Cria linhas para cada breadcrumb ordenado
        $.each(sortedBreadcrumbs, function (_, { breadcrumb, questionCount }) {
            if (questionCount > 0) {  // Exibe apenas breadcrumbs com questões
                const $breadcrumbRow = $(`<tr class="breadcrumb-list breadcrumb-row-${index} breadcrumb-level-${level}" data-level="${level}" data-breadcrumb="${breadcrumb}">
                    <td class="breadcrumb-expandable" style="padding-left: ${level * 20}px;">
                        <span class="toggle-arrow"></span> ${breadcrumb}
                    </td>
                    <td class="quantity-column">${questionCount} questões</td>
                </tr>`);

                $breadcrumbRow.hide(); // Oculta inicialmente até expandir
                $fragment.append($breadcrumbRow);

                $breadcrumbRow.on('click', function (event) {
                    event.stopPropagation();
                    const rowsData = getRowData(breadcrumb, selectedDisciplina);
                    showPopupWithData(rowsData);
                });
            }
        });
    });

    $parentRow.after($fragment); // Insere os breadcrumbs após a linha da disciplina
}

    // Função para truncar textos longos
    function truncateText(text, maxLength = 30) {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }

});
document.getElementById('return-button').addEventListener('click', function() {
    window.location.href = 'index.html';  // Redireciona para a página index.html
});
function populateDisciplineSelector(disciplineData) {
    const $disciplineSelector = $('#disciplineSelector');
    $disciplineSelector.empty(); // Limpar o seletor antes de preenchê-lo

    // Adicionar a opção padrão
    $disciplineSelector.append('<option value="">Selecione uma Disciplina</option>');

    // Preencher o seletor com as disciplinas
    Object.keys(disciplineData).forEach(disciplina => {
        $disciplineSelector.append(`<option value="${disciplina}">${disciplina}</option>`);
    });
}
// Função para exibir dados das questões em um popup
function showPopupWithData(rowsData) {
    let popupContent = `
        <div class="popup-content">
            <button id="closePopup" class="close-button">Fechar</button>
            <h2 class="popup-header">Banco de Dados</h2>
            <div id="scrollable-container">
    `;

    // Itera por cada questão e cria um bloco com botão de copiar
    rowsData.forEach((rowData, index) => {
        popupContent += `
            <div class="question-container" id="question-container-${index}">
                <h3>Questão ${index + 1}</h3>
                <button class="copy-button" data-index="${index}">Copiar</button>
                <div class="question-data" id="question-data-${index}">
        `;
        
        // Adiciona cada coluna da questão como um bloco de dados
        Object.keys(rowData).forEach(column => {
            popupContent += `<div class="data-block"><strong>${column}:</strong> ${rowData[column] || 'N/A'}</div>`;
        });
        popupContent += `</div></div><hr class="divider">`; // Divider entre questões
    });

    popupContent += `</div></div>`;

     // Exibe o popup com o conteúdo formatado
     const popupOverlay = document.createElement('div');
     popupOverlay.className = 'popup-overlay';
     popupOverlay.innerHTML = popupContent;
     document.body.appendChild(popupOverlay);
 
     // Fechar popup ao clicar no botão de fechar
     document.getElementById('closePopup').addEventListener('click', () => document.body.removeChild(popupOverlay));
     popupOverlay.addEventListener('click', (e) => {
         if (e.target === popupOverlay) {
             document.body.removeChild(popupOverlay);
         }
     });
 

    // Configura evento de copiar para cada botão de copiar no popup
    rowsData.forEach((_, index) => {
        document.querySelector(`#question-container-${index} .copy-button`).addEventListener('click', function () {

            // Coleta todo o texto da questão atual
            const questionDataText = Array.from(document.querySelectorAll(`#question-data-${index} .data-block`))
                .map(block => block.innerText)
                .join('\n');
            
            
            // Copia o conteúdo para a área de transferência
            navigator.clipboard.writeText(questionDataText).then(() => {
                alert('Questão copiada para a área de transferência!');
            }).catch(err => {
                alert('Falha ao copiar os dados');
            });
        });
    });
}
