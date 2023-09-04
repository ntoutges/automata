import { Tiles } from "./interface.js";
import { Pattern } from "./patterns.js";
import { Simulation } from "./sim.js";
import { SmartInterval } from "./smartInterval.js";
import { materials, rules } from "./user-rules.js";
import { RGB } from "./utils.js";
const nullPattern = new Pattern(new RGB(0, 0, 0));
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
    tile.setPattern(materials.getSelectedPattern().collapse({
        oldPattern: nullPattern,
        key: keyData
    }));
    tiles.render([tiles.getClickedTileLocation()]);
    didRenderFullScreen = false;
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
}, 10);
const printableKeysStr = "abcdefghijklmnopqrstuvwxyz0123456789";
const printableKeys = new Set();
for (const key of printableKeysStr) {
    printableKeys.add(key);
}
var keyData = null;
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
    const key = e.key.toLowerCase();
    if (!e.repeat && printableKeys.has(key)) {
        keyData = {
            key: key,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey
        };
        $("#input-value").innerText = key.toUpperCase();
    }
});
document.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (keyData && keyData.key == key) {
        keyData = null;
        $("#input-value").innerText = "";
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
let didRenderFullScreen = false;
function step() {
    if (isClicking) {
        const [x, y] = tiles.getClickedTileLocation();
        tiles.tiles.getAt(x, y)?.setPattern(materials.getSelectedPattern().collapse({
            oldPattern: nullPattern,
            key: null
        }));
        tiles.render([tiles.getClickedTileLocation()]);
        didRenderFullScreen = false;
    }
    const updateData = sim.tickAll(keyData);
    if (updateData.diffs.length) { // only render needed
        tiles.render(updateData.diffs);
        didRenderFullScreen = false;
    }
    else if (!didRenderFullScreen) { // render all
        tiles.render();
        didRenderFullScreen = true;
    }
    tiles.runAnimation(updateData.anims);
}
function setSpeed() {
    const period = Math.max(1000 - ((+$("#speed").value) * 10), 1);
    interval.setInterval(period);
    tiles.setAnimationSpeed(period);
}
//# sourceMappingURL=automata.js.map