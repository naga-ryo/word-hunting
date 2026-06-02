let loadingTimeout = null;

function startLoading() {
    document.getElementById("loading3").style.display = "flex";
    loadingTimeout = setTimeout(() => {
        document.getElementById("long-loading").style.display = "block";
        document.getElementById("mole-game-container").style.display = "flex";
    }, 4000);
}

function stopLoading() {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;

    document.getElementById("loading3").style.display = "none";
    document.getElementById("long-loading").style.display = "none";
    document.getElementById("mole-game-container").style.display = "none";
}

async function accountCheck(){
    if(localStorage.getItem("account") && localStorage.getItem("id")){
        document.getElementById("no-account").style.display = "none";
        document.getElementById("has-account").style.display = "flex";
        document.getElementById("user-name").textContent = localStorage.getItem("account");
        await updateStatus();
    }
}

accountCheck();

function toSignIn(){
    document.getElementById("selection").children[0].classList.add("active");
    document.getElementById("selection").children[1].classList.remove("active");
    document.getElementById("signin-button").style.display = "flex";
    document.getElementById("signup-button").style.display = "none";
}   

function toSignUp(){
    document.getElementById("selection").children[0].classList.remove("active");
    document.getElementById("selection").children[1].classList.add("active");
    document.getElementById("signin-button").style.display = "none";
    document.getElementById("signup-button").style.display = "flex";
}

function toInfo(){
    document.getElementById("selection2").children[0].classList.add("active");
    document.getElementById("selection2").children[1].classList.remove("active");
    document.getElementById("user-status").style.display = "flex";
    document.getElementById("user-setting").style.display = "none";
    document.getElementById("signout-button").style.display = "flex";
}   

function toSetting(){
    document.getElementById("selection2").children[0].classList.remove("active");
    document.getElementById("selection2").children[1].classList.add("active");
    document.getElementById("user-status").style.display = "none";
    document.getElementById("user-setting").style.display = "flex";
    document.getElementById("signout-button").style.display = "none";
}

async function updateStatus() {
    const id = localStorage.getItem("id");
    try {
        const stats = await retryOperation(() => fetchAccountStats(id));
        if (!stats || !stats.success) {
            await customAlert("アカウント情報を取得できませんでした");
            updateLevel(null);
            return;
        }
        const playCount = stats.play_count;
        const correctCount = stats.correct_count;

        if(stats.name !== localStorage.getItem("account")){
            localStorage.setItem("account", stats.name);
            document.getElementById("user-name").textContent = stats.name;
        }

        document.getElementById("level").textContent = stats.level;
        document.getElementById("play-count").textContent = playCount;
        document.getElementById("correct-count").textContent = correctCount;
        document.getElementById("permissions").classList.add("show");
    
        if (playCount > 0) {
            const accuracy = Math.round((correctCount / playCount) * 1000) / 10;
            document.getElementById("correct-rate").textContent = accuracy;
        }else{
            const accuracy = 0;
            document.getElementById("correct-rate").textContent = accuracy;
        }

        if(stats.display_permission && stats.accuracy_display_permission){
            document.getElementById("permission3").checked = true;
        } else if(stats.display_permission && !stats.accuracy_display_permission){
            document.getElementById("permission2").checked = true;
        } else if(!stats.display_permission && !stats.accuracy_display_permission){
            document.getElementById("permission1").checked = true;
        }
    
    } catch {
        await customAlert("アカウント情報を取得できませんでした");
        document.getElementById("level").textContent = "アクセス失敗";
    }

}

// 汎用リトライ関数
async function retryOperation(operation, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            // リトライしても無駄なエラーは即中断
            if (error === "不正" || error === "使用済") {
                throw error;
            }
            if (attempt === retries) {
                throw error; // 最大試行回数で失敗なら投げる
            }
            await new Promise(resolve => setTimeout(resolve, delay)); // 待機して再試行
        }
    }
}

async function checkSignIn(){
    const name = document.getElementById("username-input").value.trim();
    const pass = document.getElementById("password-input").value.trim();
    
    if(await customConfirm("ログインしますか？")){
        startLoading();
        try {
            const result = await retryOperation(() => signIn(name, pass));
            localStorage.setItem("id", result.id);
            localStorage.setItem("account", result.user_name);
            window.location.reload();
        } catch(error) {
            if(error === "不正"){
                await customAlert("ユーザー名かパスワードが違います。");
            }else{
                await customAlert("ログインに失敗しました。");
            }
            stopLoading();
            return;
        }
    }
}

