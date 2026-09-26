"use strict";

/* =====================================================
   MARI-IA
   A chave da API NÃO fica neste arquivo.
   Ela é digitada pelo usuário durante o uso.
   ===================================================== */


// =====================================================
// CONFIGURAÇÃO DA GEMINI
// =====================================================

const GEMINI_MODEL = "gemini-3.8-flash";

const GEMINI_ENDPOINT =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


// =====================================================
// PERSONALIDADE DA MARI-IA
// =====================================================

const SYSTEM_INSTRUCTION = `
Você é a Mari-IA.

Você representa virtualmente a pessoa que criou este chatbot.

Seu objetivo é conversar com os visitantes de maneira natural,
simpática, humana e próxima.

Responda em português do Brasil, salvo quando o usuário pedir
outro idioma.

Seu estilo deve ser:

- natural;
- amigável;
- educado;
- espontâneo;
- claro;
- humano;
- sem parecer excessivamente robótico;
- sem respostas desnecessariamente formais.

Não invente informações pessoais sobre a pessoa que você representa.

Quando alguém perguntar algo pessoal que não foi fornecido nas
instruções, diga naturalmente que essa informação ainda não foi
cadastrada na Mari-IA.

Não invente memórias, experiências, acontecimentos ou opiniões
pessoais que não tenham sido fornecidos.

Quando for relevante, deixe claro que você é uma representação
virtual.

Evite respostas repetitivas.

Não comece todas as respostas com "Olá".

Responda diretamente ao que foi perguntado.

Quando a pergunta for simples, responda de forma simples.

Quando precisar explicar alguma coisa, explique com clareza.

Mantenha uma conversa natural.
`;


// =====================================================
// ESTADO
// =====================================================

let apiKey = "";

let conversationHistory = [];

let isSending = false;


// =====================================================
// ELEMENTOS
// =====================================================

const setupScreen =
    document.getElementById("setupScreen");

const app =
    document.getElementById("app");

const apiKeyInput =
    document.getElementById("apiKeyInput");

const startButton =
    document.getElementById("startButton");

const setupError =
    document.getElementById("setupError");

const toggleKeyVisibility =
    document.getElementById("toggleKeyVisibility");

const chat =
    document.getElementById("chat");

const welcome =
    document.getElementById("welcome");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const clearChatButton =
    document.getElementById("clearChat");

const characterCount =
    document.getElementById("characterCount");


// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupEvents();

        messageInput.disabled = true;

        sendButton.disabled = true;

    }
);


// =====================================================
// EVENTOS
// =====================================================

function setupEvents() {

    // Entrar na Mari-IA

    startButton.addEventListener(
        "click",
        startApplication
    );


    // Enter no campo da API

    apiKeyInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                startApplication();

            }

        }
    );


    // Mostrar / esconder chave

    toggleKeyVisibility.addEventListener(
        "click",
        toggleApiKeyVisibility
    );


    // Enviar mensagem

    sendButton.addEventListener(
        "click",
        sendMessage
    );


    // Enter no chat

    messageInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    // Digitação

    messageInput.addEventListener(
        "input",
        () => {

            adjustTextareaHeight();

            updateCharacterCount();

        }
    );


    // Nova conversa

    clearChatButton.addEventListener(
        "click",
        clearConversation
    );


    // Sugestões

    document
        .querySelectorAll(".suggestion")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const message =
                        button.dataset.message;

                    messageInput.value =
                        message;

                    adjustTextareaHeight();

                    updateCharacterCount();

                    sendMessage();

                }
            );

        });

}


// =====================================================
// INICIAR APLICAÇÃO
// =====================================================

function startApplication() {

    const enteredKey =
        apiKeyInput.value.trim();


    if (!enteredKey) {

        setupError.textContent =
            "Digite sua chave da API Gemini para continuar.";

        apiKeyInput.focus();

        return;

    }


    // Guarda somente na memória desta página.

    apiKey =
        enteredKey;


    setupError.textContent =
        "";


    setupScreen.classList.add(
        "hidden"
    );


    app.classList.remove(
        "hidden"
    );


    messageInput.disabled =
        false;


    sendButton.disabled =
        false;


    messageInput.focus();

}


// =====================================================
// MOSTRAR / ESCONDER API KEY
// =====================================================

function toggleApiKeyVisibility() {

    if (
        apiKeyInput.type === "password"
    ) {

        apiKeyInput.type =
            "text";

        toggleKeyVisibility.textContent =
            "🙈";

        toggleKeyVisibility.title =
            "Esconder chave";

    } else {

        apiKeyInput.type =
            "password";

        toggleKeyVisibility.textContent =
            "👁";

        toggleKeyVisibility.title =
            "Mostrar chave";

    }

}


// =====================================================
// ENVIAR MENSAGEM
// =====================================================

