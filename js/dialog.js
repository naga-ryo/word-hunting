function ensureDialogExists() {
    if (!document.getElementById("custom-dialog-overlay")) {
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
    }
}

function showCustomDialog(message, isConfirm, theme = "dark") {

    ensureDialogExists();

    return new Promise((resolve) => {
        const overlay = document.getElementById("custom-dialog-overlay");
        const dialog = document.getElementById("custom-dialog");
        const msgEl = document.getElementById("custom-dialog-message");
        const btnOk = document.getElementById("custom-dialog-ok");
        const btnCancel = document.getElementById("custom-dialog-cancel");

        msgEl.innerHTML = message.replace(/\n/g, "<br>");

        dialog.className = "";
        if (theme === "light") {
            dialog.classList.add("theme-light");
        }

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

const customAlert = (message, theme = "dark") => showCustomDialog(message, false, theme);
const customConfirm = (message, theme = "dark") => showCustomDialog(message, true, theme);