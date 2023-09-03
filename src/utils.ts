import { CollapsedPattern, Pattern, PatternBase } from "./patterns.js";

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

// returns a new RGB whose R,G,B values are within the range set by the two input RGBs
export function generateRGBWithinRange(
  rgbA: UnclampedRGB,
  rgbB: UnclampedRGB
): UnclampedRGB {
  const minR = Math.min(rgbA.r, rgbB.r);
  const maxR = Math.max(rgbA.r, rgbB.r);
  const minG = Math.min(rgbA.g, rgbB.g);
  const maxG = Math.max(rgbA.g, rgbB.g);
  const minB = Math.min(rgbA.b, rgbB.b);
  const maxB = Math.max(rgbA.b, rgbB.b);

  return new UnclampedRGB(
    minR + Math.floor(Math.random() * (maxR - minR)),
    minG + Math.floor(Math.random() * (maxG - minG)),
    minB + Math.floor(Math.random() * (maxB - minB))
  );
}

export function generateMonochromeRGBWithinRange(
  rgbA: UnclampedRGB,
  rgbB: UnclampedRGB,
  modifier: number // between 0 and 1
): UnclampedRGB {
  const minR = Math.min(rgbA.r, rgbB.r);
  const maxR = Math.max(rgbA.r, rgbB.r);
  const minG = Math.min(rgbA.g, rgbB.g);
  const maxG = Math.max(rgbA.g, rgbB.g);
  const minB = Math.min(rgbA.b, rgbB.b);
  const maxB = Math.max(rgbA.b, rgbB.b);

  return new UnclampedRGB(
    minR + Math.floor(modifier * (maxR - minR)),
    minG + Math.floor(modifier * (maxG - minG)),
    minB + Math.floor(modifier * (maxB - minB))
  );
}

