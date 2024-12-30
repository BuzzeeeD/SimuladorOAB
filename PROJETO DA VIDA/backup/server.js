const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env

const app = express();
const port = process.env.PORT || 3000; // Porta padrão ou 3000

app.use(cors());
app.use(express.json()); // Habilita o uso de JSON

// Simula o cache de conversas no servidor (seria substituído por uma solução mais robusta em produção)
let conversasCache = {};

// Verifica se a chave da API foi carregada corretamente
if (!process.env.OPENAI_API_KEY) {
    console.error("Erro: A chave da API não está definida. Verifique seu arquivo .env.");
    process.exit(1); // Sai do processo se a chave não estiver definida
} else {
    console.log("Chave da API carregada com sucesso.");
}

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
    res.send('Servidor está rodando corretamente!');
});

// Rota para enviar mensagens à API da OpenAI
app.post('/chat', async (req, res) => {
    const { sessionId, messages } = req.body;

    if (!sessionId || !messages || messages.length === 0) {
        return res.status(400).json({ error: "Session ID ou mensagens estão ausentes." });
    }

    // Verifica se já existe um cache para essa sessão
    if (!conversasCache[sessionId]) {
        conversasCache[sessionId] = [];
    }

    // Armazena as novas mensagens recebidas no cache
    conversasCache[sessionId].push(...messages);

    console.log(`Mensagens recebidas para sessão ${sessionId}:`, messages);
    console.log(`Cache completo para sessão ${sessionId}:`, conversasCache[sessionId]);

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",
                messages: conversasCache[sessionId], // Envia o cache de mensagens acumulado
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        const openAiMessage = response.data.choices[0].message.content;
        console.log("Resposta da OpenAI:", openAiMessage);

        // Armazena a resposta da OpenAI no cache para manter o contexto da conversa
        conversasCache[sessionId].push({ role: 'assistant', content: openAiMessage });

        // Envia a resposta da API de volta para o cliente
        res.json({ reply: openAiMessage });
    } catch (error) {
        console.error("Erro ao se comunicar com a OpenAI:", error.message);
        if (error.response) {
            console.error(error.response.data);
            res.status(500).send(`Erro ao se comunicar com a OpenAI: ${error.response.data}`);
        } else {
            res.status(500).send('Erro ao se comunicar com a OpenAI.');
        }
    }
});

// Rota para limpar o cache de uma conversa
app.post('/chat/reset', (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).send({ message: 'sessionId ausente na requisição.' });
    }

    // Limpa o cache da sessão de conversa no servidor
    if (conversasCache[sessionId]) {
        delete conversasCache[sessionId];  // Remove o cache dessa sessão
        console.log(`Cache da conversa com sessão ${sessionId} foi limpo no servidor.`);
        res.status(200).send({ message: 'Cache da conversa limpo com sucesso.' });
    } else {
        res.status(400).send({ message: 'Sessão não encontrada ou já está limpa.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
