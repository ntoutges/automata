import { isMDiff } from "./utils.js";
;
export class Simulation {
    tiles;
    rules;
    differences = {};
    animations;
    animationQueue = new Map();
    maxRuleWidth = 0;
    maxRuleHeight = 0;
    constructor(tiles, rules) {
        this.tiles = tiles;
        this.rules = rules;
        this.rules.forEach(rule => {
            this.maxRuleWidth = Math.max(this.maxRuleWidth, rule.width);
            this.maxRuleHeight = Math.max(this.maxRuleHeight, rule.height);
        });
    }
    // at every coordinate, run every rule until one matches or all rules are exhausted, at which point move to the next rule
    tickAll(keyData) {
        this.animationQueue.clear(); // stores which differences to... hide from the renderer // relies on animation system calling tile to render individually at the end of animation
        this.animations = [];
        for (let x = -this.maxRuleWidth + 1; x < this.tiles.width; x++) {
            for (let y = -this.maxRuleHeight + 1; y < this.tiles.height; y++) {
                // if (this.toIndex(x,y) in this.differences) continue; // don't bother checking an area that has already been updated
                this.tickAt(x, y);
            }
        }
        const diffs = this.resolveDifferences(keyData);
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
                if (isMDiff(diff))
                    this.animationQueue.set(index, diff);
            }
        }
    }
    // shove all data in differences into main tiles
    resolveDifferences(keyData) {
        const diffArray = [];
        for (const index in this.differences) {
            const [x, y] = this.toCoord(+index);
            const newPattern = this.differences[index].collapse({
                oldPattern: this.tiles.getAt(x, y).getDisplayPattern(),
                key: keyData
            });
            if (this.tiles.getAt(x, y, null)?.getPattern().equals(newPattern)) {
                continue;
            } // no actual difference, this cycle can be ignored
            if (this.animationQueue.has(+index)) { // hidden/used in animation
                const oldData = this.animationQueue.get(+index);
                this.animations.push({
                    x: x - oldData.x,
                    y: y - oldData.y,
                    data: {
                        xi: oldData.xi,
                        yi: oldData.yi,
                        x: oldData.x,
                        y: oldData.y,
                        p: newPattern
                    }
                });
            }
            else
                diffArray.push([x, y]); // only push difference if not being hidden
            this.tiles.getAt(x, y, null)?.setPattern(newPattern);
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