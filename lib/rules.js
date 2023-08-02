import { Pattern, Tile, UnclampedRGB } from "./utils.js";
const ruleFallback = new Tile();
ruleFallback.setPattern(new Pattern(new UnclampedRGB(0, 0, 1000)));
export class Rule {
    width;
    height;
    constDiffs = []; // list of all rule possibilities -> list of precomputed constant differences
    dynaDiffs = []; // list of all rule possibilities -> list of callbacks to differences that need to be computed at runtime
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
}
export class SpatialRule extends Rule {
    tilesPatternBefore = [];
    constructor(// these don't actually need to be the same size
    tilesPatternBefore, tilesPatternAfter, symX = false, // symmetry over x axis
    symY = false // symmetry over y axis
    ) {
        super(tilesPatternBefore.width, tilesPatternBefore.height);
        this.constructRule(tilesPatternBefore, tilesPatternAfter);
        if (symX) {
            // tilesPatternBefore.getXInverted().getTransformed((entry: RulePattern) => { return entry; console.log(entry.getXInverted()) })
            this.constructRule(tilesPatternBefore.getXInverted().getTransformed((entry) => { return entry.getXInverted(); }), tilesPatternAfter.getXInverted().getTransformed((entry) => { return entry.getXInverted(); }));
        }
        if (symY) {
            this.constructRule(tilesPatternBefore.getYInverted().getTransformed((entry) => { return entry.getYInverted(); }), tilesPatternAfter.getYInverted().getTransformed((entry) => { return entry.getYInverted(); }));
        }
        if (symX && symY) {
            this.constructRule(tilesPatternBefore.getXInverted().getYInverted().getTransformed((entry) => { return entry.getXInverted().getYInverted(); }), tilesPatternAfter.getXInverted().getYInverted().getTransformed((entry) => { return entry.getXInverted().getYInverted(); }));
        }
    }
    constructRule(tilesPatternBefore, tilesPatternAfter) {
        this.tilesPatternBefore.push(tilesPatternBefore);
        const ruleCDiffs = [];
        const ruleDDiffs = [];
        for (let x = 0; x < tilesPatternAfter.width; x++) {
            for (let y = 0; y < tilesPatternAfter.height; y++) {
                const afterPattern = tilesPatternAfter.getAt(x, y);
                if (afterPattern.possibilities == 0)
                    continue; // no need
                if (afterPattern.possibilities == 1) { // constant
                    if ((x >= tilesPatternBefore.width || y >= tilesPatternBefore.height)) { // outside before, always (consided) different
                        ruleCDiffs.push({
                            x, y, p: afterPattern.getPattern()
                        });
                        continue;
                    }
                    const beforePattern = tilesPatternBefore.getAt(x, y);
                    if (beforePattern.possibilities == 1 && beforePattern.getPattern() != afterPattern.getPattern()) { // before and after are constant, and not similar
                        ruleCDiffs.push({
                            x, y, p: afterPattern.getPattern()
                        });
                        continue;
                    }
                }
                // dynamic
                ruleDDiffs.push({
                    x, y, p: afterPattern.getPattern.bind(afterPattern)
                });
            }
        }
        this.constDiffs.push(ruleCDiffs);
        this.dynaDiffs.push(ruleDDiffs);
    }
    checkAt(x, y, tiles) {
        let allDiffs = [];
        for (let i in this.tilesPatternBefore) {
            let isValidPattern = true; // innocent until proven guilty method
            for (let x2 = 0; x2 < this.width; x2++) {
                for (let y2 = 0; y2 < this.height; y2++) {
                    if ( // if it doesn't match, it cannot be true
                    !this.tilesPatternBefore[i].getAt(x2, y2).matches(tiles.getAt(x + x2, y + y2, ruleFallback).getPattern())) {
                        isValidPattern = false;
                        break;
                    }
                }
                if (!isValidPattern)
                    break;
            }
            if (!isValidPattern)
                continue; // try next pattern
            // pattern is valid, push to list
            const dynaDiffCollapse = [];
            for (const diff of this.dynaDiffs[i]) {
                const collapse = diff.p();
                // difference
                if (collapse != tiles.getAt(diff.x, diff.y).getPattern()) {
                    dynaDiffCollapse.push({
                        x: diff.x,
                        y: diff.y,
                        p: collapse
                    });
                }
            }
            allDiffs = allDiffs.concat(this.constDiffs[i], dynaDiffCollapse);
        }
        return allDiffs;
    }
}
export class SurroundingRule extends Rule {
    centralBefore;
    centralAfter;
    surrounding;
    min;
    max;
    sides;
    corners;
    constructor({ centralBefore, centralAfter, surrounding, min = 1, max = 8, includeSides = true, includeCorners = true }) {
        super(3, 3);
        this.centralBefore = centralBefore;
        this.centralAfter = centralAfter;
        this.surrounding = surrounding;
        this.min = min;
        this.max = max;
        this.sides = includeSides;
        this.corners = includeCorners;
        if (centralAfter.possibilities == 0)
            return;
        if (centralAfter.possibilities == 1 && centralBefore.possibilities == 1) {
            if (!centralAfter.getPattern().equals(centralBefore.getPattern())) {
                this.constDiffs.push([{
                        x: 0, y: 0,
                        p: centralAfter.getPattern()
                    }]);
            }
        }
        else {
            this.dynaDiffs.push([{
                    x: 0, y: 0,
                    p: centralAfter.getPattern.bind(centralAfter)
                }]);
        }
    }
    checkAt(x, y, tiles) {
        if (!this.centralBefore.matches(tiles.getAt(x, y, ruleFallback).getPattern()))
            return []; // invalid central element
        let count = 0;
        if (this.corners) {
            count += +this.surrounding.matches(tiles.getAt(x - 1, y - 1, ruleFallback).getPattern());
            count += +this.surrounding.matches(tiles.getAt(x - 1, y + 1, ruleFallback).getPattern());
            count += +this.surrounding.matches(tiles.getAt(x + 1, y - 1, ruleFallback).getPattern());
            count += +this.surrounding.matches(tiles.getAt(x + 1, y + 1, ruleFallback).getPattern());
        }
        if (this.sides) {
            count += +this.surrounding.matches(tiles.getAt(x, y - 1, ruleFallback).getPattern());
            count += +this.surrounding.matches(tiles.getAt(x, y + 1, ruleFallback).getPattern());
            count += +this.surrounding.matches(tiles.getAt(x - 1, y, ruleFallback).getPattern());
            count += +this.surrounding.matches(tiles.getAt(x + 1, y, ruleFallback).getPattern());
        }
        if (count >= this.min && count <= this.max) {
            if (this.dynaDiffs.length > 0) { // length = 1
                const pattern = this.dynaDiffs[0][0].p();
                // no need to push difference if equal
                if (!pattern.equals(this.centralBefore.getPattern())) {
                    return [{
                            x: this.dynaDiffs[0][0].x,
                            y: this.dynaDiffs[0][0].y,
                            p: pattern
                        }];
                }
            }
            else {
                return this.constDiffs[0];
            }
        }
        return [];
    }
}
//# sourceMappingURL=rules.js.map