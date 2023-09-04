import { Tiles } from "./interface.js";
import { Pattern, PatternBase } from "./patterns.js";
import { Rule } from "./rules.js";
import { AnimData, Matrix, Tile, isMDiff, mDiff } from "./utils.js";

export interface KeyDataInterface {
  key: string
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
};

export class Simulation {
  private tiles: Matrix<Tile>;
  private rules: Rule[];
  private differences: Record<number, PatternBase> = {}; 
  private animations: AnimData[];
  private animationQueue: Map<number,mDiff> = new Map<number,mDiff>();
  
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
  tickAll(keyData: KeyDataInterface): {
    "diffs": Array<[x: number, y: number]>,
    "anims": AnimData[]
  } {
    this.animationQueue.clear(); // stores which differences to... hide from the renderer // relies on animation system calling tile to render individually at the end of animation
    this.animations = [];

    for (let x = -this.maxRuleWidth+1; x < this.tiles.width; x++) {
      for (let y = -this.maxRuleHeight+1; y < this.tiles.height; y++) {
        // if (this.toIndex(x,y) in this.differences) continue; // don't bother checking an area that has already been updated
        this.tickAt(x,y);
      }
    }
    
    const diffs = this.resolveDifferences(keyData);

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
        
        if (isMDiff(diff)) this.animationQueue.set(index, diff);
      }
    }
  }

  // shove all data in differences into main tiles
  resolveDifferences(keyData: KeyDataInterface) {
    const diffArray: Array<[x: number, y: number]> = [];
    for (const index in this.differences) {
      
      const [x,y] = this.toCoord(+index);
      const newPattern = this.differences[index].collapse({
        oldPattern: this.tiles.getAt(x,y).getDisplayPattern(),
        key: keyData
      });
      if (this.tiles.getAt( x,y, null )?.getPattern().equals(newPattern)) { continue; } // no actual difference, this cycle can be ignored
      
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
      else diffArray.push([x,y]); // only push difference if not being hidden
      this.tiles.getAt( x,y, null )?.setPattern( newPattern );
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