async function sendMessage() {

    if (isSending) {
        return;
    }


    const message =
        messageInput.value.trim();


    if (!message) {
        return;
    }


    if (!apiKey) {

        return;

    }


    isSending =
        true;


    sendButton.disabled =
        true;


    hideWelcome();


    addMessage(
        "user",
        message
    );


    messageInput.value =
        "";


    adjustTextareaHeight();

    updateCharacterCount();


    conversationHistory.push({

        role: "user",

        parts: [
            {
                text: message
            }
        ]

    });


    const typingElement =
        showTyping();


    try {

        const response =
            await callGemini();


        removeTyping(
            typingElement
        );


        addMessage(
            "assistant",
            response
        );


        conversationHistory.push({

            role: "model",

            parts: [
                {
                    text: response
                }
            ]

        });


    } catch (error) {

        console.error(
            "Erro Gemini:",
            error
        );


        removeTyping(
            typingElement
        );


        addMessage(
            "assistant",
            createErrorMessage(error)
        );

    } finally {

        isSending =
            false;


        sendButton.disabled =
            false;


        messageInput.focus();

    }

}


// =====================================================
// GEMINI API
// =====================================================

async function callGemini() {

    const requestBody = {

        system_instruction: {

            parts: [
                {
                    text:
                        SYSTEM_INSTRUCTION
                }
            ]

        },

        contents:
            conversationHistory,

        generationConfig: {

            temperature:
                0.85,

            maxOutputTokens:
                1000

        }

    };


    const response =
        await fetch(
            `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        requestBody
                    )

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        console.error(
            "Resposta da API:",
            data
        );


        const errorMessage =
            data?.error?.message ||
            "A Gemini recusou a solicitação.";


        throw new Error(
            errorMessage
        );

    }


    const responseText =
        data
            ?.candidates?.[0]
            ?.content
            ?.parts?.[0]
            ?.text;


    if (!responseText) {

        throw new Error(
            "A Gemini não retornou texto."
        );

    }


    return responseText.trim();

}


// =====================================================
// MENSAGEM NA TELA
// =====================================================

function addMessage(
    sender,
    text
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        `message-row ${sender}`;


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "message-content";


    const label =
        document.createElement(
            "div"
        );


    label.className =
        "message-label";


    label.textContent =
        sender === "user"
            ? "Você"
            : "Mari-IA";


    const message =
        document.createElement(
            "div"
        );


    message.className =
        `message ${sender}`;


    message.textContent =
        text;


    content.appendChild(
        label
    );


    content.appendChild(
        message
    );


    row.appendChild(
        content
    );


    chat.appendChild(
        row
    );


    scrollToBottom();

}


// =====================================================
// DIGITANDO
// =====================================================

function showTyping() {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "message-row assistant";


    row.innerHTML = `
        <div class="message-content">

            <div class="message-label">
                Mari-IA
            </div>

            <div class="message assistant typing-message">

                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>

            </div>

        </div>
    `;


    chat.appendChild(
        row
    );


    scrollToBottom();


    return row;

}


// =====================================================
// REMOVER DIGITANDO
// =====================================================

function removeTyping(
    element
) {

    if (element) {

        element.remove();

    }

}


// =====================================================
// ESCONDER WELCOME
// =====================================================

function hideWelcome() {

    if (welcome) {

        welcome.style.display =
            "none";

    }

}


// =====================================================
// LIMPAR CONVERSA
// =====================================================

function clearConversation() {

    conversationHistory =
        [];


    chat.innerHTML =
        "";


    chat.appendChild(
        welcome
    );


    welcome.style.display =
        "";


    messageInput.value =
        "";


    adjustTextareaHeight();

    updateCharacterCount();

    messageInput.focus();

}


// =====================================================
// SCROLL
// =====================================================

function scrollToBottom() {

    requestAnimationFrame(
        () => {

            chat.scrollTo({

                top:
                    chat.scrollHeight,

                behavior:
                    "smooth"

            });

        }
    );

}


// =====================================================
// TEXTAREA
// =====================================================

function adjustTextareaHeight() {

    messageInput.style.height =
        "auto";


    const height =
        Math.min(
            messageInput.scrollHeight,
            150
        );


    messageInput.style.height =
        `${height}px`;

}


// =====================================================
// CONTADOR
// =====================================================

function updateCharacterCount() {

    const length =
        messageInput.value.length;


    characterCount.textContent =
        `${length} / 4000`;

}


// =====================================================
// ERROS
// =====================================================

function createErrorMessage(
    error
) {

    const message =
        error?.message ||
        "Erro desconhecido.";


    if (
        message.includes("API key") ||
        message.includes("API_KEY") ||
        message.includes("invalid")
    ) {

        return `
A chave da API parece estar inválida.

Clique em "Nova conversa" e informe uma chave Gemini válida.
        `.trim();

    }


    if (
        message.includes("quota") ||
        message.includes("429")
    ) {

        return `
A API informou que o limite de uso foi atingido.

Verifique a cota da sua conta Gemini.
        `.trim();

    }


    if (
        message.includes("403")
    ) {

        return `
A Gemini recusou o acesso.

Verifique se a chave possui acesso à Gemini API.
        `.trim();

    }


    if (
        message.includes("404") ||
        message.includes("not found")
    ) {

        return `
O modelo Gemini configurado não está disponível para essa chave.
        `.trim();

    }


    return `
Não consegui conversar com a Gemini.

Detalhes:
${message}
    `.trim();

}