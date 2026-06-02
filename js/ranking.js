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
    document.getElementById("list").classList.remove("veiled");
    document.getElementById("reload-inner").classList.remove("reload-inner");
}

function accountCheck(){
    document.getElementById("loading3").style.display = "flex";
    window.location.href = "account.html";
}

function back(){
    document.getElementById("loading3").style.display = "flex";
    window.location.href = "index.html";
}

let log = [];

function makeRanking(users) {
    const container = document.getElementById("list");

    let ranking = 1;
    users.ranking.forEach((user) => {
        const card = document.createElement("div");
        card.classList.add("session-card");

        const name = user.user_name;
        const level = user.level;
        const accuracy = user.accuracy === "非公開" ? "非公開" : String(user.accuracy) + "％";


        const userInfo = document.createElement("div");
        userInfo.classList.add("session-info");

        userInfo.innerHTML = `
            <p>${ranking}位: <span class="user-name">${name}</span></p>
            <p style="color: rgb(205, 0, 0);"> ${level}</p>
            <p>正解率: ${accuracy}</p>
        `;
        ranking++;

        card.appendChild(userInfo);
        container.appendChild(card);
        container.appendChild(document.createElement("hr"));
    });
}

let firstLoading = true;

async function loadInitialHistory(maxRetries = 5, retryInterval = 2000) {

    if(firstLoading){
        startLoading();
        firstLoading = false;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`ランキング取得 試行${attempt}回目`);
            const users = await fetchAccountRanking();
            console.log(users)

            if (users.success) {
                log = log.concat(users);
                makeRanking(users);
                console.log("ランキング取得成功");
                stopLoading();
                return;
            } else {
                console.warn(`ランキングなし (${attempt}回目)`);
            }

        } catch (error) {
            console.error(`ランキング取得エラー (${attempt}回目):`, error);
        }

        if (attempt < maxRetries) {
            console.log(`${retryInterval}ms 待機して再試行...`);
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    }

    await customAlert("ランキングの取得に失敗しました。");
    stopLoading();
}

function scrollTopLogList(how) {
    forceHide = true;
    const list = document.getElementById("list");
    document.getElementById("scroll-top-list").classList.remove("show");
    list.scrollTo({ top: 0, behavior: how });
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

updateScrollButton("list", "scroll-top-list");

function reload(){
    document.getElementById("list").classList.add("veiled");
    document.querySelectorAll(".session-card").forEach(card => {
        card.remove();
    });
    document.querySelectorAll("hr").forEach(hr => {
        hr.remove();
    })
    document.getElementById("reload-inner").classList.add("reload-inner");
    log = [];
    loadInitialHistory();
    scrollTopLogList("auto");
}

loadInitialHistory();

function loginCheck(){
    if(localStorage.getItem("account")){
        document.getElementById("account").textContent = localStorage.getItem("account");
    }
}

loginCheck();