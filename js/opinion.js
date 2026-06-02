const supabaseUrl = "https://yakoqhrycusjrwhejmnt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlha29xaHJ5Y3VzanJ3aGVqbW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Njk2NTgsImV4cCI6MjA3MDE0NTY1OH0.eJW-DppQEUEdDEPNGaXbvmqR23O4bAHS5qpIbp00UcQ";
const Supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const form = document.getElementById("opinion-form");
const textArea = document.getElementById("opinion-text");
const statusMsg = document.getElementById("opinion-status");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = textArea.value.trim();
    if (!message) {
        await customAlert("内容を入力してください。");
        return;
    }

    // ✅ 送信前に確認ダイアログを表示
    const isConfirmed = await customConfirm("この内容を送信します。よろしいですか？");
    if (!isConfirmed) {
        return; // キャンセルされたら何もしない
    }

    const { error } = await Supabase
        .from("opinion")
        .insert({ opinion: message });

    if (error) {
        console.error(error);
        await customAlert("送信に失敗しました。時間をおいて再度お試しください。");
    } else {
        textArea.value = "";
        statusMsg.style.display = "block";
        setTimeout(() => statusMsg.style.display = "none", 4000);
    }
});