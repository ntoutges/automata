import { Materials } from "./interface.js";
import { Rule, SpatialRule, SurroundingRule } from "./rules.js";
import { Matrix, Pattern, PatternSet, RGB, RulePattern } from "./utils.js";

export var rules: Rule[] = [];
export var materials: Materials;

// conway's game of life and death
const death = new Pattern( new RGB(0,0,0) );
const life = new Pattern( new RGB(0,200,0) );

// sand
// const sand = new Pattern( new RGB(234, 234, 133) );
// const sand = new Pattern( new RGB(255, 192, 203) ); // pink sand!
// const sandL = new Pattern( new Matrix( 2,1, new RGB(0,0,0), new RGB(234, 234, 133) ) );
// const sandR = new Pattern( new Matrix( 2,1, new RGB(234, 234, 133), new RGB(0,0,0) ) );
// const air = new Pattern( new RGB(0,0,0) );new RGB
// const sandEater = new Pattern( new RGB(30,200,20) )

materials = new Materials(
  [
    life,
    death
    
    // sand,
    // air,
    // sandL,
    // sandR,
    // sandEater
  ],
  2
)

// game of life
{
  rules.push(
    new SurroundingRule({
      centralBefore: new PatternSet([ life ]),
      centralAfter: new PatternSet([ death ]),
      min: 0,
      max: 1,
      surrounding: new PatternSet([ life ])
    })
  )

  rules.push(
    new SurroundingRule({
      centralBefore: new PatternSet([ life ]),
      centralAfter: new PatternSet([ death ]),
      min: 4,
      max: 8,
      surrounding: new PatternSet([ life ])
    })
  )

  rules.push(
    new SurroundingRule({
      centralBefore: new PatternSet([ death ]),
      centralAfter: new PatternSet([ life ]),
      min: 3,
      max: 3,
      surrounding: new PatternSet([ life ])
    })
  )
}

// sand
// {
//   rules.push(
//     new SpatialRule(
//       new Matrix(
//         1,2,
//         new PatternSet([ sand, sandL, sandR ]),
//         new PatternSet([ air ])
//       ),
//       new Matrix(
//         1,2,
//         new PatternSet([ air ]),
//         new PatternSet([ sand ])
//       )
//     )
//   )

//   rules.push(
//     new SpatialRule(
//       new Matrix(
//         1,2,
//         new PatternSet([ sandEater ]),
//         new PatternSet([ air ])
//       ),
//       new Matrix(
//         1,2,
//         new PatternSet([ air ]),
//         new PatternSet([ sandEater ])
//       )
//     )
//   )

//   rules.push(
//     new SpatialRule(
//       new Matrix(
//         1,2,
//         new PatternSet([ sandEater ]),
//         new PatternSet([ sand ])
//       ),
//       new Matrix(
//         1,2,
//         new PatternSet([ air ]),
//         new PatternSet([ sandEater ])
//       ),
//       false,
//       true
//     )
//   )

//   rules.push(
//     new SpatialRule(
//       new Matrix(
//         2,1,
//         new PatternSet([ sandEater ]),
//         new PatternSet([ sand ])
//       ),
//       new Matrix(
//         2,1,
//         new PatternSet([ air ]),
//         new PatternSet([ sandEater ])
//       ),
//       true
//     )
//   )

//   rules.push(
//     new SpatialRule(
//       new Matrix(
//         1,1,
//         new PatternSet([ sandEater ])
//       ),
//       new Matrix(
//         1,1,
//         new PatternSet([ air ])
//       )
//     )
//   )

//   rules.push(
//     new SpatialRule(
//       new Matrix(
//         2,2,
//         new PatternSet([ sand ]),
//         new PatternSet([ air ]),
//         new PatternSet([ sand ]),
//         new PatternSet([ air ])
//       ),
//       new Matrix(
//         2,2,
//         new PatternSet([ sandR ]),
//         new PatternSet([ air ]),
//         new PatternSet([  ]),
//         new PatternSet([ air ])
//       ),
//       true,
//       false
//     )
//   )

//   rules.push(
//     new SpatialRule(
//       new Matrix(
//         2,2,
//         new PatternSet([ sandR ]),
//         new PatternSet([ air ]),
//         new PatternSet([ sand ]),
//         new PatternSet([ air ])
//       ),
//       new Matrix(
//         2,2,
//         new PatternSet([ air ]),
//         new PatternSet([ air ]),
//         new PatternSet([  ]),
//         new PatternSet([ sand ])
//       ),
//       true,
//       false
//     )
//   )

//   rules.push(
//     new SpatialRule(
//       new Matrix(
//         1,3,
//         new PatternSet([ sand, sandL, sandR ]),
//         new PatternSet([ sandL, sandR ]),
//         new PatternSet([ sand, sandL, sandR ])
//       ),
//       new Matrix(
//         1,3,
//         new PatternSet([ ]),
//         new PatternSet([ sand ]),
//         new PatternSet([ ])
//       )
//     )
//   )
// }
