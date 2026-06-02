document.addEventListener("DOMContentLoaded", () => {
    const dialogHTML = `
        <div id="custom-dialog-overlay" style="display: none;">
            <div id="custom-dialog">
                <p id="custom-dialog-message"></p>
                <div id="custom-dialog-buttons">
                    <button id="custom-dialog-cancel" style="display: none;">キャンセル</button>
                    <button id="custom-dialog-ok">OK</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
});

function showCustomDialog(message, isConfirm) {
    return new Promise((resolve) => {
        const overlay = document.getElementById("custom-dialog-overlay");
        const msgEl = document.getElementById("custom-dialog-message");
        const btnOk = document.getElementById("custom-dialog-ok");
        const btnCancel = document.getElementById("custom-dialog-cancel");

        msgEl.innerHTML = message.replace(/\n/g, "<br>");

        btnCancel.style.display = isConfirm ? "inline-block" : "none";
        overlay.style.display = "flex";

        const cleanup = () => {
            overlay.style.display = "none";
            btnOk.onclick = null;
            btnCancel.onclick = null;
        };

        btnOk.onclick = () => {
            cleanup();
            resolve(true);
        };

        btnCancel.onclick = () => {
            cleanup();
            resolve(false);
        };
    });
}

const customAlert = (message) => showCustomDialog(message, false);
const customConfirm = (message) => showCustomDialog(message, true);