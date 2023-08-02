export class UnclampedRGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  constructor(
    r: number = 0,
    g: number = 0,
    b: number = 0
  ) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  toString() { return `(${this.r},${this.g},${this.b})`; }

  toHex() {
    const r = this.r.toString(16).padStart(2,"0");
    const g = this.g.toString(16).padStart(2,"0");
    const b = this.b.toString(16).padStart(2,"0");
    return r + g + b;
  }

  getContrast() { // simple algorithm... I don't know the actual
    return new RGB(
      (this.r > 127) ? 30 : 225,
      (this.g > 127) ? 30 : 225,
      (this.b > 127) ? 30 : 225
    )
  }

  equals(other: UnclampedRGB): boolean {
    return this.r == other.r && this.g == other.g && this.b == other.b;
  }
}

export class RGB extends UnclampedRGB {
  constructor(
    r: number = 0,
    g: number = 0,
    b: number = 0
  ) {
    super(
      Math.min(Math.max(Math.floor(r), 0), 255),
      Math.min(Math.max(Math.floor(g), 0), 255),
      Math.min(Math.max(Math.floor(b), 0), 255)
    );
  }
}

export class Pattern {
  private colors: Matrix<UnclampedRGB>;
  constructor(
    colors: Matrix<UnclampedRGB> | UnclampedRGB,
    fallback: UnclampedRGB = new RGB(0,0,0)
  ) {
    // make a 1x1 matrix of just RGB
    if (colors instanceof UnclampedRGB) {
      const color = colors;
      colors = new Matrix(1,1);
      colors.setAt(color, 0,0);
    }

    this.colors = colors;

    // fill any empty spots with the fallback value
    for (let x = 0; x < colors.width; x++) {
      for (let y = 0; y < colors.height; y++) {
        if (this.colors.getAt(x,y) == null) {
          this.colors.setAt(fallback, x,y);
        }
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    cX: number,
    cY: number,
    scale: number
  ) {
    ctx.clearRect(cX,cY, scale,scale);

    const width = scale / this.colors.width;
    const height = scale / this.colors.height;
    
    for (let x = 0; x < this.colors.width; x++) {
      for (let y = 0; y < this.colors.height; y++) {
        ctx.fillStyle = "#" + this.colors.getAt(x,y).toHex();
        ctx.fillRect(
          cX + x*width,
          cY + y*height,
          width,
          height
        );
      }
    }
  }

  getColor(x: number, y: number) { return this.colors.getAt(x,y); }

  equals(other: Pattern): boolean {
    if (this.colors.width != other.colors.width || this.colors.height != other.colors.height) return false;
    
    // innocent until proven guilty
    for (let x = 0; x < this.colors.width; x++) {
      for (let y = 0; y < this.colors.height; y++) {
        if ( !this.colors.getAt(x,y).equals(other.colors.getAt(x,y)) ) return false;
      }
    }
    return true;
  }

  getXInverted() { return new Pattern(this.colors.getXInverted()); }

  getYInverted() { return new Pattern(this.colors.getYInverted()); }
}

export class Matrix<T> {
  private readonly data: Array<Array<T>> = [];
  private widthQ: number;
  private heightQ: number;
  constructor(
    width: number,
    height: number,
    ...entries: Array<T>
  ) {
    let i = 0;
    // fill by row, then my column
    for (let y = 0; y < height; y++) { // generate columns
      const row: Array<T> = [];
      for (let x = 0; x < width; x++) { // generate rows
        row.push((i < entries.length) ? entries[i] : null);
        i++;
      }
      this.data.push(row);
    }

    this.widthQ = width;
    this.heightQ = height;
  }

  getAt(
    x: number,
    y: number,
    fallback?: T
  ): T {
    if (
      x < 0
      || y < 0
      || x >= this.widthQ
      || y >= this.heightQ
    ) return fallback;
    // if (x < 0) x += this.widthQ;
    // if (y < 0) y += this.heightQ;
    return this.data[y][x];
  }
  
  setAt(el: T, x: number, y: number) {
    if (
      x < 0
      || y < 0
      || x >= this.widthQ
      || y >= this.heightQ
    ) return;
    // if (x < 0) x += this.widthQ;
    // if (y < 0) y += this.heightQ;
    this.data[y][x] = el;
  }

  extendX() {
    for (let y = 0; y < this.height; y++) {
      this.data[y].push(null);
    }
  }
  extendY() {
    const row: Array<T> = [];
    for (let x = 0; x < this.width; x++) {
      row.push(null);
    }
    this.data.push(row);
  }

  get width() { return this.widthQ; }
  get height() { return this.heightQ; }

  getXInverted(width: number = this.widthQ) {
    const matrix = new Matrix<T>(width, this.heightQ);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < this.heightQ; y++) {
        matrix.setAt(this.getAt(width-x-1,y), x,y);
      }
    }
    return matrix;
  }
  getYInverted(height: number = this.heightQ) {
    const matrix = new Matrix<T>(this.width, height);
    for (let x = 0; x < this.widthQ; x++) {
      for (let y = 0; y < height; y++) {
        matrix.setAt(this.getAt(x,height-y-1), x,y);
      }
    }
    return matrix;
  }
  
