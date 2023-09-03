// for checking patterns within rules
export class RulePattern {
    possibilities;
    constructor(possibilities) {
        this.possibilities = possibilities;
    }
}
// this can contain one pattern (match), multiple patterns (match in set), or none (match any)
export class PatternSet extends RulePattern {
    patterns;
    constructor(patterns) {
        super(patterns.length);
        this.patterns = patterns;
        // can only every match/return the same, allow for precomputation
    }
    // patterns of similar shapes will have the same memory address, therefore direct comparisons can be used here
    matches(pattern) {
        if (this.patterns.length == 0)
            return true; // no need to check
        // guilty until proven innocent method
        for (const testPattern of this.patterns) {
            if (testPattern.equals(pattern))
                return true;
        }
        return false;
    }
    getPattern() {
        if (this.patterns.length == 0)
            return null;
        if (this.patterns.length == 1)
            return this.patterns[0];
        return this.patterns[Math.floor(Math.random() * this.patterns.length)]; // choose random pattern
    }
    getXInverted() {
        const patterns = [];
        for (const pattern of this.patterns) {
            patterns.push(pattern.getXInverted());
        }
        return new PatternSet(patterns);
    }
    getYInverted() {
        const patterns = [];
        for (const pattern of patterns) {
            patterns.push(pattern.getYInverted());
        }
        return new PatternSet(patterns);
    }
}
// matches anything OUTSIDE the set
export class NegatedPatternSet extends PatternSet {
    matches(pattern) {
        if (this.patterns.length == 0)
            return true; // no need to check
        // innocent until proven guilty method
        for (const testPattern of this.patterns) {
            if (testPattern.equals(pattern))
                return false;
        }
        return true;
    }
}
//# sourceMappingURL=rule-patterns.js.map