export function isRGBWithinRange(
  rgbTest: UnclampedRGB,
  rgbA: UnclampedRGB,
  rgbB: UnclampedRGB
): boolean {
  const minR = Math.min(rgbA.r, rgbB.r);
  const maxR = Math.max(rgbA.r, rgbB.r);
  const minG = Math.min(rgbA.g, rgbB.g);
  const maxG = Math.max(rgbA.g, rgbB.g);
  const minB = Math.min(rgbA.b, rgbB.b);
  const maxB = Math.max(rgbA.b, rgbB.b);

  return rgbTest.r >= minR && rgbTest.r <= maxR
  && rgbTest.g >= minG && rgbTest.g <= maxG
  && rgbTest.b >= minB && rgbTest.b <= maxB;
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

  // extend matrix by a certain factor, and return that new matrix (non-mutating)
  extrapolate(
    widthFactor: number,
    heightFactor: number
  ): Matrix<T> {
    if (widthFactor <= 0 || Math.floor(widthFactor) != widthFactor) throw new Error(`Invalid Width Factor: ${widthFactor}`);
    if (heightFactor <= 0 || Math.floor(heightFactor) != heightFactor) throw new Error(`Invalid Height Factor: ${heightFactor}`);

    const entries: T[] = [];
    for (let y = 0; y < this.heightQ; y++) {
      for (let y2 = 0; y2 < heightFactor; y2++) {

        for (let x = 0; x < this.widthQ; x++) {
          for (let x2 = 0; x2 < widthFactor; x2++) {
            entries.push(this.getAt(x,y));
          }
        }
        
      }
    }
    return new (Function.prototype.bind.apply(
      Matrix<T>,
      [].concat(
        Matrix<T>,
        this.widthQ*widthFactor,
        this.heightQ*heightFactor,
        entries
      ))
    );
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
  onClick?: (e: MouseEvent) => void
  onUnClick?: (e: MouseEvent) => void,
  onRender?: () => any
  lockX?: boolean
  lockY?: boolean,
  scale?: number,
  doScroll?: boolean
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
  private readonly onUnClick: (e: MouseEvent) => void;
  private readonly onRender: () => any;

  private lockX: boolean;
  private lockY: boolean;

  el: HTMLElement;
  constructor({
    el,
    onClick = () => {},
    onUnClick = () => {},
    onRender = () => {},
    lockX = false,
    lockY = false,
    scale = 40,
    doScroll = false
  }: DraggableInterface) {
    this.el = el;
    
    el.addEventListener("mousedown", this.onmousedown.bind(this));
    el.addEventListener("mousemove", this.onmousemove.bind(this));
    el.addEventListener("mouseup", this.onmouseup.bind(this));
    el.addEventListener("mouseleave", this.onmouseup.bind(this));
    el.addEventListener("contextmenu", (e: MouseEvent) => { e.preventDefault(); })
    
    if (doScroll) el.addEventListener("wheel", this.doScroll.bind(this));

    this.onClick = onClick;
    this.onUnClick = onUnClick;
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
    this.onUnClick(e); // consider unclick if mouse moved (thus, click event fired...?)
    this.isDragging = false;
    this.isDrawing = false;
  }
  doScroll(e: WheelEvent) {
    if (e.deltaY > 0) { // scroll out
      // debugger
      this.scale *= 0.9;
      this.offX = ((this.offX + e.pageX) * 0.9) - e.pageX;
      this.offY = ((this.offY + e.pageY) * 0.9) - e.pageY;
      this.onRender();
    }
    else if (e.deltaY < 0) { // scroll in
      this.scale /= 0.9;
      this.offX = ((this.offX + e.pageX) / 0.9) - e.pageX;
      this.offY = ((this.offY + e.pageY) / 0.9) - e.pageY;
      this.onRender();
    }
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
  private displayPattern: CollapsedPattern = defaultPattern;
  private actualPattern: PatternBase = defaultPattern;
  
  constructor() {
    const tileEl = document.createElement("div");
    tileEl.classList.add("tiles");
  }

  // returns if there was a difference
  setPattern(pattern: PatternBase): boolean {
    const oldPattern = this.displayPattern;
    this.actualPattern = pattern;
    this.displayPattern = pattern.collapse();
    return pattern.equals(oldPattern);
  }
  getPattern() { return this.actualPattern; }
  getDisplayPattern() { return this.displayPattern; }

  render(
    ctx: CanvasRenderingContext2D,
    cX: number,
    cY: number,
    scale: number
  ) {
    this.displayPattern.render(ctx,cX, cY, scale);
    // ctx.clearRect(cX,cY, scale,scale);
    // ctx.fillStyle = "#" + this.color.toHex();
    // ctx.fillRect(cX + 1, cY + 1, scale-2, scale-2);
  }
}

// constant difference ((x,y) changes to a specific tile type)
export type cDiff = {
  x: number
  y: number
  p: PatternBase
};

// dynamic difference ((x,y) changes to result of a function)
export type dDiff = {
  x: number
  y: number
  p: () => PatternBase
};

// dynamic movement difference ((xi,yi) moves to (x,y))
export type dmDiff = {
  xi: number,
  yi: number,
  x: number,
  y: number
}

// movement difference ((xi,yi) moves to (x,y), staying the same tile [p])
export type mDiff = {
  xi: number,
  yi: number,
  x: number,
  y: number,
  p: CollapsedPattern
}

// result differences (deterministic)
export type rDiff = cDiff | mDiff;

// dynamically... dynamic diffs (multiple types of dynamic diffs)
export type ddDiff = dDiff | dmDiff;

export function isCDiff(diff: rDiff): diff is cDiff {
  return "x" in diff;
}

export function isMDiff(diff: rDiff): diff is mDiff {
  return "xi" in diff;
}


export type AnimData = {
  x: number,
  y: number,
  data: mDiff
};

// export function getLCM(
//   a: number,
//   b: number
// ) {
//   const a_factors = getFactors(a);
//   const b_factors = getFactors(b);
// }

// // returns series of primes that multiply to get the value
// function getFactors(
//   value: number
// ): number[] {
//   if (Math.floor(value) != value) return []; // value is not an int

//   const factors: number[] = [];
//   if (value < 1) { // handle negative numbers
//     factors.push(-1);
//     value *= -1;
//   }
//   if (value <= 1) return factors; // number too small 

//   let factor = 2;
//   while (value != 1) {
//     if (value % factor == 0) {
//       factors.push(factor);
//       value /= factor;
//     }
//     else factor++;
//   }

//   return factors;
// }

// returns integer factors to make a and b equal
export function getLCMFactors( // slow, but works for now
  a: number,
  b: number
): { a: number, b: number } {

  let aMul = 1;
  let bMul = 1;
  
  let aTemp = a;
  let bTemp = b;
  
  while (aTemp != bTemp) {
    if (aTemp < bTemp) { // [a] too low, increase multiplier
      // aMul *= Math.floor(bTemp / aTemp);
      aMul++;
      aTemp = a * aMul;
    }
    else { // aTemp > bTemp // [b] too low, increase multiplier
      // bMul *= Math.floor(aTemp / bTemp);;
      bMul++;
      bTemp = b * bMul;
    }
  }
  
  return {
    a: aMul,
    b: bMul
  };
}
