function firstUse(){
    if(!localStorage.getItem("firstUse")){
        localStorage.setItem("firstUse", "done");
        modalOpen();
    }
}

firstUse();

async function acceptTerms(){
    if(localStorage.getItem("acceptedTerms") === "true"){
        return true;
    }else{
        if(await customConfirm("利用規約及びプライバシーポリシーに同意しますか？\n※同意しないと利用できません。")){
            localStorage.setItem("acceptedTerms", "true");
            return true;
        }else{
            return false;
        }
    }
}

async function gameStart(){
    if(!await acceptTerms()){
        return;
    }

    document.getElementById("loading3").style.display = "flex";
    localStorage.setItem("reload", "none");
    window.location.href = "game.html";
}

async function checkLog(){
    if(!await acceptTerms()){
        return;
    }
    document.getElementById("loading3").style.display = "flex";
    window.location.href = "log.html";
}

async function checkRanking(){
    if(!await acceptTerms()){
        return;
    }
    document.getElementById("loading3").style.display = "flex";
    window.location.href = "ranking.html";
}

async function accountCheck(){
    if(!await acceptTerms()){
        return;
    }
    document.getElementById("loading3").style.display = "flex";
    window.location.href = "account.html";
}

function checkTerms(){
    document.getElementById("loading3").style.display = "flex";
    window.location.href = "terms.html";
}

function loginCheck(){
    if(localStorage.getItem("account")){
        document.getElementById("account").textContent = localStorage.getItem("account");
    }
}

loginCheck();

(function(){
    const el = document.getElementById('floating-help');
    if (!el) return;

    const POS_KEY = 'floatingHelpPos_v1'; // 位置保存キー（バージョン管理のため末尾に_v1）

    // saved position?
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(POS_KEY)); } catch (e) { saved = null; }

    // get element size (recompute later on resize)
    function size() {
        return { w: el.offsetWidth || 64, h: el.offsetHeight || 64 };
    }

    // clamp to viewport
    function clamp(x, y) {
        const { w, h } = size();
        const minX = 8, minY = 8;
        const maxX = Math.max(window.innerWidth - w - 8, minX);
        const maxY = Math.max(window.innerHeight - h - 8, minY);
        return { x: Math.min(Math.max(x, minX), maxX), y: Math.min(Math.max(y, minY), maxY) };
    }

    // compute current left/top from style or fallback from right/bottom
    function getCurrentPos() {
        const st = getComputedStyle(el);
        let left = parseFloat(st.left);
        let top = parseFloat(st.top);

        if (isNaN(left) || isNaN(top)) {
        // compute from right/bottom fallback
        const right = parseFloat(st.right);
        const bottom = parseFloat(st.bottom);
        const { w, h } = size();
        left = isFinite(right) ? (window.innerWidth - w - right) : (window.innerWidth - w - 24);
        top  = isFinite(bottom)? (window.innerHeight - h - bottom) : (window.innerHeight - h - 24);
        }
        return { left, top };
    }

    // apply saved or default
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        const p = clamp(saved.x, saved.y);
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
    } else {
        // keep default right/bottom positioning; animation still runs
        // (no inline left/top needed)
    }

    // dragging state
    let dragging = false;
    let startX = 0, startY = 0;
    let origX = 0, origY = 0;
    let moved = false;
    const MOVE_THRESHOLD = 6; // px

    // pointerdown
    el.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        el.setPointerCapture(ev.pointerId);
        dragging = true;
        moved = false;
        startX = ev.clientX;
        startY = ev.clientY;
        const pos = getCurrentPos();
        origX = pos.left;
        origY = pos.top;

        // pause float animation while dragging
        el.style.animationPlayState = 'paused';
        // visual "lift" - use scale (not translate) to avoid conflicting with translateY animation
        el.style.transform = 'scale(1.03)';
        el.style.boxShadow = '0 20px 44px rgba(16,24,40,0.18)';
    });

    // pointermove
    window.addEventListener('pointermove', (ev) => {
        if (!dragging) return;
        ev.preventDefault();
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!moved && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) moved = true;

        const nx = origX + dx;
        const ny = origY + dy;
        const p = clamp(nx, ny);
        // set position (left/top)
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
    });

    // pointerup / cancel
    function endDrag(ev) {
        if (!dragging) return;
        dragging = false;
        try { el.releasePointerCapture(ev && ev.pointerId); } catch(_) {}
        // restore appearance
        el.style.transform = ''; // remove scale so animation's translateY resumes visually
        el.style.boxShadow = '';
        // resume animation
        el.style.animationPlayState = 'running';

        // save position
        const pos = getCurrentPos();
        try { localStorage.setItem(POS_KEY, JSON.stringify({ x: pos.left, y: pos.top })); } catch (_) {}

        // small timeout to differentiate click vs drag
        setTimeout(() => {
        if (!moved) triggerOpen();
        }, 10);
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // keyboard: Enter or Space opens modal
    el.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        triggerOpen();
        }
    });

    // click fallback
    el.addEventListener('click', (ev) => {
        if (moved) return;
        // short delay to avoid duplicate when pointerup already triggered
        setTimeout(() => { if (!dragging) triggerOpen(); }, 0);
    });

    // click / open action
    function triggerOpen() {
        // 1) まず modalOpen があるなら呼ぶ（要件）
        if (typeof modalOpen === 'function') {
        try {
            modalOpen();
            return;
        } catch (e) {
            console.error('modalOpen() 呼び出しでエラー:', e);
        }
        }
        // 2) fallback: カスタムイベントを発火（既存コードがそれを受け取る場合に対応）
        const event = new CustomEvent('openHelpModal', { bubbles: true, cancelable: true });
        window.dispatchEvent(event);
    }

    // window リサイズ時に要素がビュー外に行かないように補正
    window.addEventListener('resize', () => {
        const pos = getCurrentPos();
        const p = clamp(pos.left, pos.top);
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
        try { localStorage.setItem(POS_KEY, JSON.stringify({ x: p.x, y: p.y })); } catch (_){}
    });

    // 初期アクセシビリティ属性
    el.setAttribute('aria-pressed', 'false');

})();

function modalOpen() {
    modal.classList.add('is-active');
}

function modalClose() {
    modal.classList.remove('is-active');
}

document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        body.classList.toggle('closed');
        header.classList.toggle('active'); // ←矢印の回転用クラス
    });
});