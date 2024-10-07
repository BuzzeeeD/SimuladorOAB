$(document).ready(function () {
    let chartInstance = null;  // Agora é garantido que está no escopo global
    let disciplineData = {};  // Para armazenar dados das disciplinas

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
            
                // Processar o arquivo Excel e popular disciplineData
                workbook.SheetNames.forEach(sheetName => {
                    console.log(`Abrindo folha: ${sheetName}`);  // Exibe o nome da folha no console
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { skipHeader: true });
    
                    jsonData.forEach(row => {
                        if (row) {  // Verifica se a linha existe e é válida
                            totalQuestions++; // Contabiliza o total de questões
    
                            // Verifica se a questão é anulada na coluna "Resposta Certa"
                            if (row["Resposta Certa"] && row["Resposta Certa"] === "Anulada") {
                                annulledQuestions++;
                            }
    
                            const disciplina = row["Disciplina"];
                            if (disciplina) {
                                if (!disciplineData[disciplina]) {
                                    disciplineData[disciplina] = { total: 0, breadcrumbs: {} };
                                }
                                disciplineData[disciplina].total += 1;
    
                                // Processar breadcrumbs por nível
                                Object.keys(row).forEach(key => {
                                    if (key.startsWith("Breadcrumb")) {
                                        const breadcrumbLevel = key.match(/\d+/);
                                        const breadcrumb = row[key];
                                        if (breadcrumb && disciplina && breadcrumbLevel) {
                                            const level = parseInt(breadcrumbLevel[0], 10);
                                            if (!disciplineData[disciplina].breadcrumbs[level]) {
                                                disciplineData[disciplina].breadcrumbs[level] = {};
                                            }
                                            disciplineData[disciplina].breadcrumbs[level][breadcrumb] =
                                                (disciplineData[disciplina].breadcrumbs[level][breadcrumb] || 0) + 1;
                                        }
                                    }
                                });
                            }
                        }
                    });
                });
            
                // Exibe o contador na página
                displayQuestionCounter();
            
                // Chamar a função de renderização do gráfico
                renderDisciplineChart(disciplineData, 'discipline');
            
                // Preencher a tabela de disciplinas
                populateDisciplineTable(disciplineData);
            })
            .catch(error => console.error('Erro ao carregar a planilha:', error));
    }
    
    function displayQuestionCounter() {
        const validQuestions = totalQuestions - annulledQuestions;
        const counterElement = document.getElementById('questionCounter');
        counterElement.textContent = `Nosso banco de dados possui ${totalQuestions} questões verificadas, ${validQuestions} atualizadas, ${annulledQuestions} filtradas entre desatualizadas e anuladas.`;
    }
    
    // Chamar a função para carregar o Excel automaticamente
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

    // Função para preencher a tabela de disciplinas
    function populateDisciplineTable(disciplineData) {
        const $disciplineBody = $('#disciplineBody');
        $disciplineBody.empty();  // Limpa a tabela

        const sortedDisciplines = Object.entries(disciplineData).sort((a, b) => {
            return b[1].total - a[1].total;
        });

        let disciplineCounter = 1;  // Contador para disciplinas
        sortedDisciplines.forEach(([disciplina, data], index) => {
            const parentNumber = `${disciplineCounter}`;  // Numeração principal (1., 2., etc.)
            const $row = $(`<tr class="discipline-row" data-index="${index}">
                <td class="discipline-expandable">
                    <span class="toggle-arrow" data-expanded="false">▶</span>
                    ${parentNumber}. ${truncateText(disciplina)}
                </td>
                <td class="quantity-column">${data.total} questões</td>
            </tr>`);

            $row.appendTo($disciplineBody);

            // Adiciona evento de clique para carregar breadcrumbs via lazy loading
            $row.on('click', function () {
                const isLoaded = $row.attr('data-loaded');
                const $arrow = $row.find('.toggle-arrow');

                if (!isLoaded) {
                    renderBreadcrumbs(data.breadcrumbs, index, $row, parentNumber);
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
                            // Aumentar o tamanho da fonte do tooltip
                            bodyFont: {
                                size: 16  // Aumentar o tamanho da fonte para 16px
                            },
                            titleFont: {
                                size: 18  // Aumentar o tamanho da fonte do título para 18px
                            },
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.raw + ' questões';
                                }
                            }
                        },
                        legend: {
                            display: false  // Esconder a legenda padrão
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
            // Exibir breadcrumbs
            const breadcrumbData = processBreadcrumbData(disciplineData);
            const sortedBreadcrumbs = Object.entries(breadcrumbData).sort((a, b) => b[1] - a[1]);
            const top20Breadcrumbs = sortedBreadcrumbs.slice(0, 20);
    
            const labels = top20Breadcrumbs.map(([breadcrumb]) => truncateText(breadcrumb)); // Usar a função de truncamento
            const values = top20Breadcrumbs.map(([, count]) => count);
    
            const colors = top20Breadcrumbs.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`);
    
            // Criar o novo gráfico
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
                            // Aumentar o tamanho da fonte do tooltip
                            bodyFont: {
                                size: 16  // Aumentar o tamanho da fonte para 16px
                            },
                            titleFont: {
                                size: 18  // Aumentar o tamanho da fonte do título para 18px
                            },
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.raw + ' questões';
                                }
                            }
                        },
                        legend: {
                            display: false  // Esconder a legenda padrão
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
                

    function processBreadcrumbData(disciplineData) {
        const breadcrumbData = {};

        Object.values(disciplineData).forEach(({ breadcrumbs }) => {
            Object.entries(breadcrumbs).forEach(([level, breadcrumbItems]) => {
                Object.entries(breadcrumbItems).forEach(([breadcrumb, count]) => {
                    breadcrumbData[breadcrumb] = (breadcrumbData[breadcrumb] || 0) + count;
                });
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
    function renderBreadcrumbs(breadcrumbsByLevel, index, $parentRow) {
        const $fragment = $(document.createDocumentFragment());
    
        // Percorrer os breadcrumbs disponíveis (Breadcrumb 1, 2 e 3)
        $.each(breadcrumbsByLevel, function (level, breadcrumbs) {
            const sortedBreadcrumbs = Object.entries(breadcrumbs).sort((a, b) => b[1] - a[1]);
    
            $.each(sortedBreadcrumbs, function (_, [breadcrumb, count]) {
                const hasChildren = breadcrumbsByLevel[level + 1] && Object.keys(breadcrumbsByLevel[level + 1]).length > 0;
    
                // Cria a linha do breadcrumb com recuo visual para a hierarquia
                const $breadcrumbRow = $(`<tr class="breadcrumb-list breadcrumb-row-${index} breadcrumb-level-${level}" data-level="${level}" data-breadcrumb="${breadcrumb}">
                    <td class="breadcrumb-expandable" style="padding-left: ${level * 20}px;">
                        ${hasChildren ? '<span class="toggle-arrow">▶</span>' : ''} 
                        ${(breadcrumb)}
                    </td>
                    <td class="quantity-column">${count} questões</td>
                </tr>`);
    
                $breadcrumbRow.hide(); // Ocultar inicialmente
                $fragment.append($breadcrumbRow);
    
                // Adiciona funcionalidade de clique para expandir/colapsar subníveis
                if (hasChildren) {
                    $breadcrumbRow.addClass('breadcrumb-has-children');
                    $breadcrumbRow.on('click', function () {
                        toggleNextLevel(index, level, breadcrumb, $breadcrumbRow);
                    });
                }
            });
        });
    
        // Inserir fragmento abaixo do pai
        $parentRow.after($fragment);
    }

    function toggleNextLevel(index, currentLevel, currentBreadcrumb, $currentRow) {
        const $nextLevelRows = $(`.breadcrumb-row-${index}[data-level="${currentLevel + 1}"]`);
        const $arrow = $currentRow.find('.toggle-arrow');
        const isVisible = $nextLevelRows.is(':visible');
    
        if (isVisible) {
            // Se os filhos diretos estão visíveis, ocultar todos os filhos e subníveis
            $nextLevelRows.each(function () {
                const $row = $(this);
                if ($(this).prev().attr('data-breadcrumb') === currentBreadcrumb) {
                    $row.hide(); // Oculta o filho direto
                    $row.find('.toggle-arrow').text('▶'); // Reseta a seta
                    // Ocultar subníveis de forma recursiva
                    toggleNextLevel(index, parseInt($row.attr('data-level')), $row.attr('data-breadcrumb'), $row);
                }
            });
            $arrow.text('▶'); // Altera a seta para direita
        } else {
            // Exibir os filhos diretos
            $nextLevelRows.each(function () {
                if ($(this).prev().attr('data-breadcrumb') === currentBreadcrumb) {
                    $(this).show(); // Exibir o filho direto
                }
            });
            $arrow.text('▼'); // Altera a seta para baixo
        }
    }

    // Função para truncar textos longos
    function truncateText(text, maxLength = 30) {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }

    function collapseSubLevels(index, level) {
        const $subLevelRows = $(`.breadcrumb-row-${index}[data-level="${level}"]`);
        $subLevelRows.each(function () {
            $(this).hide();  // Ocultar subnível
            $(this).find('.toggle-arrow').text('▶');  // Reseta a seta para direita
            collapseSubLevels(index, level + 1);  // Recursivamente ocultar subníveis abaixo
        });
    }
    
    // Função para truncar textos com mais de 20 caracteres
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
