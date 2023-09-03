import { Pattern, PatternBase } from "./patterns.js";

// for checking patterns within rules
export abstract class RulePattern {
  readonly possibilities: number;
  constructor(possibilities: number) {
    this.possibilities = possibilities;
  }
  abstract matches(pattern: PatternBase): boolean;
  abstract getPattern(): PatternBase; // for after-patterns, this acts to choose one of the patterns
  abstract getXInverted(): RulePattern;
  abstract getYInverted(): RulePattern;
}

// this can contain one pattern (match), multiple patterns (match in set), or none (match any)
export class PatternSet extends RulePattern {
  readonly patterns: PatternBase[];
  constructor(patterns: PatternBase[]) {
    super(patterns.length);
    this.patterns = patterns;

    // can only every match/return the same, allow for precomputation
  }

  // patterns of similar shapes will have the same memory address, therefore direct comparisons can be used here
  matches(pattern: PatternBase) {
    if (this.patterns.length == 0) return true; // no need to check

    // guilty until proven innocent method
    for (const testPattern of this.patterns) {
    if (testPattern.equals(pattern)) return true;
    }
    return false;
  }

  getPattern() {
    if (this.patterns.length == 0) return null;
    if (this.patterns.length == 1) return this.patterns[0];
    return this.patterns[Math.floor(Math.random() * this.patterns.length)]; // choose random pattern
  }

  getXInverted() {
    const patterns: PatternBase[] = [];
    for (const pattern of this.patterns) {
    patterns.push(pattern.getXInverted());
    }
    return new PatternSet(patterns);
  }
  getYInverted() {
    const patterns: PatternBase[] = [];
    for (const pattern of patterns) {
    patterns.push(pattern.getYInverted());
    }
    return new PatternSet(patterns);
  }
}

// matches anything OUTSIDE the set
export class NegatedPatternSet extends PatternSet {
  matches(pattern: PatternBase) {
    if (this.patterns.length == 0) return true; // no need to check

    // innocent until proven guilty method
    for (const testPattern of this.patterns) {
    if (testPattern.equals(pattern)) return false;
    }
    return true;
  }
}