
const firebaseConfig = {
    apiKey: "AIzaSyDUU3IiP6c6jjgLS0ls5i6YI3W0io_PFLM",
    authDomain: "encurta-b6321.firebaseapp.com",
    databaseURL: "https://encurta-b6321-default-rtdb.firebaseio.com",
    projectId: "encurta-b6321",
    storageBucket: "encurta-b6321.appspot.com",
    messagingSenderId: "1065915334607",
    appId: "1:1065915334607:web:5f5181cef49772ddc91cba"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Elementos do DOM
const mediaContainer = document.getElementById('media-container');
const messageContainer = document.getElementById('message-container');
const messageTitle = document.getElementById('message-title');
const messageText = document.getElementById('message-text');

let mediaRecord = null;
let sessionActive = false;

// Função para exibir mensagens de erro/status
function showMessage(title, text) {
    mediaContainer.classList.add('hidden');
    messageTitle.textContent = title;
    messageText.textContent = text;
    messageContainer.classList.remove('hidden');
}

// Função para autodestruição
async function selfDestruct() {
    if (!mediaRecord || !sessionActive) return;
    sessionActive = false; // Previne múltiplas execuções

    try {
        // Remove do Storage
        const storageRef = storage.ref(mediaRecord.storagePath);
        await storageRef.delete();

        // Remove do Realtime Database
        const dbRef = database.ref(`media/${mediaRecord.token}`);
        await dbRef.remove();

        console.log("Mídia autodestruída com sucesso.");
    } catch (error) {
        console.error("Erro na autodestruição:", error);
    } finally {
        showMessage("Sessão Encerrada", "Esta mídia foi autodestruída e não pode mais ser acessada.");
    }
}

// Proteções anti-cópia
// 1. Bloquear atalhos de teclado
document.addEventListener('keydown', (e) => {
    if (
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.key === 'J') || // Ctrl+Shift+J
        (e.ctrlKey && e.key === 'U') || // Ctrl+U
        (e.ctrlKey && e.key === 'S') || // Ctrl+S
        (e.key === 'F12') || // F12
        (e.metaKey && e.altKey && e.key === 'i') // Cmd+Option+I (Mac)
    ) {
        e.preventDefault();
        selfDestruct();
    }
});

// 2. Detecção de DevTools
const devtools = {
    open: false,
    orientation: null
};
const threshold = 160;

const checkDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    const orientation = widthThreshold ? 'vertical' : 'horizontal';

    if (
        !(heightThreshold && widthThreshold) &&
        ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) || widthThreshold || heightThreshold)
    ) {
        if (!devtools.open || devtools.orientation !== orientation) {
            selfDestruct();
        }
        devtools.open = true;
        devtools.orientation = orientation;
    } else {
        devtools.open = false;
        devtools.orientation = null;
    }
};

