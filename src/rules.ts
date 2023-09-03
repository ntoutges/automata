import { Pattern } from "./patterns.js";
import { RulePattern } from "./rule-patterns.js";
import { Matrix, Tile, UnclampedRGB, cDiff, dDiff, ddDiff, dmDiff, isCDiff, mDiff, rDiff } from "./utils.js";

const ruleFallback = new Tile();
ruleFallback.setPattern( new Pattern(new UnclampedRGB(0,0,1000)) );
export abstract class Rule {
  readonly width: number;
  readonly height: number;
  constDiffs: rDiff[][] = []; // list of all rule possibilities -> list of precomputed constant differences
  dynaDiffs: ddDiff[][] = []; // list of all rule possibilities -> list of callbacks to differences that need to be computed at runtime
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  abstract checkAt(x: number, y: number, tiles: Matrix<Tile>): rDiff[];
}

export class SpatialRule extends Rule {
  tilesPatternBefore: Matrix<RulePattern>[] = [];
  constructor( // these don't actually need to be the same size
    tilesPatternBefore: Matrix<RulePattern>,
    tilesPatternAfter: Matrix<RulePattern>,
    symX: boolean = false, // symmetry over x axis
    symY: boolean = false // symmetry over y axis
  ) {
    super(
      tilesPatternBefore.width,
      tilesPatternBefore.height
    );
    this.constructRule(tilesPatternBefore, tilesPatternAfter);
    
    if (symX) {
      // tilesPatternBefore.getXInverted().getTransformed((entry: RulePattern) => { return entry; console.log(entry.getXInverted()) })

      this.constructRule(
        tilesPatternBefore.getXInverted().getTransformed((entry: RulePattern) => { return entry.getXInverted(); }),
        tilesPatternAfter.getXInverted().getTransformed((entry: RulePattern) => { return entry.getXInverted(); })
      );
    }
    if (symY) {
      this.constructRule(
        tilesPatternBefore.getYInverted().getTransformed((entry: RulePattern) => { return entry.getYInverted(); }),
        tilesPatternAfter.getYInverted().getTransformed((entry: RulePattern) => { return entry.getYInverted(); })
      );
    }

    if (symX && symY) {
      this.constructRule(
        tilesPatternBefore.getXInverted().getYInverted().getTransformed((entry: RulePattern) => { return entry.getXInverted().getYInverted(); }),
        tilesPatternAfter.getXInverted().getYInverted().getTransformed((entry: RulePattern) => { return entry.getXInverted().getYInverted(); })
      );
    }
  }

  private constructRule(
    tilesPatternBefore: Matrix<RulePattern>,
    tilesPatternAfter: Matrix<RulePattern>
  ) {
    this.tilesPatternBefore.push(tilesPatternBefore);

    const ruleCDiffs: cDiff[] = [];
    const ruleDDiffs: dDiff[] = [];
    for (let x = 0; x < tilesPatternAfter.width; x++) {
      for (let y = 0; y < tilesPatternAfter.height; y++) {
        const afterPattern = tilesPatternAfter.getAt(x,y);
        if (afterPattern.possibilities == 0) continue; // no need
        if (afterPattern.possibilities == 1) { // constant
          if ((x >= tilesPatternBefore.width || y >= tilesPatternBefore.height)) { // outside before, always (consided) different
            ruleCDiffs.push({
              x,y, p: afterPattern.getPattern()
            });
            continue; 
          }
          
          const beforePattern = tilesPatternBefore.getAt(x,y);
          if (beforePattern.possibilities == 1 && beforePattern.getPattern() != afterPattern.getPattern()) { // before and after are constant, and not similar
            ruleCDiffs.push({
              x,y, p: afterPattern.getPattern()
            });
            continue;
          }
        }
        
        // dynamic
        ruleDDiffs.push({
          x,y, p: afterPattern.getPattern.bind(afterPattern)
        });
      }
    }

    this.constDiffs.push(ruleCDiffs);
    this.dynaDiffs.push(ruleDDiffs);
  }

