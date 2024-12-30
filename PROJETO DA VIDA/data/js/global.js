document.addEventListener('DOMContentLoaded', () => {
    console.log("global.js inicializado com sucesso!");

    const menuItems = document.querySelectorAll('.menu-item');
    const mainContent = document.querySelector('.main-content');

    let chartInstances = {}; // Objeto para armazenar instâncias de gráficos por aba

    // Função para carregar HTML dinamicamente
    const loadContent = async (url, scriptPath) => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const content = await response.text();
                mainContent.innerHTML = content;
    
                console.log(`Conteúdo carregado de: ${url}`);
    
                // Carregar o script associado
                if (scriptPath) {
                    await loadScript(scriptPath);
                } else {
                    console.warn(`Nenhum script associado encontrado para: ${url}`);
                }
    
                // Re-inicializar gráficos se a aba carregada for Painel de Controle
                if (scriptPath && scriptPath.includes('painel-de-controle.js')) {
                    setTimeout(() => {
                        if (typeof window.initPainelDeControle === 'function') {
                            window.initPainelDeControle(); // Re-inicializar gráficos
                        } else {
                            console.error('Função initPainelDeControle não encontrada!');
                        }
                    }, 100); // Delay para garantir que o DOM foi atualizado
                }
            } else {
                mainContent.innerHTML = `<p>Erro ao carregar a página: ${response.status}</p>`;
            }
        } catch (error) {
            mainContent.innerHTML = `<p>Erro ao carregar a página: ${error.message}</p>`;
        }
    };

    // Função para carregar um script de forma assíncrona
    const loadScript = async (scriptPath) => {
        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector(`script[src="${scriptPath}"]`);
            if (existingScript) {
                console.log(`Removendo script existente: ${scriptPath}`);
                existingScript.remove();
            }

            const script = document.createElement('script');
            script.src = scriptPath;
            script.defer = true;
            script.onload = () => {
                console.log(`Script ${scriptPath} carregado com sucesso!`);
                resolve();
            };
            script.onerror = () => {
                console.error(`Erro ao carregar o script: ${scriptPath}`);
                reject(new Error(`Erro ao carregar o script: ${scriptPath}`));
            };
            document.body.appendChild(script);
        });
    };


    // Adicionar eventos de clique nos itens do menu
    menuItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionUrl = item.getAttribute('href'); // URL da seção HTML
            const scriptPath = item.getAttribute('data-script'); // Caminho do script associado
            console.log(`Carregando seção: ${sectionUrl} com script: ${scriptPath}`);
            loadContent(sectionUrl, scriptPath);

            // Atualizar o estado ativo do menu
            menuItems.forEach((el) => el.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Carregar a seção padrão ao iniciar
    const defaultSection = menuItems[0]?.getAttribute('href'); // Pega o primeiro item como padrão
    const defaultScript = menuItems[0]?.getAttribute('data-script'); // Script associado à seção padrão
    if (defaultSection && defaultScript) {
        console.log(`Carregando seção padrão: ${defaultSection}`);
        loadContent(defaultSection, defaultScript);
    } else {
        console.error("Nenhuma seção padrão encontrada!");
    }
});
