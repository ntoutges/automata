import { Materials } from "./interface.js";
import { Pattern, PatternRange } from "./patterns.js";
import { PatternSet } from "./rule-patterns.js";
import { MovementRule, SequenceRule, SpatialRule } from "./rules.js";
import { Matrix, RGB } from "./utils.js";
export var rules = [];
export var materials;
// conway's game of life and death
// const death = new Pattern( new RGB(0,0,0) );
// const life = new Pattern( new RGB(0,200,0) );
// sand
// const sand = new Pattern( new RGB(234, 234, 133) );
// const sand = new Pattern( new RGB(255, 192, 203) ); // pink sand!
const sand = new PatternRange(new Pattern(new RGB(100, 100, 100)), new Pattern(new RGB(255, 255, 255)));
const sandL = new Pattern(new Matrix(2, 1, new RGB(0, 0, 0), new RGB(234, 234, 133)));
const sandR = new Pattern(new Matrix(2, 1, new RGB(234, 234, 133), new RGB(0, 0, 0)));
const air = new Pattern(new RGB(0, 0, 0));
new RGB;
// const sandEater = new Pattern( new RGB(30,200,20) )
materials = new Materials([
    // life,
    // death
    sand,
    air,
    sandL,
    sandR,
    // sandEater
], 2);
// game of life
// {
//   rules.push(
//     new SurroundingRule({
//       centralBefore: new PatternSet([ life ]),
//       centralAfter: new PatternSet([ death ]),
//       validCounts: [3],
//       surrounding: new PatternSet([ life ])
//     })
//   )
//   rules.push(
//     new SurroundingRule({
//       centralBefore: new PatternSet([ life ]),
//       centralAfter: new PatternSet([ death ]),
//       validCounts: [0,1,4,5,6,7,8],
//       surrounding: new PatternSet([ life ])
//     })
//   )
// }
// sand
{
    rules.push(new MovementRule(new SpatialRule(new Matrix(1, 2, new PatternSet([sand, sandL, sandR]), new PatternSet([air])), new Matrix(1, 2, new PatternSet([air]), new PatternSet([sand]))), 0, 0, 0, 1));
    rules.push(new SequenceRule([
        new MovementRule(new SpatialRule(new Matrix(3, 2, new PatternSet([]), new PatternSet([sand]), new PatternSet([air]), new PatternSet([]), new PatternSet([sand]), new PatternSet([air])), new Matrix(3, 2, new PatternSet([]), new PatternSet([air]), new PatternSet([air]), new PatternSet([]), new PatternSet([]), new PatternSet([sand]))), 1, 0, 2, 1),
        new MovementRule(new SpatialRule(new Matrix(3, 2, new PatternSet([air]), new PatternSet([sand]), new PatternSet([]), new PatternSet([air]), new PatternSet([sand]), new PatternSet([])), new Matrix(3, 2, new PatternSet([air]), new PatternSet([air]), new PatternSet([]), new PatternSet([sand]), new PatternSet([]), new PatternSet([]))), 1, 0, 0, 1)
    ]));
}
//# sourceMappingURL=user-rules.js.map