// Lógica principal
window.addEventListener('load', async () => {
    // Autenticação anônima
    await auth.signInAnonymously().catch(error => {
        console.error("Erro na autenticação:", error);
        showMessage("Erro de Conexão", "Não foi possível conectar ao serviço.");
    });

    // Iniciar detecção de DevTools
    setInterval(checkDevTools, 500);

    // Obter token da URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        return showMessage("Link Inválido", "O token de acesso não foi encontrado na URL.");
    }

    const dbRef = database.ref(`media/${token}`);
    const snapshot = await dbRef.get();

    if (!snapshot.exists()) {
        return showMessage("Link Expirado", "Esta mídia não existe ou já foi visualizada.");
    }

    mediaRecord = snapshot.val();

    // Transação para garantir que apenas um usuário acesse
    const transactionResult = await dbRef.transaction(currentData => {
        if (currentData === null) {
            return null; // Já foi deletado
        }
        if (currentData.status === 'unseen') {
            currentData.status = 'seen';
            return currentData;
        }
        return; // Aborta a transação se já foi visto
    });

    if (!transactionResult.committed || transactionResult.snapshot.val().status !== 'seen') {
        return showMessage("Link Já Utilizado", "Este link já foi aberto e a mídia foi destruída.");
    }
    
    sessionActive = true;
    
    // Eventos para autodestruição
    window.addEventListener('beforeunload', selfDestruct);
    window.addEventListener('unload', selfDestruct);

    // Exibir a mídia
    const url = mediaRecord.downloadURL;
    const fileType = (await storage.ref(mediaRecord.storagePath).getMetadata()).contentType;
    let mediaElement;

    if (fileType.startsWith('video/')) {
        mediaElement = document.createElement('video');
        mediaElement.autoplay = true;
        mediaElement.loop = false;
        mediaElement.addEventListener('ended', selfDestruct);
    } else if (fileType.startsWith('image/')) {
        mediaElement = document.createElement('img');
        // Para imagens, autodestruir após um tempo
        setTimeout(selfDestruct, 15000); // 15 segundos
    } else if (fileType.startsWith('audio/')) {
        mediaElement = document.createElement('audio');
        mediaElement.autoplay = true;
        mediaElement.loop = false;
        mediaElement.controls = true; // Áudio precisa de controles visíveis
        mediaElement.addEventListener('ended', selfDestruct);
    } else {
        return showMessage("Erro", "Tipo de arquivo não suportado para visualização.");
    }

    mediaElement.src = url;
    mediaContainer.prepend(mediaElement);
});
    await auth.signInAnonymously().catch(error => {
        console.error("Erro na autenticação:", error);
        showMessage("Erro de Conexão", "Não foi possível conectar ao serviço.");
    });

    // Iniciar detecção de DevTools
    setInterval(checkDevTools, 500);

    // Obter token da URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        return showMessage("Link Inválido", "O token de acesso não foi encontrado na URL.");
    }

    const dbRef = database.ref(`media/${token}`);
    const snapshot = await dbRef.get();

    if (!snapshot.exists()) {
        return showMessage("Link Expirado", "Esta mídia não existe ou já foi visualizada.");
    }

    mediaRecord = snapshot.val();

    // Transação para garantir que apenas um usuário acesse
    const transactionResult = await dbRef.transaction(currentData => {
        if (currentData === null) {
            return null; // Já foi deletado
        }
        if (currentData.status === 'unseen') {
            currentData.status = 'seen';
            return currentData;
        }
        return; // Aborta a transação se já foi visto
    });

    if (!transactionResult.committed || transactionResult.snapshot.val().status !== 'seen') {
        return showMessage("Link Já Utilizado", "Este link já foi aberto e a mídia foi destruída.");
    }
    
    sessionActive = true;
    
    // Eventos para autodestruição
    window.addEventListener('beforeunload', selfDestruct);
    window.addEventListener('unload', selfDestruct);

    // Exibir a mídia
    const url = mediaRecord.downloadURL;
    const fileType = (await storage.ref(mediaRecord.storagePath).getMetadata()).contentType;
    let mediaElement;

    if (fileType.startsWith('video/')) {
        mediaElement = document.createElement('video');
        mediaElement.autoplay = true;
        mediaElement.loop = false;
        mediaElement.addEventListener('ended', selfDestruct);
    } else if (fileType.startsWith('image/')) {
        mediaElement = document.createElement('img');
        // Para imagens, autodestruir após um tempo
        setTimeout(selfDestruct, 15000); // 15 segundos
    } else if (fileType.startsWith('audio/')) {
        mediaElement = document.createElement('audio');
        mediaElement.autoplay = true;
        mediaElement.loop = false;
        mediaElement.controls = true; // Áudio precisa de controles visíveis
        mediaElement.addEventListener('ended', selfDestruct);
    } else {
        return showMessage("Erro", "Tipo de arquivo não suportado para visualização.");
    }

    mediaElement.src = url;
    mediaContainer.prepend(mediaElement);
});