  getTransformed(callback: (entry: T, x: number, y: number) => T) {
    const matrix = new Matrix<T>(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        matrix.setAt(
          callback(
            this.getAt(x,y),
            x,y
          ),
          x,y
        );
      }
    }
    return matrix;
  }
}

export class LoopMatrix<T> extends Matrix<T> {
  getAt(x: number, y: number) {
    x = x % this.width;
    y = y % this.height;
    if (x < 0) x += this.width;
    if (y < 0) y += this.height;
    return super.getAt(x,y);
  }
  setAt(el: T, x: number, y: number) {
    x = x % this.width;
    y = y % this.height;
    if (x < 0) x += this.width;
    if (y < 0) y += this.height;
    super.setAt(el, x,y);
  }
}

interface DraggableInterface {
  el: HTMLElement
  onClick: (e: MouseEvent) => void
  onRender: () => any
  lockX?: boolean
  lockY?: boolean,
  scale?: number
}

export class Draggable {
  private originX: number = 0;
  private originY: number = 0;
  private offX: number = 0;
  private offY: number = 0;
  scale: number;

  private repeatX: number = 0;
  private repeatY: number = 0;
  
  private isDragging: boolean = false;
  private isDrawing: boolean = false;
  private didDrag: boolean = false;

  private readonly onClick: (e: MouseEvent) => void;
  private readonly onRender: () => any;

  private lockX: boolean;
  private lockY: boolean;

  el: HTMLElement;
  constructor({
    el,
    onClick = () => {},
    onRender = () => {},
    lockX = false,
    lockY = false,
    scale = 40
  }: DraggableInterface) {
    this.el = el;
    
    el.addEventListener("mousedown", this.onmousedown.bind(this));
    el.addEventListener("mousemove", this.onmousemove.bind(this));
    el.addEventListener("mouseup", this.onmouseup.bind(this));
    el.addEventListener("mouseleave", this.onmouseup.bind(this));
    el.addEventListener("contextmenu", (e: MouseEvent) => { e.preventDefault(); })
    
    this.onClick = onClick;
    this.onRender = onRender;

    this.lockX = lockX;
    this.lockY = lockY;
    this.scale = scale;
  }

  onmousedown(e: MouseEvent) {
    if (e.button == 2) { // right click
      this.isDragging = true;
      this.originX = e.pageX;
      this.originY = e.pageY;
      this.didDrag = false;
    }
    else if (e.button == 0) { // left click
      this.onClick(e);
      this.isDrawing = true;
    }
  }
  onmousemove(e: MouseEvent) {
    if (this.isDragging) {
      this.offX -= e.pageX - this.originX;
      this.offY -= e.pageY - this.originY;

      if (this.repeatX) this.offX = this.x % this.repeatX;
      if (this.repeatY) this.offY = this.y % this.repeatY;

      this.originX = e.pageX;
      this.originY = e.pageY;
      
      this.onRender();
      this.didDrag = true;
    }
    else if (this.isDrawing) {
      this.onClick(e);
      this.didDrag = true;
    }
  }
  onmouseup(e: MouseEvent) {
    if (this.isDragging && !this.didDrag) this.onClick(e); // consider it a click if mouse pressed and released without moving
    this.isDragging = false;
    this.isDrawing = false;
  }

