import { isMDiff } from "./utils.js";
export class Simulation {
    tiles;
    rules;
    differences = {};
    hiddenDifferences = new Set();
    animations;
    constructor(tiles, rules) {
        this.tiles = tiles;
        this.rules = rules;
    }
    // at every coordinate, run every rule until one matches or all rules are exhausted, at which point move to the next rule
    tickAll() {
        this.hiddenDifferences.clear(); // stores which differences to... hide from the renderer // relies on animation system calling tile to render individually at the end of animation
        this.animations = [];
        for (let x = 0; x < this.tiles.width; x++) {
            for (let y = 0; y < this.tiles.height; y++) {
                // if (this.toIndex(x,y) in this.differences) continue; // don't bother checking an area that has already been updated
                this.tickAt(x, y);
            }
        }
        const diffs = this.resolveDifferences();
        return {
            "diffs": diffs,
            "anims": this.animations
        };
    }
    // helper function, not complete
    tickAt(x, y) {
        for (const rule of this.rules) {
            const diffs = rule.checkAt(x, y, this.tiles);
            for (const diff of diffs) {
                const index = this.toIndex(x + diff.x, y + diff.y);
                this.differences[index] = diff.p;
                if (isMDiff(diff)) {
                    this.animations.push({
                        x, y,
                        data: diff
                    });
                    this.hiddenDifferences.add(index);
                }
            }
        }
    }
    // shove all data in differences into main tiles
    resolveDifferences() {
        const diffArray = [];
        for (const index in this.differences) {
            const [x, y] = this.toCoord(+index);
            if (!this.hiddenDifferences.has(+index))
                diffArray.push([x, y]); // only push difference if not being hidden
            this.tiles.getAt(x, y, null)?.setPattern(this.differences[index].collapse());
        }
        this.differences = {};
        return diffArray;
    }
    toIndex(x, y) { return x + y * this.tiles.width; }
    toCoord(index) {
        return [
            index % this.tiles.width,
            Math.floor(index / this.tiles.width)
        ];
    }
}
//# sourceMappingURL=sim.js.map