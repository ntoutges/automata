import { Draggable, LoopMatrix, Matrix, Tile } from "./utils.js";
export class Element {
    el;
    constructor(el) {
        this.el = el;
    }
    appendTo(el) { el.append(this.el); }
}
export class Tileable extends Element {
    canvas;
    ctx;
    draggable;
    width;
    height;
    padding;
    clickListeners = [];
    tiles;
    constructor({ tiles, width = 500, height = 500, padding = 1 }) {
        // const materialsEl = document.createElement("div");
        // materialsEl.classList.add("tiles-containers");
        const canvas = document.createElement("canvas");
        canvas.classList.add("tiles");
        // materialsEl.append(canvas);
        super(canvas);
        this.tiles = tiles;
        this.width = width;
        this.height = height;
        this.padding = padding;
        canvas.setAttribute("width", `${this.width}px`);
        canvas.setAttribute("height", `${this.height}px`);
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        // this.render();
    }
    renderTile(x, y) {
        const scale = this.draggable.scale;
        const [cX, cY] = this.draggable.transform(x, y);
        // check to make sure tile being rendered is on screen
        if (cX > -scale
            && cX < this.width
            && cY > -scale
            && cY < this.height) {
            this.tiles.getAt(x, y)?.render(this.ctx, cX + this.padding, cY + this.padding, scale - 2 * this.padding);
            return true; // yes, did render
        }
        return false; // no, did not do render
    }
    render(toUpdate = []) {
        if (toUpdate.length == 0) { // update all on screen
            this.ctx.clearRect(0, 0, this.width, this.height);
            let [minX, minY] = this.draggable.untransform(0, 0);
            let [maxX, maxY] = this.draggable.untransform(this.width, this.height);
            minX = Math.floor(minX);
            minY = Math.floor(minY);
            maxX = Math.floor(maxX);
            maxY = Math.floor(maxY);
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    this.renderTile(x, y);
                }
            }
            let [gXMin, gYMin] = this.draggable.transform(0, 0);
            let [gXMax, gYMax] = this.draggable.transform(this.tiles.width, this.tiles.height);
            this.ctx.beginPath();
            this.ctx.strokeStyle = "#ffffff";
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(gXMin, gYMin);
            this.ctx.lineTo(gXMin, gYMax);
            this.ctx.lineTo(gXMax, gYMax);
            this.ctx.lineTo(gXMax, gYMin);
            this.ctx.lineTo(gXMin, gYMin);
            this.ctx.stroke();
        }
        else {
            for (const [x, y] of toUpdate) {
                this.renderTile(x, y);
            }
        }
    }
    getClickedTileId(x, y) {
        const bounds = this.el.getBoundingClientRect();
        const [cX, cY] = this.draggable.untransform(x - bounds.left, y - bounds.top);
        return [Math.floor(cX), Math.floor(cY)];
    }
    getClickedTile(x, y) {
        const [tileX, tileY] = this.getClickedTileId(x, y);
        return this.tiles.getAt(tileX, tileY, null);
    }
    onClick(listener) { this.clickListeners.push(listener); }
    alertListeners(tile) { this.clickListeners.forEach(listener => listener(tile)); }
    autosize(width = 0, height = 0, init = false) {
        const parent = this.el.parentElement;
        const w = parent.offsetWidth;
        const h = parent.offsetHeight;
        this.width = width == 0 ? w : width;
        this.height = height == 0 ? h : height;
        this.el.setAttribute("width", `${this.width}px`);
        this.el.setAttribute("height", `${this.height}px`);
        if (init) {
            const shiftX = (this.width - this.tiles.width * this.draggable.scale) / 2;
            const shiftY = (this.height - this.tiles.height * this.draggable.scale) / 2;
            this.draggable.shift(shiftX, shiftY);
        }
        this.render();
    }
}
export class Tiles extends Tileable {
    constructor({ cols, rows, padding = 1, looping = false }) {
        const tiles = looping ? new LoopMatrix(cols, rows) : new Matrix(cols, rows);
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                tiles.setAt(new Tile(), i, j);
            }
        }
        super({
            tiles,
            padding
        });
        this.draggable = new Draggable({
            el: this.canvas,
            onClick: (e) => {
                const tile = this.getClickedTile(e.pageX, e.pageY);
                if (tile)
                    this.alertListeners(tile);
            },
            onRender: this.render.bind(this)
        });
        if (looping) {
            this.draggable.repeatAfter(cols * this.draggable.scale, rows * this.draggable.scale);
        }
        this.render();
    }
}
export class Materials extends Tileable {
    selectedX = 0;
    selectedY = 0;
    selectedBackground = "";
    constructor(materials, cols) {
        const rows = Math.ceil(materials.length / cols);
        const tiles = new Matrix(cols, rows);
        let i = 0;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                // if no materials left, fill with empty patterns
                if (i >= materials.length) {
                    // tiles.setAt( new Tile(),x,y );
                    // continue;
                    break;
                }
                const tile = new Tile();
                tile.setPattern(materials[i]);
                i++;
                tiles.setAt(tile, x, y);
            }
        }
        super({
            tiles,
            padding: 4
        });
        this.draggable = new Draggable({
            el: this.canvas,
            onClick: (e) => {
                const tile = this.getClickedTile(e.pageX, e.pageY);
                if (tile) {
                    [this.selectedX, this.selectedY] = this.getClickedTileId(e.pageX, e.pageY);
                    this.selectedBackground = "#" + tile.getPattern().getColor(0, 0).getContrast().toHex();
                    this.render();
                }
            },
            onRender: this.render.bind(this),
            lockX: true
        });
        this.render();
    }
    autosize(x = 0, y = 0, init = false) {
        super.autosize(x, y);
        this.draggable.scale = this.width / this.tiles.width;
        this.render();
    }
    renderTile(x, y) {
        if (x == this.selectedX && y == this.selectedY) {
            const [cX, cY] = this.draggable.transform(x, y);
            const scale = this.draggable.scale;
            if (this.selectedBackground == "") {
                this.selectedBackground = "#" + this.tiles.getAt(0, 0).getPattern().getColor(0, 0).getContrast().toHex();
            }
            this.ctx.fillStyle = this.selectedBackground;
            this.ctx.fillRect(cX - this.padding / 2, cY - this.padding / 2, scale + this.padding, scale + this.padding);
        }
        return super.renderTile(x, y);
    }
    getSelectedPattern() {
        return this.tiles.getAt(this.selectedX, this.selectedY).getPattern();
    }
}
//# sourceMappingURL=interface.js.map