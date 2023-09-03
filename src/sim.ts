import { Tiles } from "./interface.js";
import { Pattern, PatternBase } from "./patterns.js";
import { Rule } from "./rules.js";
import { AnimData, Matrix, Tile, isMDiff, mDiff } from "./utils.js";

export class Simulation {
  private tiles: Matrix<Tile>;
  private rules: Rule[];
  private differences: Record<number, PatternBase> = {}; 
  private hiddenDifferences: Set<number> = new Set<number>();
  private animations: AnimData[];

  private maxRuleWidth: number = 0;
  private maxRuleHeight: number = 0;
  
  constructor(
    tiles: Matrix<Tile>,
    rules: Rule[]
  ) {
    this.tiles = tiles;
    this.rules = rules;

    this.rules.forEach(rule => {
      this.maxRuleWidth = Math.max(this.maxRuleWidth, rule.width);
      this.maxRuleHeight = Math.max(this.maxRuleHeight, rule.height);
    })
  }

  // at every coordinate, run every rule until one matches or all rules are exhausted, at which point move to the next rule
  tickAll(): {
    "diffs": Array<[x: number, y: number]>,
    "anims": AnimData[]
  } {
    this.hiddenDifferences.clear(); // stores which differences to... hide from the renderer // relies on animation system calling tile to render individually at the end of animation
    this.animations = [];

    for (let x = -this.maxRuleWidth+1; x < this.tiles.width; x++) {
      for (let y = -this.maxRuleHeight+1; y < this.tiles.height; y++) {
        // if (this.toIndex(x,y) in this.differences) continue; // don't bother checking an area that has already been updated
        this.tickAt(x,y);
      }
    }
    
    const diffs = this.resolveDifferences();

    return {
      "diffs": diffs,
      "anims": this.animations
    };
  }

  // helper function, not complete
  tickAt(x: number, y: number) {
    for (const rule of this.rules) {
      const diffs = rule.checkAt(x,y, this.tiles);
      for (const diff of diffs) {
        const index = this.toIndex(x + diff.x, y + diff.y);
        this.differences[index] = diff.p;

        if (isMDiff(diff)) {
          this.animations.push({
            x,y,
            data: diff
          });
          this.hiddenDifferences.add(index);
        }
      }
    }
  }

  // shove all data in differences into main tiles
  resolveDifferences() {
    const diffArray: Array<[x: number, y: number]> = [];
    for (const index in this.differences) {
      const [x,y] = this.toCoord(+index);
      if (!this.hiddenDifferences.has(+index)) diffArray.push([x,y]); // only push difference if not being hidden
      this.tiles.getAt( x,y, null )?.setPattern( this.differences[index].collapse(this.tiles.getAt(x,y).getDisplayPattern()) );
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