  checkAt(
    x: number,
    y: number,
    tiles: Matrix<Tile>
  ) {
    let allDiffs: cDiff[] = [];
    for (let i in this.tilesPatternBefore) {
      let isValidPattern = true; // innocent until proven guilty method
      for (let x2 = 0; x2 < this.width; x2++) {
        for (let y2 = 0; y2 < this.height; y2++) {
          if ( // if it doesn't match, it cannot be true
            !this.tilesPatternBefore[i].getAt(x2,y2).matches(
              tiles.getAt(x+x2, y+y2, ruleFallback).getPattern()
            )
          ) {
            isValidPattern = false;
            break;
          }
        }
        if (!isValidPattern) break;
      }
      if (!isValidPattern) continue; // try next pattern
      // pattern is valid, push to list
      
      const dynaDiffCollapse: cDiff[] = [];
      for (const diff of this.dynaDiffs[i] as dDiff[]) {
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

      allDiffs = allDiffs.concat( this.constDiffs[i], dynaDiffCollapse );
    }
    return allDiffs;
  }
}

interface SurroundingRuleInterface {
  centralBefore: RulePattern
  centralAfter: RulePattern
  surrounding: RulePattern
  validCounts: number[]
  includeSides?: boolean
  includeCorners?: boolean
};

export class SurroundingRule extends Rule {
  centralBefore: RulePattern;
  centralAfter: RulePattern;
  surrounding: RulePattern;
  validCounts: Set<number>;
  sides: boolean;
  corners: boolean;
  constructor({
    centralBefore,
    centralAfter,
    surrounding,
    validCounts,
    includeSides = true,
    includeCorners = true
  }: SurroundingRuleInterface) {
    super(3,3);
    this.centralBefore = centralBefore;
    this.centralAfter = centralAfter;
    this.surrounding = surrounding;
    this.sides = includeSides;
    this.corners = includeCorners;

    this.validCounts = new Set<number>(validCounts);

    if (centralAfter.possibilities == 0) return;
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

  checkAt(x: number, y: number, tiles: Matrix<Tile>) {
    if (!this.centralBefore.matches(tiles.getAt(x,y,ruleFallback).getPattern())) return []; // invalid central element

    let count = 0;
    if (this.corners) {
      count += +this.surrounding.matches(tiles.getAt(x-1,y-1,ruleFallback).getPattern());
      count += +this.surrounding.matches(tiles.getAt(x-1,y+1,ruleFallback).getPattern());
      count += +this.surrounding.matches(tiles.getAt(x+1,y-1,ruleFallback).getPattern());
      count += +this.surrounding.matches(tiles.getAt(x+1,y+1,ruleFallback).getPattern());
    }
    if (this.sides) {
      count += +this.surrounding.matches(tiles.getAt(x,y-1,ruleFallback).getPattern());
      count += +this.surrounding.matches(tiles.getAt(x,y+1,ruleFallback).getPattern());
      count += +this.surrounding.matches(tiles.getAt(x-1,y,ruleFallback).getPattern());
      count += +this.surrounding.matches(tiles.getAt(x+1,y,ruleFallback).getPattern());
    }
    
    if (this.validCounts.has(count)) {
      if (this.dynaDiffs.length > 0) { // length = 1
        const pattern = (this.dynaDiffs[0][0] as dDiff).p();
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

export class MovementRule extends Rule {
  private condition: Rule;

  constructor(
    condition: Rule,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) {
    super(condition.width, condition.height);

    // for (const dynaDiff of condition.dynaDiffs) { this.dynaDiffs.push(dynaDiff); }
    // for (const constDiff of condition.constDiffs) { this.constDiffs.push(constDiff); }
    this.condition = condition;

    const diff: dmDiff = {
      xi: fromX,
      yi: fromY,
      x: toX,
      y: toY 
    };
    this.dynaDiffs.push([diff]);
  }

  checkAt(
    x: number,
    y: number,
    tiles: Matrix<Tile>
  ) {
    const rDiffs = this.condition.checkAt(x,y,tiles);
    if (rDiffs.length == 0) return []; // no differences means rule true, ignore
    
    const move = this.dynaDiffs[0][0] as dmDiff;
    for (const i in rDiffs) { // remove rDiff that replaces tile where the moved tile will end at
      if (rDiffs[i].x == move.x && rDiffs[i].y == move.y) {
        rDiffs.splice(+i,1);
        break;
      }
    }

    const cDiff: mDiff = {
      xi: move.xi,
      yi: move.yi,
      x: move.x,
      y: move.y,
      p: tiles.getAt(x+move.xi, y+move.yi).getDisplayPattern()
    };
    rDiffs.push(cDiff);
    
    return rDiffs;
  }
}

// go through rules sequentially, and perform only the first one that matches
export class SequenceRule extends Rule {
  private rules: Rule[];
  constructor(
    rules: Rule[]
  ) {
    let maxWidth = 0;
    let maxHeight = 0;

    rules.forEach((rule) => {
      maxWidth = Math.max(maxWidth, rule.width);
      maxHeight = Math.max(maxHeight, rule.height);
    });

    super(maxWidth, maxHeight);
    this.rules = rules;
  }

  checkAt(
    x: number,
    y: number,
    tiles: Matrix<Tile>
  ): rDiff[] {
    for (const rule of this.rules) {
      const diffs = rule.checkAt(x,y, tiles);
      if (diffs.length > 0) { // first rule that matches returns its differences, the rest don't matter in that step
        console.log(this.rules.indexOf(rule),  x,y)
        return diffs;
      }
    }
    return []; // by default, nothing happened
  }
}

// chooses a random rule until it works (or all fail), then performs that one
export class QuantumRule extends Rule {
  private rules: Rule[];
  constructor(
    rules: Rule[]
  ) {
    let maxWidth = 0;
    let maxHeight = 0;

    rules.forEach((rule) => {
      maxWidth = Math.max(maxWidth, rule.width);
      maxHeight = Math.max(maxHeight, rule.height);
    });

    super(maxWidth, maxHeight);
    this.rules = rules;
  }

  checkAt(
    x: number,
    y: number,
    tiles: Matrix<Tile>
  ): rDiff[] {
    let allDiffs: rDiff[][] = [];
    for (const rule of this.rules) {
      const diffs = rule.checkAt(x,y, tiles);
      if (diffs.length > 0) allDiffs.push(diffs);
    }
    
    if (allDiffs.length > 0) return allDiffs[Math.floor(Math.random() * allDiffs.length)];

    return []; // by default, nothing happened
  }
}