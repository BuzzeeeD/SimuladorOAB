let subjectChartInstance = null;
let examinerChartInstance = null;
let negativeChartInstance = null;
let performanceChartInstance = null;
let activityLineChartInstance = null;
const performanceChartCanvas = document.getElementById('performanceChart');
performanceChartCanvas.style.width = '500px';
performanceChartCanvas.style.height = '250px';

document.addEventListener('DOMContentLoaded', function () {
    const pontosUsuario = 5_500_000; // Exemplo de pontuação do usuário

    const patentes = [
        { threshold: 200_000_000, name: "Lenda", image: "/data/images/patentes/lenda.gif" },
        { threshold: 100_000_000, name: "Herói de Guerra", image: "/data/images/patentes/heroideguerra.gif" },
        { threshold: 50_000_000, name: "Marechal", image: "/data/images/patentes/marechal.gif" },
        { threshold: 20_000_000, name: "General de Exército", image: "/data/images/patentes/generaldeexercito.gif" },
        { threshold: 15_000_000, name: "General de Divisão", image: "/data/images/patentes/generaldedivisão.gif" },
        { threshold: 10_000_000, name: "General de Brigada", image: "/data/images/patentes/generaldebrigada.gif" },
        { threshold: 7_500_000, name: "Coronel", image: "/data/images/patentes/coronel.gif" },
        { threshold: 5_000_000, name: "Major", image: "data/images/patentes/major.gif" },
        { threshold: 2_500_000, name: "Capitão", image: "/data/images/patentes/capitao.gif" },
        { threshold: 1_000_000, name: "Primeiro-Tenente", image: "/data/images/patentes/primeiro-tenente.gif" },
        { threshold: 750_000, name: "Segundo-Tenente", image: "/data/images/patentes/segundo-tenente.gif" },
        { threshold: 500_000, name: "Aspirante a Oficial", image: "/data/images/patentes/aspiranteaoficial.gif" },
        { threshold: 300_000, name: "Subtenente", image: "/data/images/patentes/subtenente.gif" },
        { threshold: 200_000, name: "Primeiro-Sargento", image: "/data/images/patentes/primeiro-sargento.gif" },
        { threshold: 150_000, name: "Segundo-Sargento", image: "/data/images/patentes/segundo-sargento.gif" },
        { threshold: 100_000, name: "Terceiro-Sargento", image: "/data/images/patentes/terceiro-sargento.gif" },
        { threshold: 50_000, name: "Cabo", image: "/data/images/patentes/cabo.gif" },
        { threshold: 30_000, name: "Soldado", image: "/data/images/patentes/soldado.gif" },
        { threshold: 10_000, name: "Aspirante a Soldado", image: "/data/images/patentes/aspiranteasoldado.gif" },
        { threshold: 1_000, name: "Recruta", image: "/data/images/patentes/recruta.gif" },
        { threshold: 0, name: "Civil", image: "/data/images/patentes/civil.gif" }
    ];

    function determinarPatente(pontos) {
        return patentes.find(p => pontos >= p.threshold) || { name: "Desconhecida", image: "" };
    }

    function calcularProgresso(pontos) {
        const patenteAtual = determinarPatente(pontos);
        const nextPatenteIndex = patentes.findIndex(p => p.threshold === patenteAtual.threshold) - 1;
        const nextPatente = patentes[nextPatenteIndex];

        if (!nextPatente) return { porcentagem: 100, restante: 0 };

        const progressoAtual = pontos - patenteAtual.threshold;
        const progressoTotal = nextPatente.threshold - patenteAtual.threshold;
        const porcentagem = Math.floor((progressoAtual / progressoTotal) * 100);
        const restante = nextPatente.threshold - pontos;

        return { porcentagem, restante, nextPatente };
    }

    const patenteAtual = determinarPatente(pontosUsuario);
    const progresso = calcularProgresso(pontosUsuario);

    if (patenteAtual.image) {
        document.getElementById("user-patent-image").src = patenteAtual.image;
        document.getElementById("user-patent-name").textContent = patenteAtual.name;
    } else {
        console.error("Erro: imagem da patente não encontrada.");
    }

    document.getElementById("progress-bar").style.width = `${progresso.porcentagem}%`;
    document.getElementById("progress-label").textContent = `${progresso.porcentagem}%`;

    if (progresso.nextPatente) {
        document.getElementById("next-patent-name").textContent = `Próxima Patente: ${progresso.nextPatente.name}`;
        document.getElementById("points-needed").textContent = `Faltam ${progresso.restante.toLocaleString('pt-BR')} pontos.`;
    } else {
        document.getElementById("next-patent-name").textContent = "Você alcançou a patente máxima!";
        document.getElementById("points-needed").style.display = "none";
    }
});

