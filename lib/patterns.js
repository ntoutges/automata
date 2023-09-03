import { Matrix, RGB, UnclampedRGB, generateRGBWithinRange, getLCMFactors, isRGBWithinRange } from "./utils.js";
export class PatternBase {
}
export class QuantumPattern extends PatternBase {
}
export class CollapsedPattern extends PatternBase {
    colors;
    getColors() { return this.colors; }
    collapse() { return this; } // collapsed pattern, when collapsing, just returns itself
}
export class Pattern extends CollapsedPattern {
    constructor(colors, fallback = new RGB(0, 0, 0)) {
        super();
        // make a 1x1 matrix of just RGB
        if (colors instanceof UnclampedRGB) {
            const color = colors;
            colors = new Matrix(1, 1);
            colors.setAt(color, 0, 0);
        }
        this.colors = colors;
        // fill any empty spots with the fallback value
        for (let x = 0; x < colors.width; x++) {
            for (let y = 0; y < colors.height; y++) {
                if (this.colors.getAt(x, y) == null) {
                    this.colors.setAt(fallback, x, y);
                }
            }
        }
    }
    render(ctx, cX, cY, scale) {
        ctx.clearRect(cX, cY, scale, scale);
        const width = scale / this.colors.width;
        const height = scale / this.colors.height;
        for (let x = 0; x < this.colors.width; x++) {
            for (let y = 0; y < this.colors.height; y++) {
                ctx.fillStyle = "#" + this.colors.getAt(x, y).toHex();
                ctx.fillRect(cX + x * width, cY + y * height, width, height);
            }
        }
    }
    getColor(x, y) { return this.colors.getAt(x, y); }
    equals(other) {
        if (other instanceof CollapsedPattern) {
            if (this.colors.width != other.colors.width || this.colors.height != other.colors.height)
                return false;
            // innocent until proven guilty
            for (let x = 0; x < this.colors.width; x++) {
                for (let y = 0; y < this.colors.height; y++) {
                    if (!this.colors.getAt(x, y).equals(other.colors.getAt(x, y)))
                        return false;
                }
            }
            return true;
        }
        return other.equals(this); // other instanceof QuantumPattern (force quantum pattern implementation to handle this)
    }
    getXInverted() { return new Pattern(this.colors.getXInverted()); }
    getYInverted() { return new Pattern(this.colors.getYInverted()); }
}
export class PatternRange extends QuantumPattern {
    // both these will have the same dimensions
    patternA;
    patternB;
    constructor(patternA, patternB) {
        super();
        const widthFactors = getLCMFactors(patternA.getColors().width, patternB.getColors().width);
        const heightFactors = getLCMFactors(patternA.getColors().height, patternB.getColors().height);
        if (widthFactors.a == 1 && widthFactors.b == 1 && heightFactors.a == 1 && heightFactors.b == 1) { // no manipulation required
            this.patternA = patternA;
            this.patternB = patternB;
        }
        else { // extrapolation!
            this.patternA = new Pattern(patternA.getColors().extrapolate(widthFactors.a, heightFactors.a));
            this.patternB = new Pattern(patternB.getColors().extrapolate(widthFactors.b, heightFactors.b));
        }
    }
    getPatternA() { return this.patternA; }
    getPatternB() { return this.patternB; }
    equals(other) {
        if (other instanceof CollapsedPattern) { // check if all RGB values within range
            const width = this.patternA.getColors().width;
            const height = this.patternA.getColors().height;
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    if (!isRGBWithinRange(other.getColor(x, y), this.patternA.getColor(x, y), this.patternB.getColor(x, y)))
                        return false; // component outside range, therefore doesn't match
                }
            }
            return true;
        }
        else { // other instanceof QuantumPattern // check if all same type, if so, check if same patternA and patternB values
            if (other instanceof PatternRange)
                return this.patternA.equals(other.getPatternA()) && this.patternB.equals(other.getPatternB());
            return false; // not the same type of pattern, so immediatly different
        }
    }
    collapse() {
        const width = this.patternA.getColors().width;
        const height = this.patternA.getColors().height;
        const colors = new Matrix(width, height);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                colors.setAt(generateRGBWithinRange(this.patternA.getColor(x, y), this.patternB.getColor(x, y)), x, y);
            }
        }
        return new Pattern(colors);
    }
    getXInverted() {
        return new PatternRange(this.patternA.getXInverted(), this.patternB.getXInverted());
    }
    getYInverted() {
        return new PatternRange(this.patternA.getYInverted(), this.patternB.getYInverted());
    }
}
//# sourceMappingURL=patterns.js.map