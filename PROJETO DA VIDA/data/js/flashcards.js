function openPopup() {
    const popup = document.getElementById('quizPopup');
    popup.style.display = 'flex'; // Mostra o popup
}

function closePopup() {
    const popup = document.getElementById('quizPopup');
    popup.style.display = 'none'; // Esconde o popup
}

function closePopupOnClickOutside(event) {
    const popupContent = document.querySelector('.popup-content');
    // Verifica se o clique foi fora do conteúdo do popup
    if (!popupContent.contains(event.target)) {
        closePopup(); // Fecha o popup
    }
}
function applyFilters(event) {
    event.preventDefault(); // Previne o recarregamento da página

    const discipline = document.getElementById('discipline').value;
    const topic = document.getElementById('topic').value;
    const difficulty = document.getElementById('difficulty').value;

    if (discipline && topic && difficulty) {
        openPopup(); // Abre o popup
    } else {
        alert('Por favor, preencha todos os campos do filtro antes de continuar.');
    }
}

function openPopup() {
    const popup = document.getElementById('quizPopup');
    popup.style.display = 'flex'; // Mostra o popup
}

function closePopup() {
    const popup = document.getElementById('quizPopup');
    popup.style.display = 'none'; // Esconde o popup
}