window.initPainelDeControle = function () {
    console.log('Inicializando Painel de Controle...');

    function destroyChart(chartInstance) {
        if (chartInstance) {
            chartInstance.destroy();
        }
    }

    // Gráfico de Desempenho nos Simulados
    const ctxPerformance = document.getElementById('performanceChart').getContext('2d');
    destroyChart(performanceChartInstance);
    performanceChartInstance = new Chart(ctxPerformance, {
        type: 'bar',
        data: {
            labels: ['Simulado 1', 'Simulado 2', 'Simulado 3', 'Simulado 4', 'Simulado 5'],
            datasets: [{
                label: 'Desempenho (%)',
                data: [70, 80, 90, 85, 75],
                backgroundColor: ['#FFCA28', '#00509E', '#FF5722', '#4CAF50', '#9C27B0'],
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
            },
            scales: {
                y: { beginAtZero: true },
            },
            devicePixelRatio: window.devicePixelRatio, // Ajusta para a densidade do dispositivo
        },
    });
    const ctxActivityLine = document.getElementById('activityLineChart').getContext('2d');
    const gradient = ctxActivityLine.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(255, 87, 34, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 87, 34, 0)');
    
    const activityLineChartInstance = new Chart(ctxActivityLine, {
        type: 'line',
        data: {
            labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'],
            datasets: [{
                label: 'Tempo Total',
                data: [70, 50, 90, 80, 60],
                borderColor: '#FF5722',
                backgroundColor: gradient,
                tension: 0.4, // Suaviza a curva
                fill: true,
                pointStyle: 'circle',
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#FF5722',
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#000000',
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: '#000000',
                    },
                },
                y: {
                    ticks: {
                        color: '#000000',
                        callback: function (value) {
                            const hours = Math.floor(value / 60);
                            const minutes = value % 60;
                            return `${hours}h ${minutes}min`;
                        },
                    },
                },
            },
        },
    });
    // Gráfico de Estatísticas por Matéria
    const ctxSubject = document.getElementById('subjectChart').getContext('2d');
    destroyChart(subjectChartInstance);
    subjectChartInstance = new Chart(ctxSubject, {
        type: 'pie',
        data: {
            labels: ['Direito Penal', 'Direito Civil', 'Raciocínio Lógico', 'Português', 'Informática'],
            datasets: [{
                data: [40, 25, 20, 10, 5],
                backgroundColor: ['#FFCA28', '#00509E', '#FF5722', '#4CAF50', '#9C27B0'],
            }],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
            },
        },
    });

    // Gráfico de Estatísticas por Banca
    const ctxExaminer = document.getElementById('examinerChart').getContext('2d');
    destroyChart(examinerChartInstance);
    examinerChartInstance = new Chart(ctxExaminer, {
        type: 'pie',
        data: {
            labels: ['CESPE', 'FGV', 'FCC', 'VUNESP', 'ESAF'],
            datasets: [{
                data: [35, 20, 25, 10, 10],
                backgroundColor: ['#FF5722', '#FFC107', '#4CAF50', '#9C27B0', '#00509E'],
            }],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
            },
        },
    });

    // Gráfico de Estatísticas Negativas
    const ctxNegative = document.getElementById('negativeChart').getContext('2d');
    destroyChart(negativeChartInstance);
    negativeChartInstance = new Chart(ctxNegative, {
        type: 'pie',
        data: {
            labels: ['Direito Penal', 'Direito Civil', 'Raciocínio Lógico', 'Português', 'Informática'],
            datasets: [{
                data: [5, 10, 15, 25, 45],
                backgroundColor: ['#9C27B0', '#FF5722', '#FFC107', '#4CAF50', '#00509E'],
            }],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
            },
        },
    });

    console.log('Todos os gráficos foram inicializados.');
};



document.querySelectorAll('.accordion-header').forEach(button => {
    button.addEventListener('click', () => {
        const body = button.nextElementSibling;
        button.classList.toggle('active');
        body.style.display = body.style.display === 'block' ? 'none' : 'block';
    });
});
