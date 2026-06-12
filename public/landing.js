const enterBtn = document.getElementById("enterBtn");
const lightsScreen = document.getElementById("lightsScreen");
const lights = document.querySelectorAll(".light");

enterBtn.addEventListener("click", () => {

    lightsScreen.classList.add("active");
    enterBtn.disabled = true;

    lights.forEach((light, index) => {
        setTimeout(() => {
            light.classList.add("on");
        }, (index + 1) * 450);
    });

    setTimeout(() => {
        lights.forEach(light => {
            light.classList.add("off");
        });
    }, 2800);

    setTimeout(() => {
        window.location.href = "index.html";
    }, 3600);

});