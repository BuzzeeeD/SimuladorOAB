
window.initRanking = function () {
    console.log('Inicializando Ranking...');

    const top10Users = [
        { username: "João Silva", points: 250000000 }, // Lenda
        { username: "Maria Oliveira", points: 150000000 }, // Herói de Guerra
        { username: "Carlos Eduardo", points: 75000000 }, // Marechal
        { username: "Ana Paula", points: 30000000 }, // General de Exército
        { username: "Rafael Santos", points: 20000000 }, // General de Divisão
        { username: "Fernanda Costa", points: 15000000 }, // General de Brigada
        { username: "Lucas Martins", points: 10000000 }, // Coronel
        { username: "Gabriela Souza", points: 7500000 }, // Major
        { username: "Daniel Lima", points: 5000000 }, // Capitão
        { username: "Juliana Alves", points: 2500000 }, // Primeiro-Tenente
        { username: "Pedro Henrique", points: 1500000 }, // Segundo-Tenente
        { username: "Sofia Mendes", points: 1000000 }, // Aspirante a Oficial
        { username: "Matheus Almeida", points: 750000 }, // Subtenente
        { username: "Larissa Ferreira", points: 500000 }, // Primeiro-Sargento
        { username: "Ricardo Pereira", points: 300000 }, // Segundo-Sargento
        { username: "Patrícia Duarte", points: 200000 }, // Terceiro-Sargento
        { username: "Bruno Rodrigues", points: 100000 }, // Cabo
        { username: "Eduardo Nascimento", points: 50000 }, // Soldado
        { username: "Alice Monteiro", points: 30000 }, // Aspirante a Soldado
        { username: "Felipe Moura", points: 20000 } // Recruta
    ];

    const patentes = [
        { threshold: 200_000_000, name: "Lenda", image: "data/images/patentes/lenda.gif" },
        { threshold: 100_000_000, name: "Herói de Guerra", image: "data/images/patentes/heroideguerra.gif" },
        { threshold: 50_000_000, name: "Marechal", image: "data/images/patentes/marechal.gif" },
        { threshold: 20_000_000, name: "General de Exército", image: "data/images/patentes/generaldeexercito.gif" },
        { threshold: 15_000_000, name: "General de Divisão", image: "data/images/patentes/generaldedivisão.gif" },
        { threshold: 10_000_000, name: "General de Brigada", image: "data/images/patentes/generaldebrigada.gif" },
        { threshold: 7_500_000, name: "Coronel", image: "data/images/patentes/coronel.gif" },
        { threshold: 5_000_000, name: "Major", image: "data/images/patentes/major.gif" },
        { threshold: 2_500_000, name: "Capitão", image: "data/images/patentes/capitao.gif" },
        { threshold: 1_000_000, name: "Primeiro-Tenente", image: "data/images/patentes/primeiro-tenente.gif" },
        { threshold: 750_000, name: "Segundo-Tenente", image: "data/images/patentes/segundo-tenente.gif" },
        { threshold: 500_000, name: "Aspirante a Oficial", image: "data/images/patentes/aspiranteaoficial.gif" },
        { threshold: 300_000, name: "Subtenente", image: "data/images/patentes/subtenente.gif" },
        { threshold: 200_000, name: "Primeiro-Sargento", image: "data/images/patentes/primeiro-sargento.gif" },
        { threshold: 150_000, name: "Segundo-Sargento", image: "data/images/patentes/segundo-sargento.gif" },
        { threshold: 100_000, name: "Terceiro-Sargento", image: "data/images/patentes/terceiro-sargento.gif" },
        { threshold: 50_000, name: "Cabo", image: "data/images/patentes/cabo.gif" },
        { threshold: 30_000, name: "Soldado", image: "data/images/patentes/soldado.gif" },
        { threshold: 10_000, name: "Aspirante a Soldado", image: "data/images/patentes/aspiranteasoldado.gif" },
        { threshold: 1_000, name: "Recruta", image: "data/images/patentes/recruta.gif" },
        { threshold: 0, name: "Civil", image: "data/images/patentes/civil.gif" }
    ];

    const getPatente = (points) => patentes.find(p => points >= p.threshold) || { name: "Desconhecida", image: "" };

    const rankingBody = document.querySelector('.ranking-body');
    if (!rankingBody) {
        console.error('Elemento ranking-body não encontrado!');
        return;
    }

    top10Users.forEach((user, index) => {
        const { name: patenteName, image: patenteImage } = getPatente(user.points);

        const row = document.createElement('tr');
        const usernameHandle = `@${user.username.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '')}`;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><img src="${patenteImage}" alt="${patenteName}" class="patente-icon"></td>
            <td>${user.username} <span class="username-handle">(${usernameHandle})</span></td>
            <td>${user.points.toLocaleString('pt-BR')} pts</td>
            <td>${patenteName}</td>
        `;

        rankingBody.appendChild(row);
    });

    console.log('Ranking inicializado com sucesso.');
};
window.initRanking();