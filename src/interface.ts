import { CollapsedPattern, Pattern, PatternBase } from "./patterns.js";
import { AnimData, Draggable, LoopMatrix, Matrix, RGB, Tile, mDiff } from "./utils.js";

export class Element {
  readonly el: HTMLElement;
  constructor(el: HTMLElement) {
    this.el = el;
  }

  appendTo(el: HTMLElement) { el.append(this.el); }
}

interface TileableInterface {
  tiles: Matrix<Tile>
  width?: number
  height?: number
  padding?: number,
  doAnimations?: boolean
}

export class Tileable extends Element {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  draggable: Draggable;
  width: number;
  height: number;
  readonly padding: number;

  private clickListeners: Array<(tile: Tile) => void> = [];
  private animationsOverlay: TileAnimations = null;

  readonly tiles: Matrix<Tile>;

  constructor({
    tiles,
    width = 500,
    height = 500,
    padding = 1,
    doAnimations = false
  }: TileableInterface) {
    // const materialsEl = document.createElement("div");
    // materialsEl.classList.add("tiles-containers");

    const canvas = document.createElement("canvas");
    canvas.classList.add("tiles")

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

    if (doAnimations) this.animationsOverlay = new TileAnimations(this);
  }

  appendTo(el: HTMLElement) {
    super.appendTo(el);
    if (this.animationsOverlay) this.animationsOverlay.appendTo(el);
  }

  renderTile(x: number, y: number) {
    const scale = this.draggable.scale;
    const [cX, cY] = this.draggable.transform(x,y);
    
    // check to make sure tile being rendered is on screen
    if (
      cX > -scale
      && cX < this.width
      && cY > -scale
      && cY < this.height
    ) {
      this.tiles.getAt(x,y)?.render(
        this.ctx,
        cX + this.padding,
        cY + this.padding,
        scale - 2*this.padding
      );
      return true; // yes, did render
    }
    return false; // no, did not do render
  }

  render(toUpdate: Array<[x: number, y: number]> = []) {
    if (toUpdate.length == 0) { // update all on screen
      this.ctx.clearRect(0,0, this.width,this.height);
      let [minX, minY] = this.draggable.untransform(0,0)
      let [maxX, maxY] = this.draggable.untransform(this.width,this.height);
      
      minX = Math.floor(minX);
      minY = Math.floor(minY);
      maxX = Math.floor(maxX);
      maxY = Math.floor(maxY);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          this.renderTile(x,y);
        }
      }

      let [gXMin, gYMin] = this.draggable.transform(0,0);
      let [gXMax, gYMax] = this.draggable.transform(this.tiles.width, this.tiles.height);

      this.ctx.beginPath();
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 3;
      this.ctx.moveTo(gXMin,gYMin);
      this.ctx.lineTo(gXMin,gYMax);
      this.ctx.lineTo(gXMax,gYMax);
      this.ctx.lineTo(gXMax, gYMin);
      this.ctx.lineTo(gXMin,gYMin);
      this.ctx.stroke();
    }
    else {
      for (const [x,y] of toUpdate) {
        this.renderTile(x,y);
      }
    }
  }

  getClickedTileId(x: number, y: number): [x:number, y:number] {
    const bounds = this.el.getBoundingClientRect();
    const [cX, cY] = this.draggable.untransform(
      x - bounds.left,
      y - bounds.top
    );
    
    return [Math.floor(cX), Math.floor(cY)];
  }

  getClickedTile(x: number, y: number): Tile {
    const [tileX, tileY] = this.getClickedTileId(x,y);
    return this.tiles.getAt(tileX,tileY, null);
  }

  onClick(listener: (tile: Tile) => void) { this.clickListeners.push(listener); }

  alertListeners(tile: Tile) { this.clickListeners.forEach(listener => listener(tile)); }

  autosize(width=0, height=0, init:boolean=false) {
    const parent = this.el.parentElement;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;
    this.width = width == 0 ? w : width;
    this.height = height == 0 ? h : height;
    this.el.setAttribute("width", `${this.width}px`);
    this.el.setAttribute("height", `${this.height}px`);

    if (this.animationsOverlay) {
      this.animationsOverlay.el.setAttribute("width", `${this.width}px`);
      this.animationsOverlay.el.setAttribute("height", `${this.height}px`);
    }

    if (init) {
      const shiftX = (this.width - this.tiles.width * this.draggable.scale) / 2;
      const shiftY = (this.height - this.tiles.height * this.draggable.scale) / 2;
      this.draggable.shift(shiftX, shiftY);
    }

    this.render();
  }

  runAnimation(animations: AnimData[]) {
    for (const anim of animations) this.animationsOverlay.pushAnimation(anim);
  }

  renderAnimation() { this.animationsOverlay.render(); }
  setAnimationSpeed(period: number) {
    this.animationsOverlay.setAnimationTime(period);
  }
}

