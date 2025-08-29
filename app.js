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
const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("file-input");
const fileLabel = document.getElementById("file-label");
const fileNameDisplay = document.getElementById("file-name");
const uploadButton = document.getElementById("upload-button");

const uploadSection = document.getElementById("upload-section");
const loadingSection = document.getElementById("loading-section");
const resultSection = document.getElementById("result-section");
const uniqueUrlInput = document.getElementById("unique-url");
const copyButton = document.getElementById("copy-button");

let selectedFile = null;

// Autenticação anônima
auth.signInAnonymously().catch(error => {
    console.error("Erro na autenticação anônima:", error);
    alert("Não foi possível conectar ao serviço. Tente recarregar a página.");
});

// Eventos de Drag and Drop
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

["dragenter", "dragover"].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add("highlight"), false);
});

["dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove("highlight"), false);
});

dropArea.addEventListener("drop", handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        selectedFile = files[0];
        fileNameDisplay.textContent = selectedFile.name;
        uploadButton.disabled = false;
    }
}

// Lógica de Upload
uploadButton.addEventListener("click", async () => {
    if (!selectedFile) return;

    uploadSection.classList.add("hidden");
    loadingSection.classList.remove("hidden");

    try {
        // 1. Gerar token único
        const token = database.ref().push().key;

        // 2. Fazer upload para o Firebase Storage
        const storageRef = storage.ref(`media/${token}/${selectedFile.name}`);
        const uploadTask = await storageRef.put(selectedFile);
        const downloadURL = await uploadTask.ref.getDownloadURL();

        // 3. Criar registro no Realtime Database
        const mediaRecord = {
            storagePath: storageRef.fullPath,
            downloadURL: downloadURL, // URL temporária
            token: token,
            status: "unseen",
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        await database.ref(`media/${token}`).set(mediaRecord);

        // 4. Exibir URL única (adaptado para GitHub Pages)
        const path = window.location.pathname.replace("index.html", "");
        const viewUrl = `${window.location.origin}${path}view/?token=${token}`;
        uniqueUrlInput.value = viewUrl;
        
        loadingSection.classList.add("hidden");
        resultSection.classList.remove("hidden");

    } catch (error) {
        console.error("Erro no upload:", error);
        alert("Ocorreu um erro ao enviar o arquivo. Por favor, tente novamente.");
        loadingSection.classList.add("hidden");
        uploadSection.classList.remove("hidden");
    }
});

// Botão de copiar
copyButton.addEventListener("click", () => {
    uniqueUrlInput.select();
    document.execCommand("copy");
    copyButton.textContent = "Copiado!";
    setTimeout(() => {
        copyButton.textContent = "Copiar";
    }, 2000);
});

