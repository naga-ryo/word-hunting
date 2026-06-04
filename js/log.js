let loadingTimeout = null;

function startLoading() {
    document.getElementById("fundamental-loading").style.display = "flex";
    loadingTimeout = setTimeout(() => {
        document.getElementById("long-loading-message").style.display = "block";
        document.getElementById("mole-game-container").style.display = "flex";
    }, 4000);
}

function stopLoading() {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;

    document.getElementById("fundamental-loading").style.display = "none";
    document.getElementById("long-loading-message").style.display = "none";
    document.getElementById("mole-game-container").style.display = "none";
    document.getElementById("log-list").classList.remove("veiled");
    document.getElementById("log-list2").classList.remove("veiled");
    document.getElementById("reload-inner").classList.remove("reload-inner");
}

function accountCheck(){
    document.getElementById("fundamental-loading").style.display = "flex";
    window.location.href = "account.html";
}

function back(){
    document.getElementById("fundamental-loading").style.display = "flex";
    window.location.href = "index.html";
}

let log = [];
let loadCount = 1;
const pageSize = 15;
let lastFetchedAt = null;

function renderHistory(sessions) {
    const container = document.getElementById("log-list");

    sessions.forEach((session) => {
        const card = document.createElement("div");
        card.classList.add("session-card");

        const sessionInfo = document.createElement("div");
        sessionInfo.classList.add("session-info");
        const hintText = session.hint ? "(ヒントを使用)" : "";
        sessionInfo.innerHTML = `
            <p>ユーザーの解答: <span class="user-answer">${session.final_guess}</span></p>
            <p>正解: <span class="correct-answer">${session.correct_answer}</span></p>
            <p>質問回数: ${session.questions.length}回<span class="hint">${hintText}</span></p>
            <p>終了タイム: ${session.play_time}</p>
        `;

        const questionButton = document.createElement("button");
        questionButton.textContent = "質問を見る";
        questionButton.onclick = () => modalOpen(session.id);
        questionButton.classList.add("question-button");

        card.appendChild(sessionInfo);
        card.appendChild(questionButton);
        container.appendChild(card);
        container.appendChild(document.createElement("hr"));

        if(document.getElementById("load-more-button")) {
            document.getElementById("load-more-button").remove();
        }
        if(loadCount === pageSize) {
            const loadMoreButton = document.createElement("button");
            loadMoreButton.textContent = "もっと見る";
            loadMoreButton.id = "load-more-button";
            loadMoreButton.onclick = loadMoreHistory;
            container.appendChild(loadMoreButton);
            loadCount = 0;
        }

        loadCount++;
    });
}

function renderHistory2(sessions) {
    const container2 = document.getElementById("log-list2");

    let ranking = 1;
    sessions.forEach((session) => {
        const card = document.createElement("div");
        card.classList.add("session-card");

        const sessionInfo = document.createElement("div");
        sessionInfo.classList.add("session-info");
        sessionInfo.innerHTML = `
            <p>${ranking}位: <span class="theme">${session.correct_answer}</span></p>
            <p>出題回数: ${session.answer_count}</p>
        `;
        ranking++;

        card.appendChild(sessionInfo);
        container2.appendChild(card);
        container2.appendChild(document.createElement("hr"));
    });
}

let firstLoading = true

async function loadInitialHistory(maxRetries = 5, retryInterval = 2000) {

    if(firstLoading){
        startLoading();
        firstLoading = false;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`履歴取得 試行${attempt}回目`);
            const sessions = await getRecentSessionsWithQuestions(lastFetchedAt, pageSize, localStorage.getItem("id"));
            const sessions2 = await getPopularAnswers(null);

            if (sessions && sessions.length > 0 && sessions2 && sessions2.length > 0) {
                log = log.concat(sessions);
                renderHistory(sessions);
                lastFetchedAt = sessions[sessions.length - 1].created_at;
                renderHistory2(sessions2);
                console.log("履歴取得成功");
                stopLoading();
                return;
            } else {
                console.warn(`履歴なし (${attempt}回目)`);
            }

        } catch (error) {
            console.error(`履歴取得エラー (${attempt}回目):`, error);
        }

        if (attempt < maxRetries) {
            console.log(`${retryInterval}ms 待機して再試行...`);
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    }

    await customAlert("履歴の取得に失敗しました。");
    stopLoading();
}

async function loadMoreHistory() {
    startLoading();
    try {
        const sessions = await getRecentSessionsWithQuestions(lastFetchedAt, pageSize, localStorage.getItem("id"));

        if (!sessions || sessions.length === 0) {
            await customAlert("これ以上の履歴はありません。", "light");
            document.getElementById("load-more-button").disabled = true;
            return;
        }

        log = log.concat(sessions);
        
        lastFetchedAt = sessions[sessions.length - 1].created_at;

        renderHistory(sessions);

    } catch (error) {
        console.error("履歴追加取得エラー:", error);
        await customAlert("履歴の読み込み中にエラーが発生しました。");
    } finally {
        stopLoading();
        setLogFilter(filter);
    }
}

const modal = document.getElementById("modal");

