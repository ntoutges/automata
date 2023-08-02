import { Tiles } from "./interface.js";
import { Rule } from "./rules.js";
import { Matrix, Pattern, Tile } from "./utils";

export class Simulation {
  private tiles: Matrix<Tile>;
  private rules: Rule[];
  private differences: Record<number, Pattern> = {};
  constructor(
    tiles: Matrix<Tile>,
    rules: Rule[]
  ) {
    this.tiles = tiles;
    this.rules = rules;
  }

  // at every coordinate, run every rule until one matches or all rules are exhausted, at which point move to the next rule
  tickAll(): Array<[x: number, y: number]> {
    for (let x = 0; x < this.tiles.width; x++) {
      for (let y = 0; y < this.tiles.height; y++) {
        // if (this.toIndex(x,y) in this.differences) continue; // don't bother checking an area that has already been updated
        this.tickAt(x,y);
      }
    }
    return this.resolveDifferences();
  }

  // helper function, not complete
  tickAt(x: number, y: number) {
    // console.log(x,y)
    for (const rule of this.rules) {
      const diffs = rule.checkAt(x,y, this.tiles);
      for (const diff of diffs) {
        this.differences[this.toIndex(x + diff.x, y + diff.y)] = diff.p;
      }
    }
  }

  // shove all data in differences into main tiles
  resolveDifferences() {
    const diffArray: Array<[x: number, y: number]> = [];
    for (const index in this.differences) {
      const [x,y] = this.toCoord(+index);
      diffArray.push([x,y]);
      this.tiles.getAt( x,y, null )?.setPattern( this.differences[index] );
    }
    this.differences = {};
    return diffArray;
  }

  toIndex(x: number, y: number) { return x + y*this.tiles.width; }
  toCoord(index: number): [x:number, y:number] {
    return [
      index % this.tiles.width,
      Math.floor(index / this.tiles.width)
    ];
  }
}