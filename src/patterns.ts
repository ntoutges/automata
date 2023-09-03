import { Matrix, RGB, UnclampedRGB, generateMonochromeRGBWithinRange, generateRGBWithinRange, getLCMFactors, isMonochromeRGBWithinRange, isRGBWithinRange } from "./utils.js";

export abstract class PatternBase {
  abstract equals(other: PatternBase): boolean;
  abstract getXInverted(): PatternBase;
  abstract getYInverted(): PatternBase;

  abstract collapse(): CollapsedPattern;
}

export abstract class QuantumPattern extends PatternBase { // represents multiple different patterns, but is not one pattern specifically
}

export abstract class CollapsedPattern extends PatternBase { // represents one specific pattern
  colors: Matrix<UnclampedRGB>;
  abstract render(
    ctx: CanvasRenderingContext2D,
    cX: number,
    cY: number,
    scale: number
  ): void;
  
  abstract getColor(x: number, y: number): UnclampedRGB;
  getColors() { return this.colors; }

  collapse() { return this; } // collapsed pattern, when collapsing, just returns itself
}

export class Pattern extends CollapsedPattern {
  constructor(
    colors: Matrix<UnclampedRGB> | UnclampedRGB,
    fallback: UnclampedRGB = new RGB(0,0,0)
  ) {
    super();

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

  equals(other: PatternBase): boolean {
    if (other instanceof CollapsedPattern) { 
      if (this.colors.width != other.colors.width || this.colors.height != other.colors.height) return false;
      

      // innocent until proven guilty
      for (let x = 0; x < this.colors.width; x++) {
        for (let y = 0; y < this.colors.height; y++) {
          if ( !this.colors.getAt(x,y).equals(other.colors.getAt(x,y)) ) return false;
        }
      }
      return true;
    }
    return other?.equals(this); // other instanceof QuantumPattern (force quantum pattern implementation to handle this)
  }

  getXInverted() { return new Pattern(this.colors.getXInverted()); }
  getYInverted() { return new Pattern(this.colors.getYInverted()); }
}

export class PatternRange extends QuantumPattern {
  // both these will have the same dimensions
  private patternA: Pattern;
  private patternB: Pattern;

  constructor(
    patternA: Pattern,
    patternB: Pattern
  ) {
    super();
    const widthFactors = getLCMFactors(patternA.getColors().width, patternB.getColors().width);
    const heightFactors = getLCMFactors(patternA.getColors().height, patternB.getColors().height);

    if (widthFactors.a == 1 && widthFactors.b == 1 && heightFactors.a == 1 && heightFactors.b == 1) { // no manipulation required
      this.patternA = patternA;
      this.patternB = patternB;
    }
    else { // extrapolation!
      this.patternA = new Pattern(
        patternA.getColors().extrapolate(
          widthFactors.a,
          heightFactors.a
        )
      )
      this.patternB = new Pattern(
        patternB.getColors().extrapolate(
          widthFactors.b,
          heightFactors.b
        )
      )
    }
  }

  getPatternA() { return this.patternA; }
  getPatternB() { return this.patternB; }
  
  equals(other: PatternBase) {
    if (other instanceof CollapsedPattern) { // check if all RGB values within range
      const width = this.patternA.getColors().width;
      const height = this.patternA.getColors().height;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (
            !isRGBWithinRange(
              other.getColor(x,y),
              this.patternA.getColor(x,y),
              this.patternB.getColor(x,y)
            )
          ) return false; // component outside range, therefore doesn't match
        }
      }
      return true;
    }
    else { // other instanceof QuantumPattern // check if all same type, if so, check if same patternA and patternB values
      if (other instanceof PatternRange) return this.patternA.equals(other.getPatternA()) && this.patternB.equals(other.getPatternB());
      return false; // not the same type of pattern, so immediatly different
    }
  }

  collapse() {
    const width = this.patternA.getColors().width;
    const height = this.patternA.getColors().height;
    
    const colors = new Matrix<UnclampedRGB>(width,height);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        colors.setAt(
          generateRGBWithinRange(
            this.patternA.getColor(x,y),
            this.patternB.getColor(x,y)
          ),
          x,y
        );
      }
    }

    return new Pattern( colors );
  }

  getXInverted() {
    return new PatternRange(
      this.patternA.getXInverted(),
      this.patternB.getXInverted()
    )
  }
  getYInverted() {
    return new PatternRange(
      this.patternA.getYInverted(),
      this.patternB.getYInverted()
    )
  }
}

// all rgb values change linearly
export class PatternRangeMonochrome extends PatternRange {
  equals(other: PatternBase) {
    if (other instanceof CollapsedPattern) { // check if all RGB values within range
      const patternA = this.getPatternA();
      const patternB = this.getPatternB();

      const width = patternA.getColors().width;
      const height = patternA.getColors().height;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (
            !isMonochromeRGBWithinRange(
              other.getColor(x,y),
              patternA.getColor(x,y),
              patternB.getColor(x,y)
            )
          ) return false; // component outside range, therefore doesn't match
        }
      }
      return true;
    }
    else { // other instanceof QuantumPattern // check if all same type, if so, check if same patternA and patternB values
      if (other instanceof PatternRangeMonochrome) return this.getPatternA().equals(other.getPatternA()) && this.getPatternB().equals(other.getPatternB());
      return false; // not the same type of pattern, so immediatly different
    }
  }

  collapse() {
    const patternA = this.getPatternA();
    const patternB = this.getPatternB();

    const width = patternA.getColors().width;
    const height = patternA.getColors().height;
    
    const colors = new Matrix<UnclampedRGB>(width,height);
    let modifier = Math.random();
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        colors.setAt(
          generateMonochromeRGBWithinRange(
            patternA.getColor(x,y),
            patternB.getColor(x,y),
            modifier
          ),
          x,y
        );
      }
    }

    return new Pattern( colors );
  }
}