const crow = document.getElementById("crow");
let direction = 1;

function flyAcross() {
    const viewportWidth = window.innerWidth;
    const crowWidth = crow.offsetWidth;

    const randomTop = 10 + Math.random() * 80;
    crow.style.top = randomTop + "vh";

    if (direction === 1) {

        crow.style.left = viewportWidth + crowWidth + "px";
        crow.style.transform = "scaleX(1)";
    } else {

        crow.style.left = -crowWidth + "px";
        crow.style.transform = "scaleX(-1)";
    }

    direction *= -1;
}

crow.addEventListener("transitionend", (e) => {
    if (e.propertyName === "left") {
        setTimeout(flyAcross, 500);
    }
});

let click = true;

const handleTap = () => {
    crow.style.display = "none";
    if (click) {
        setTimeout(() => {
        crow.style.display = "block";
        flyAcross();
        }, 3000);
        click = false;
    }
};

crow.addEventListener("click", handleTap);

crow.addEventListener("touchstart", handleTap, { passive: true });

crow.style.left = -crow.offsetWidth + "px";
flyAcross();