interface TilesInterface {
  cols: number
  rows: number
  padding?: number
  looping?: boolean,
  doAnimations?: boolean
}

export class Tiles extends Tileable {
  constructor({
    cols,
    rows,
    padding = 1,
    looping = false,
    doAnimations = false
  }: TilesInterface) {
    const tiles = looping ? new LoopMatrix<Tile>(cols,rows) : new Matrix<Tile>(cols,rows);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        tiles.setAt( new Tile(),i,j );
      }
    }

    super({
      tiles,
      padding,
      doAnimations
    });

    this.draggable = new Draggable({
      el: this.canvas,
      onClick: (e: MouseEvent) => {
        const tile = this.getClickedTile(e.pageX, e.pageY);
        if (tile) this.alertListeners(tile);
      },
      onRender: this.render.bind(this),
      doScroll: true
    });

    if (looping) {
      this.draggable.repeatAfter(
        cols * this.draggable.scale,
        rows * this.draggable.scale
      )
    }

    this.render();
  }
}

export class Materials extends Tileable {
  private selectedX: number = 0;
  private selectedY: number = 0;
  private selectedBackground: string = "";

  constructor(
    materials: PatternBase[],
    cols: number
  ) {
    const rows = Math.ceil(materials.length / cols);
    const tiles = new Matrix<Tile>(cols,rows);

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

        tiles.setAt( tile,x,y );
      }
    }

    super({
      tiles,
      padding: 4
    });

    this.draggable = new Draggable({
      el: this.canvas,
      onClick: (e: MouseEvent) => {
        const tile = this.getClickedTile(e.pageX, e.pageY);
        if (tile) {
          [this.selectedX,this.selectedY] = this.getClickedTileId(e.pageX, e.pageY);
          this.selectedBackground = "#" + tile.getDisplayPattern().getColor(0,0).getContrast().toHex();
          this.render();
        }
      },
      onRender: this.render.bind(this),
      lockX: true
    });

    this.render();
  }

  autosize(x=0, y=0, init:boolean=false) {
    super.autosize(x,y);
    this.draggable.scale = this.width / this.tiles.width;

    this.render();
  }

  renderTile(x: number, y: number) {
    if (x == this.selectedX && y == this.selectedY) {
      const [cX, cY] = this.draggable.transform(x,y);
      const scale = this.draggable.scale;
      if (this.selectedBackground == "") {
        this.selectedBackground = "#" + this.tiles.getAt(0,0).getDisplayPattern().getColor(0,0).getContrast().toHex();
      }
      this.ctx.fillStyle = this.selectedBackground;

      this.ctx.fillRect(
        cX - this.padding / 2,
        cY - this.padding / 2,
        scale + this.padding,
        scale + this.padding
      );
    }
    return super.renderTile(x,y);
  }

  getSelectedPattern() {
    return this.tiles.getAt(
      this.selectedX,
      this.selectedY
    ).getPattern();
  }
}

export class TileAnimations extends Element {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  private animationTime = 100;
  private animations: Array<{data: AnimData, start: number}> = [];
  private underlay: Tileable;

  constructor(underlay: Tileable) {
    const canvas = document.createElement("canvas");
    canvas.classList.add("animations");

    super(canvas);

    this.underlay = underlay;
    
    canvas.setAttribute("width", `${this.underlay.width}px`);
    canvas.setAttribute("height", `${this.underlay.height}px`);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }
  setAnimationTime(millis: number) {
    this.animationTime = millis;
  }

  pushAnimation(diff: AnimData) {
    this.animations.push({
      data: diff,
      start: (new Date()).getTime()
    });
  }

  render() {
    const now = (new Date()).getTime();
    const toRemove: number[] = [];
    
    this.ctx.beginPath();
    this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    for (let i in this.animations) {
      const animation = this.animations[i];
      if (now - animation.start > this.animationTime) { // remove this animation
        toRemove.push(+i);
        continue;
      }
      let progress = (now - animation.start) / this.animationTime; // between 0 and 1
      
      let x = animation.data.x + animation.data.data.xi + (animation.data.data.x - animation.data.data.xi) * progress;
      let y = animation.data.y + animation.data.data.yi + (animation.data.data.y - animation.data.data.yi) * progress;

      const [cX, cY] = this.underlay.draggable.transform(x,y);

      animation.data.data.p.render(
        this.ctx,
        cX + this.underlay.padding,
        cY + this.underlay.padding,
        this.underlay.draggable.scale - 2*this.underlay.padding
      );
    }

    this.ctx.stroke();

    // loop backwards to removing from indicies doesn't affect position of other indicies
    for (let i = toRemove.length-1; i >= 0; i--) {
      const index = toRemove[i];
      const animationData = this.animations[index].data;
      const x = animationData.x + animationData.data.x;
      const y = animationData.y + animationData.data.y;
      this.underlay.renderTile( x,y );
      this.animations.splice(index,1);
    }
  }
}