async function checkSignUp(){
    const name = document.getElementById("username-input").value.trim();
    const pass = document.getElementById("password-input").value.trim();

    if(await customConfirm("新規登録しますか？")){
        if(pass.length < 6){
            if(!await customConfirm("パスワードは６桁以上を推奨しますが６桁未満で大丈夫ですか？")){
                return;
            }
        }
        startLoading();
        try {
            const result = await retryOperation(() => signUp(name, pass));
            localStorage.setItem("id", result.id);
            localStorage.setItem("account", result.user_name);
            window.location.reload();
        } catch(error) {
            if(error === "使用済"){
                await customAlert("このユーザー名は使用できません。");
            }else{
                await customAlert("新規登録に失敗しました。");
            }
            stopLoading();
            return;
        }
    }
}

async function changeRankingPolicy(){
    const selected = document.querySelector('input[name="permission"]:checked');
    if (!selected) {
        await customAlert("どの設定にするか選んでください。");
        return;
    }
    const newPolicy = selected.value;
    if(await customConfirm(`ランキングの表示設定を変更しますか？`)){
        startLoading();
        try {
            await retryOperation(() => updateRankingSetting(localStorage.getItem("id"), newPolicy));
            await customAlert("ランキングの表示設定を変更しました。");
            window.location.reload();
        } catch (error) {
            await customAlert("ランキングの表示設定の変更に失敗しました。");
            stopLoading();
            return;
        }
    }
}

async function signOut(){
    if(await customConfirm("ログアウトしますか？")){
        startLoading();
        localStorage.removeItem("id");
        localStorage.removeItem("account");
        window.location.reload();
    }
}

async function changeName(){
    const newName = document.getElementById("new-username-input").value.trim();
    if(newName.length === 0){
        await customAlert("新しいユーザー名を入力してください。");
        return;
    }
    if(newName === localStorage.getItem("account")){
        await customAlert("現在のユーザー名と同じです。");
        return;
    }
    
    if(await customConfirm(`本当にユーザー名を『${document.getElementById("new-username-input").value}』に変更しますか？`)){
        startLoading();
        try {
            const result = await retryOperation(() => updateUsername(localStorage.getItem("id"), newName));
            localStorage.setItem("account", result.user_name);
            await customAlert("ユーザー名を変更しました。");
            window.location.reload();
        } catch (error) {
            if(error === "使用済"){
                await customAlert("このユーザー名は使用できません。");
            }else{
                await customAlert("ユーザー名の変更に失敗しました。");
            }
            stopLoading();
            return;
        }
    }
}

async function changePassword(){
    const newPassword = document.getElementById("new-password-input").value.trim();
    if(newPassword.length === 0){
        await customAlert("新しいパスワードを入力してください。");
        return;
    }
    if(await customConfirm(`本当にパスワードを変更しますか？`)){
        if(newPassword.length < 6){
            if(!await customConfirm("パスワードは６桁以上を推奨しますが６桁未満で大丈夫ですか？")){
                return;
            }
        }
        startLoading();
        try {
            await retryOperation(() => updatePassword(localStorage.getItem("id"), newPassword));
            await customAlert("パスワードを変更しました。");
            window.location.reload();
        } catch (error) {
            await customAlert("パスワードの変更に失敗しました。");
            stopLoading();
            return;
        }
    }
}

async function deleteAccount(){
    if(await customConfirm("アカウントを削除しますか？")){
        if(await customConfirm("本当にアカウントを削除しますか？\nアカウントを削除するとこれまでのプレイ履歴も全て削除されます。")){
            startLoading();
            try {
                await retryOperation(() => deleteAccount(localStorage.getItem("id")));
                localStorage.removeItem("id");
                localStorage.removeItem("account");
                await customAlert("アカウントを削除しました。");
                window.location.reload();
            } catch (error) {
                await customAlert("アカウントの削除に失敗しました。");
                stopLoading();
                return;
            }
        }
    }
}

function topBack(){
    startLoading();
    window.location.href = "index.html";
}