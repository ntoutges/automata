export class Simulation {
    tiles;
    rules;
    differences = {};
    constructor(tiles, rules) {
        this.tiles = tiles;
        this.rules = rules;
    }
    // at every coordinate, run every rule until one matches or all rules are exhausted, at which point move to the next rule
    tickAll() {
        for (let x = 0; x < this.tiles.width; x++) {
            for (let y = 0; y < this.tiles.height; y++) {
                // if (this.toIndex(x,y) in this.differences) continue; // don't bother checking an area that has already been updated
                this.tickAt(x, y);
            }
        }
        return this.resolveDifferences();
    }
    // helper function, not complete
    tickAt(x, y) {
        // console.log(x,y)
        for (const rule of this.rules) {
            const diffs = rule.checkAt(x, y, this.tiles);
            for (const diff of diffs) {
                this.differences[this.toIndex(x + diff.x, y + diff.y)] = diff.p;
            }
        }
    }
    // shove all data in differences into main tiles
    resolveDifferences() {
        const diffArray = [];
        for (const index in this.differences) {
            const [x, y] = this.toCoord(+index);
            diffArray.push([x, y]);
            this.tiles.getAt(x, y, null)?.setPattern(this.differences[index]);
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