  // turns global coords to screen coords
  transform(x: number, y: number): [x: number, y: number] {
    return [
      (x * this.scale) - this.x,
      (y * this.scale) - this.y
    ];
  }
  // turns screen coords to global coords
  untransform(x: number, y: number): [x: number, y: number] {
    return [
      (x + this.x) / this.scale,
      (y + this.y) / this.scale
    ];
  }

  get x() { return (+!this.lockX) * this.offX; }
  get y() { return (+!this.lockY) * this.offY; }

  shift(x:number, y:number) {
    this.offX -= x;
    this.offY -= y;
  }

  repeatAfter(x:number, y:number) {
    this.repeatX = x;
    this.repeatY = y;
    this.offX = this.x % this.repeatX;
    this.offY = this.y % this.repeatY;
  }
}

const defaultPatternMatrix = new Matrix<RGB>(1,1);
defaultPatternMatrix.setAt(new RGB(0,0,0), 0,0);
const defaultPattern = new Pattern( defaultPatternMatrix );

export class Tile {
  private pattern: Pattern = defaultPattern;
  
  constructor() {
    const tileEl = document.createElement("div");
    tileEl.classList.add("tiles");
  }

  // returns if there was a difference
  setPattern(pattern: Pattern): boolean {
    const oldPattern = this.pattern;
    this.pattern = pattern;
    return pattern != pattern;
  }
  getPattern() { return this.pattern; }

  render(
    ctx: CanvasRenderingContext2D,
    cX: number,
    cY: number,
    scale: number
  ) {
    this.pattern.render(ctx,cX, cY, scale);
    // ctx.clearRect(cX,cY, scale,scale);
    // ctx.fillStyle = "#" + this.color.toHex();
    // ctx.fillRect(cX + 1, cY + 1, scale-2, scale-2);
  }
}

export type cDiff = {
  x: number
  y: number
  p: Pattern
};

export type dDiff = {
  x: number
  y: number
  p: () => Pattern
};

// for checking patterns within rules
export abstract class RulePattern {
  readonly possibilities: number;
  constructor(possibilities: number) {
    this.possibilities = possibilities;
  }
  abstract matches(pattern: Pattern): boolean;
  abstract getPattern(): Pattern; // for after-patterns, this acts to choose one of the patterns
  abstract getXInverted(): RulePattern;
  abstract getYInverted(): RulePattern;
}

// this can contain one pattern (match), multiple patterns (match in set), or none (match any)
export class PatternSet extends RulePattern {
  readonly patterns: Pattern[];
  constructor(patterns: Pattern[]) {
    super(patterns.length);
    this.patterns = patterns;

    // can only every match/return the same, allow for precomputation
  }

  // patterns of similar shapes will have the same memory address, therefore direct comparisons can be used here
  matches(pattern: Pattern) {
    if (this.patterns.length == 0) return true; // no need to check

    // guilty until proven innocent method
    for (const testPattern of this.patterns) {
      if (testPattern.equals(pattern)) return true;
    }
    return false;
  }

  getPattern() {
    if (this.patterns.length == 0) return null;
    if (this.patterns.length == 1) return this.patterns[0];
    return this.patterns[Math.floor(Math.random() * this.patterns.length)]; // choose random pattern
  }

  getXInverted() {
    const patterns: Pattern[] = [];
    for (const pattern of this.patterns) {
      patterns.push(pattern.getXInverted());
    }
    return new PatternSet(patterns);
  }
  getYInverted() {
    const patterns: Pattern[] = [];
    for (const pattern of patterns) {
      patterns.push(pattern.getYInverted());
    }
    return new PatternSet(patterns);
  }
}