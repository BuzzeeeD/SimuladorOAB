
document.addEventListener('DOMContentLoaded', function () {
    const userMenu = document.querySelector('.user-menu');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const userIcon = document.querySelector('.user-icon');

    // Alternar visibilidade do menu ao clicar no ícone
    userIcon.addEventListener('click', function (e) {
        e.stopPropagation(); // Impede o evento de clicar de atingir o body
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', function () {
        dropdownMenu.style.display = 'none';
    });

    // Impedir fechamento ao clicar no menu
    dropdownMenu.addEventListener('click', function (e) {
        e.stopPropagation(); // Permite que os itens sejam clicados sem fechar o menu
    });
});
document.addEventListener('DOMContentLoaded', function () {
    const top10Users = [
        { username: "João Silva", points: 5500400 },
        { username: "Maria Oliveira", points: 4900495 },
        { username: "Carlos Eduardo", points: 3700450 },
        { username: "Ana Paula", points: 2400120 },
        { username: "Rafael Santos", points: 1600001},
        { username: "Fernanda Costa", points: 900350 },
        { username: "Lucas Martins", points: 640320 },
        { username: "Gabriela Souza", points: 530290 },
        { username: "Daniel Lima", points: 420255 },
        { username: "Juliana Alves", points: 360230 }
    ];

    const rankIcons = [
        '<i class="fas fa-crown rank-icon gold"></i>', // 1º lugar
        '<i class="fas fa-medal rank-icon silver"></i>', // 2º lugar
        '<i class="fas fa-award rank-icon bronze"></i>'  // 3º lugar
    ];

    // Mapeamento de insígnias militares
    const patentes = [
        { threshold: 200_000_000, name: "Lenda", image: "images/patentes/lenda.gif" },
        { threshold: 100_000_000, name: "Herói de Guerra", image: "images/patentes/heroideguerra.gif" },
        { threshold: 50_000_000, name: "Marechal", image: "images/patentes/marechal.gif" },
        { threshold: 20_000_000, name: "General de Exército", image: "images/patentes/generaldeexercito.gif" },
        { threshold: 15_000_000, name: "General de Divisão", image: "images/patentes/generaldedivisão.gif" },
        { threshold: 10_000_000, name: "General de Brigada", image: "images/patentes/generaldebrigada.gif" },
        { threshold: 7_500_000, name: "Coronel", image: "images/patentes/coronel.gif" },
        { threshold: 5_000_000, name: "Major", image: "images/patentes/major.gif" },
        { threshold: 2_500_000, name: "Capitão", image: "images/patentes/capitao.gif" },
        { threshold: 1_000_000, name: "Primeiro-Tenente", image: "images/patentes/primeiro-tenente.gif" },
        { threshold: 750_000, name: "Segundo-Tenente", image: "images/patentes/segundo-tenente.gif" },
        { threshold: 500_000, name: "Aspirante a Oficial", image: "images/patentes/aspiranteaoficial.gif" },
        { threshold: 300_000, name: "Subtenente", image: "images/patentes/subtenente.gif" },
        { threshold: 200_000, name: "Primeiro-Sargento", image: "images/patentes/primeiro-sargento.gif" },
        { threshold: 150_000, name: "Segundo-Sargento", image: "images/patentes/segundo-sargento.gif" },
        { threshold: 100_000, name: "Terceiro-Sargento", image: "images/patentes/terceiro-sargento.gif" },
        { threshold: 50_000, name: "Cabo", image: "images/patentes/cabo.gif" },
        { threshold: 30_000, name: "Soldado", image: "images/patentes/soldado.gif" },
        { threshold: 10_000, name: "Aspirante a Soldado", image: "images/patentes/aspiranteasoldado.gif" },
        { threshold: 1_000, name: "Recruta", image: "images/patentes/recruta.gif" },
        { threshold: 0, name: "Civil", image: "images/patentes/civil.gif" }
    ];
    
    /**
     * Retorna a patente correspondente à pontuação,
     * buscando a maior 'threshold' que seja <= pontuação.
     */
    const getPatente = (points) => {
        for (let i = 0; i < patentes.length; i++) {
            if (points >= patentes[i].threshold) {
                return patentes[i];
            }
        }
        // Se não encontrar, retorna a menor (caso threshold 0)
        return patentes[patentes.length - 1];
    };

    const dashboardGrid = document.querySelector('.dashboard-grid');

    top10Users.forEach((user, index) => {
        // Determina a patente de acordo com os pontos
        const { name: patenteName, icon: patenteIcon } = getPatente(user.points);
        const patente = patentes.find((p) => user.points >= p.threshold) || { name: "Desconhecida", image: "" };

        const listItem = document.createElement('li');
        listItem.classList.add('dashboard-item');

        // Ícone do top 3 (se existir), senão pega o ícone default de "star"
        const rankIcon = rankIcons[index] || `<i class="fas fa-star rank-icon default"></i>`;

        // Gerar o handle (@nomedeusuario) com base no username
        const usernameHandle = `@${user.username.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '')}`;

    // HTML com patente incluída
    listItem.innerHTML = `
        <span class="rank-position">${index + 1}</span>
        ${rankIcon}
        <span class="dashboard-user">
            ${user.username} <span class="username-handle">(${usernameHandle})</span>
        </span>
        <span class="dashboard-points">${user.points} pts</span>
        <div class="user-patente">
            <span class="patente-name">&nbsp[${patente.name}]&nbsp</span>
            <img src="${patente.image}" alt="${patente.name}" class="patente-icon">
        </div>
        </div>
    `;


        // Animação progressiva de exibição dos itens
        listItem.style.animationDelay = `${index * 0.1}s`;

        dashboardGrid.appendChild(listItem);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const featurePoints = document.getElementById('feature-points'); // Botão para abrir o popup (se aplicável)
    const popup = document.getElementById('popup'); // O popup em si
    const popupContent = document.querySelector('.popup-content'); // Conteúdo do popup
    const closePopup = document.querySelector('.close-popup'); // Botão "X" para fechar

    // Função para abrir o popup
    function openPopup() {
        popup.classList.remove('hidden'); // Remove a classe que oculta o popup
    }

    // Função para fechar o popup
    function closePopupHandler() {
        popup.classList.add('hidden'); // Adiciona a classe que oculta o popup
    }

    // Verificar se existe o botão para abrir o popup
    if (featurePoints) {
        featurePoints.addEventListener('click', openPopup); // Abre o popup ao clicar no botão
    }

    // Fechar o popup ao clicar no "X"
    closePopup.addEventListener('click', closePopupHandler);

    // Fechar o popup ao clicar fora do conteúdo
    popup.addEventListener('click', (event) => {
        if (!popupContent.contains(event.target)) {
            closePopupHandler();
        }
    });
});

//popupsistem
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            // Remove a classe ativa de todas as abas e botões
            tabButtons.forEach((b) => b.classList.remove('active'));
            tabContents.forEach((content) => content.classList.remove('active'));

            // Ativa a aba e o botão clicado
            const targetTab = btn.getAttribute('data-tab');
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Fechar popup ao clicar fora
    const popup = document.getElementById('popup');
    popup.addEventListener('click', (event) => {
        if (event.target === popup) {
            popup.classList.add('hidden');
            
        }
    });

    const closePopup = document.querySelector('.close-popup');
    closePopup.addEventListener('click', () => {
        popup.classList.add('hidden');
    });
});


    document.addEventListener('DOMContentLoaded', () => {
    // Selecionar todas as instâncias de carrosséis
    const carousels = document.querySelectorAll('.carousel-container, .carousel1-container');

    carousels.forEach((carouselContainer) => {
        const carousel = carouselContainer.querySelector('.carousel, .carousel1');
        const prevBtn = carouselContainer.querySelector('.prev-btn, .prev1-btn');
        const nextBtn = carouselContainer.querySelector('.next-btn, .next1-btn');

        let isDragging = false;
        let startX;
        let scrollLeft;

        // Função para navegação com botões
        prevBtn.addEventListener('click', () => {
            carousel.scrollLeft -= carousel.offsetWidth / 2; // Scroll para a esquerda
        });

        nextBtn.addEventListener('click', () => {
            carousel.scrollLeft += carousel.offsetWidth / 2; // Scroll para a direita
        });

        // Função para habilitar arrastar o carrossel
        carousel.addEventListener('mousedown', (e) => {
            isDragging = true;
            carousel.classList.add('dragging');
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });

        carousel.addEventListener('mouseleave', () => {
            isDragging = false;
            carousel.classList.remove('dragging');
        });

        carousel.addEventListener('mouseup', () => {
            isDragging = false;
            carousel.classList.remove('dragging');
        });

        carousel.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 1.5; // Ajuste de velocidade
            carousel.scrollLeft = scrollLeft - walk;
        });
    });
});

    document.querySelectorAll('.carousel-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const isNext = btn.classList.contains('next-btn');
            const carousel = btn.parentElement.querySelector('.carousel');
            const scrollAmount = carousel.offsetWidth;
            carousel.scrollBy({
                left: isNext ? scrollAmount : -scrollAmount,
                behavior: 'smooth',
            });
    });
    document.addEventListener('DOMContentLoaded', function () {
        const patentes = [
            { threshold: 200_000_000, name: "Lenda", image: "images/patentes/lenda.gif" },
            { threshold: 100_000_000, name: "Herói de Guerra", image: "images/patentes/heroideguerra.gif" },
            { threshold: 50_000_000, name: "Marechal", image: "images/patentes/marechal.gif" },
            { threshold: 20_000_000, name: "General de Exército", image: "images/patentes/generaldeexercito.gif" },
            { threshold: 15_000_000, name: "General de Divisão", image: "images/patentes/generaldedivisão.gif" },
            { threshold: 10_000_000, name: "General de Brigada", image: "images/patentes/generaldebrigada.gif" },
            { threshold: 7_500_000, name: "Coronel", image: "images/patentes/coronel.gif" },
            { threshold: 5_000_000, name: "Major", image: "images/patentes/major.gif" },
            { threshold: 2_500_000, name: "Capitão", image: "images/patentes/capitao.gif" },
            { threshold: 1_000_000, name: "Primeiro-Tenente", image: "images/patentes/primeiro-tenente.gif" },
            { threshold: 750_000, name: "Segundo-Tenente", image: "images/patentes/segundo-tenente.gif" },
            { threshold: 500_000, name: "Aspirante a Oficial", image: "images/patentes/aspiranteaoficial.gif" },
            { threshold: 300_000, name: "Subtenente", image: "images/patentes/subtenente.gif" },
            { threshold: 200_000, name: "Primeiro-Sargento", image: "images/patentes/primeiro-sargento.gif" },
            { threshold: 150_000, name: "Segundo-Sargento", image: "images/patentes/segundo-sargento.gif" },
            { threshold: 100_000, name: "Terceiro-Sargento", image: "images/patentes/terceiro-sargento.gif" },
            { threshold: 50_000, name: "Cabo", image: "images/patentes/cabo.gif" },
            { threshold: 30_000, name: "Soldado", image: "images/patentes/soldado.gif" },
            { threshold: 10_000, name: "Aspirante a Soldado", image: "images/patentes/aspiranteasoldado.gif" },
            { threshold: 1_000, name: "Recruta", image: "images/patentes/recruta.gif" },
            { threshold: 0, name: "Civil", image: "images/patentes/civil.gif" }
        ];
    
        const tableBody = document.getElementById('patente-table-body');
    
        // Limpa a tabela antes de preenchê-la
        tableBody.innerHTML = "";
    
        patentes.forEach((patente) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${patente.image}" alt="${patente.name}" class="patente-icon"></td>
                <td>${patente.name}</td>
                <td>${patente.threshold.toLocaleString()} pontos</td>
            `;
            tableBody.appendChild(row);
        });
    });
});
document.addEventListener("click", (event) => {
    const menuToggleBtn = document.getElementById("menuToggleBtn");
    const headerMiddle = document.getElementById("headerMiddle");
  
    // Verifica se o clique não foi no botão ou no menu
    if (!menuToggleBtn.contains(event.target) && !headerMiddle.contains(event.target)) {
      headerMiddle.classList.remove("active"); // Oculta o menu
    }
  });
  
  // Alterna o menu ao clicar no botão
  document.getElementById("menuToggleBtn").addEventListener("click", () => {
    const headerMiddle = document.getElementById("headerMiddle");
    headerMiddle.classList.toggle("active");
  });