async function modalOpen(targetId) {
    if(localStorage.getItem("id")){
        const session = log.find(s => s.id === targetId);
        const content = document.getElementById("modal-content");
        content.innerHTML = "";
        if ((!session.questions || session.questions.length === 0) && !session.hint) {
            content.innerHTML = "<p>なし</p>";
        } else {
            let order = 1;
            if(parseInt(session.hintposition) === 1){
                    const p = document.createElement("p");
                    p.innerHTML = `
                    ヒントを使用：${session.hint}
                    `;
                    p.style.color = "red";
                    content.appendChild(p);
            }
            session.questions.forEach(q => {
    
                const p = document.createElement("p");
                p.textContent = `Q${order}: ${q.question}\nA: ${q.response}`;
                p.style.whiteSpace = "pre-wrap";
                content.appendChild(p);
                order++;
                if(parseInt(session.hintposition) === order){
                    const p = document.createElement("p");
                    p.innerHTML = `
                    ヒントを使用：${session.hint}
                    `;
                    p.style.color = "red";
                    content.appendChild(p);
                }
            });
        }
        modal.classList.add('is-active');
    }else{
        await customAlert("質問内容はログインしていないと見られません。", "light");
    }
}

function modalClose() {
    modal.classList.remove('is-active');
}

function toggleLog(showFirst = true) {
    document.getElementById("log-list").style.display  = showFirst ? "flex" : "none";
    document.getElementById("log-list2").style.display = showFirst ? "none" : "flex";
    const [first, second] = document.getElementById("selection").children;
    first.classList.toggle("active-log", showFirst);
    second.classList.toggle("active-log", !showFirst);
}

function searchAnswer() {
    const query = document.getElementById("search-input").value.trim();
    const cards = document.querySelectorAll("#log-list2 .session-card");
    let firstMatch = null;

    cards.forEach(card => {
        const answer = card.querySelector(".theme").textContent;
        if ((answer === query) && (query !== "")) {
            card.style.backgroundColor = "#ffff99";
            firstMatch = card; 
        } else {
            card.style.backgroundColor = "";
        }
    });

    if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
    }else{
        document.getElementById("search-input").value = "該当なし";
    }
}

let filter = 0;

function setLogFilter(type) {
    filter = type;

    const filterTabs = document.getElementById("log-filter").children;
    document.querySelector(".active-filter")?.classList.remove("active-filter");
    filterTabs[type].classList.add("active-filter");

    document.querySelectorAll("#log-list .session-card").forEach(card => {
        const answer = card.querySelector(".user-answer").textContent;
        const hint   = card.querySelector(".hint").textContent;
        let hide = false;

        switch (type) {
            case 1: hide = (answer === "----"); break;
            case 2: hide = (answer !== "----"); break;
            case 3: hide = (hint === ""); break;
            case 4: hide = (hint === "(ヒントを使用)"); break;
        }
        card.classList.toggle("veiled", hide);
    });
}

function scrollTopLogList(how) {
    forceHide = true;
    const list = document.getElementById("log-list");
    document.getElementById("scroll-top-log-list").classList.remove("show");
    list.scrollTo({ top: 0, behavior: how });
}

function scrollTopLogList2(how) {
    forceHide2 = true;
    const list2 = document.getElementById("log-list2");
    document.getElementById("scroll-top-log-list2").classList.remove("show");
    list2.scrollTo({ top: 0, behavior: how });
}

let scrollTimer;
let forceHide = false;
let lastScrollTop = 0;

function updateScrollButton(listId, btnId) {
    const list = document.getElementById(listId);
    const btn = document.getElementById(btnId);

    function update() {
        const scrollTop = list.scrollTop;
        if (scrollTop > lastScrollTop) {
            forceHide = false;
        }
        lastScrollTop = scrollTop;

        if (forceHide) return;

        btn.style.transform = `translateY(${scrollTop}px)`;
        btn.classList.remove("show");

        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            btn.classList.add("show");
        }, 100);
    }

    update();
    list.addEventListener("scroll", update);
}

let scrollTimer2;
let forceHide2 = false;
let lastScrollTop2 = 0;

function updateScrollButton2(listId, btnId) {
    const list = document.getElementById(listId);
    const btn = document.getElementById(btnId);

    function update() {
        const scrollTop = list.scrollTop;
        if (scrollTop > lastScrollTop2) {
            forceHide2 = false;
        }
        lastScrollTop2 = scrollTop;

        if (forceHide2) return;

        btn.style.transform = `translateY(${scrollTop}px)`;
        btn.classList.remove("show");

        clearTimeout(scrollTimer2);
        scrollTimer2 = setTimeout(() => {
            btn.classList.add("show");
        }, 100);
    }

    update();
    list.addEventListener("scroll", update);
}

updateScrollButton("log-list", "scroll-top-log-list");
updateScrollButton2("log-list2", "scroll-top-log-list2");

function reload(){
    document.getElementById("log-list").classList.add("veiled");
    document.getElementById("log-list2").classList.add("veiled");
    document.querySelectorAll(".session-card").forEach(card => {
        card.remove();
    });
    document.querySelectorAll("hr").forEach(hr => {
        hr.remove();
    })
    if(document.getElementById("load-more-button")){
        document.getElementById("load-more-button").remove();
    }
    log = [];
    loadCount = 1;
    lastFetchedAt = null;
    setLogFilter(0);
    document.getElementById("reload-inner").classList.add("reload-inner");
    loadInitialHistory();
    scrollTopLogList("auto");
    scrollTopLogList2("auto");
}

loadInitialHistory();

function loginCheck(){
    if(localStorage.getItem("account")){
        document.getElementById("account").textContent = "ログイン中";
    }
}

loginCheck();