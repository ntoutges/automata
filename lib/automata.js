import { Tiles } from "./interface.js";
import { Simulation } from "./sim.js";
import { SmartInterval } from "./smartInterval.js";
import { materials, rules } from "./user-rules.js";
const $ = document.querySelector.bind(document);
const tiles = new Tiles({
    rows: 50,
    cols: 50,
    padding: 0.5,
    looping: false,
    doAnimations: true
});
tiles.appendTo($("#pibox"));
let isClicking = false;
let willClicking = false;
let isClickingTimeout;
tiles.autosize(0, 0, true);
tiles.onClick((tile) => {
    tile.setPattern(materials.getSelectedPattern().collapse());
    tiles.render([tiles.getClickedTileLocation()]);
    willClicking = true;
    isClickingTimeout = setTimeout(() => {
        if (!willClicking)
            clearTimeout(isClickingTimeout);
        else
            isClicking = true;
    }, 200);
});
tiles.onUnClick(() => {
    willClicking = false;
    isClicking = false;
});
materials.appendTo($("#toolbox"));
materials.autosize(150);
const sim = new Simulation(tiles.tiles, rules);
const interval = new SmartInterval(() => {
    // tiles.render( sim.tickAll() );
    step();
}, 100);
setInterval(() => {
    tiles.renderAnimation();
    if (isClicking) {
        const [x, y] = tiles.getClickedTileLocation();
        tiles.tiles.getAt(x, y)?.setPattern(materials.getSelectedPattern().collapse());
        tiles.render([tiles.getClickedTileLocation()]);
    }
}, 10);
$("#play").addEventListener("click", play);
$("#step").addEventListener("click", stepPause);
document.addEventListener("keydown", (e) => {
    const speedStep = (e.ctrlKey) ? 10 : 1;
    switch (e.key) {
        case " ": // space
            play();
            break;
        case ".": // right arrow
            stepPause();
            break;
        case "ArrowUp":
            $("#speed").value = Math.min(+$("#speed").value + speedStep, 100);
            setSpeed();
            break;
        case "ArrowDown":
            $("#speed").value = Math.max($("#speed").value - speedStep, 1);
            setSpeed();
            break;
    }
});
$("#speed").addEventListener("input", setSpeed);
setSpeed();
function play() {
    if ($("#play").classList.contains("paused")) { // now playing
        $("#play").classList.remove("paused");
        $("#play").innerText = "Pause";
        interval.play();
    }
    else { // now pausing
        $("#play").classList.add("paused");
        $("#play").innerText = "Play";
        interval.pause();
    }
}
function stepPause() {
    step();
    if (!interval.isPaused)
        play();
}
function step() {
    const updateData = sim.tickAll();
    tiles.render(updateData.diffs);
    tiles.runAnimation(updateData.anims);
}
function setSpeed() {
    const period = Math.max(1000 - ((+$("#speed").value) * 10), 1);
    interval.setInterval(period);
    tiles.setAnimationSpeed(period);
}
//# sourceMappingURL=automata.js.map