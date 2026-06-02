const cells = document.querySelectorAll(".mole-cell");
const scoreDisplay = document.getElementById("score-display");
let score = 0;

// モグラSVGテンプレート（小型化バージョン）
const moleSVG = `
<svg viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg">
  <style>
    .mole { fill:#6b4f3a; }
    .belly{ fill:#7d5d45; }
    .nose { fill:#f06277; }
    .eye  { fill:#222; }
    .shine{ fill:#fff; opacity:.8; }
    .claw { fill:#e9d6c8; }
    .dirt { fill:#7a583c; }
    .shadow{ fill:#000; opacity:.12; }
  </style>
  <ellipse class="shadow" cx="150" cy="190" rx="110" ry="18"/>
  <path class="dirt" d="M40 190c18-30 60-48 110-48s92 18 110 48z"/>
  <g>
    <ellipse class="mole" cx="150" cy="120" rx="70" ry="60"/>
    <ellipse class="belly" cx="150" cy="140" rx="48" ry="34"/>
    <ellipse class="mole" cx="112" cy="68" rx="16" ry="12"/>
    <ellipse class="mole" cx="188" cy="68" rx="16" ry="12"/>
    <ellipse class="belly" cx="112" cy="68" rx="10" ry="7"/>
    <ellipse class="belly" cx="188" cy="68" rx="10" ry="7"/>
    <ellipse class="nose" cx="150" cy="112" rx="14" ry="10"/>
    <circle class="shine" cx="154" cy="108" r="3"/>
    <ellipse class="eye" cx="128" cy="105" rx="7" ry="9"/>
    <ellipse class="eye" cx="172" cy="105" rx="7" ry="9"/>
    <circle class="shine" cx="126.5" cy="102.5" r="2"/>
    <circle class="shine" cx="170.5" cy="102.5" r="2"/>
    <g stroke="#3b2b20" stroke-width="3" stroke-linecap="round" fill="none" opacity=".65">
      <path d="M95 118 L70 112"/>
      <path d="M95 124 L68 124"/>
      <path d="M95 130 L70 136"/>
      <path d="M205 118 L230 112"/>
      <path d="M205 124 L232 124"/>
      <path d="M205 130 L230 136"/>
    </g>
    <g>
      <ellipse class="mole" cx="110" cy="158" rx="20" ry="16"/>
      <ellipse class="mole" cx="190" cy="158" rx="20" ry="16"/>
      <g>
        <path class="claw" d="M97 162 l-8 9 a4 4 0 0 0 6 1z"/>
        <path class="claw" d="M104 166 l-8 9 a4 4 0 0 0 6 1z"/>
        <path class="claw" d="M111 167 l-8 9 a4 4 0 0 0 6 1z"/>
        <path class="claw" d="M118 166 l-8 9 a4 4 0 0 0 6 1z"/>
      </g>
      <g transform="matrix(-1 0 0 1 300 0)">
        <path class="claw" d="M97 162 l-8 9 a4 4 0 0 0 6 1z"/>
        <path class="claw" d="M104 166 l-8 9 a4 4 0 0 0 6 1z"/>
        <path class="claw" d="M111 167 l-8 9 a4 4 0 0 0 6 1z"/>
        <path class="claw" d="M118 166 l-8 9 a4 4 0 0 0 6 1z"/>
      </g>
    </g>
  </g>
</svg>`;

// モグラ出現関数
function spawnMole() {
  document.querySelectorAll(".mole").forEach(m => m.remove());

  const index = Math.floor(Math.random() * cells.length);
  const moleWrapper = document.createElement("div");
  moleWrapper.classList.add("mole");
  moleWrapper.innerHTML = moleSVG;

  moleWrapper.onclick = () => {
    score++;
    scoreDisplay.textContent = "スコア: " + score;
    moleWrapper.remove();
  };

  cells[index].appendChild(moleWrapper);

  const nextTime = Math.random() * 500 + Math.random() * 900 + 100;
  setTimeout(spawnMole, nextTime);
}

spawnMole();