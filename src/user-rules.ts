import { Materials } from "./interface.js";
import { Pattern, PatternAddative, PatternKeyed, PatternRange, PatternRangeMonochrome, PatternSubtractive } from "./patterns.js";
import { NegatedPatternSet, PatternSet } from "./rule-patterns.js";
import { MovementRule, QuantumRule, Rule, SequenceRule, SpatialRule, SurroundingRule } from "./rules.js";
import { Matrix, RGB } from "./utils.js";

export var rules: Rule[] = [];
export var materials: Materials;

// sand
// {
//   const sand = new PatternRangeMonochrome(
//     new Pattern(
//       new RGB(255,237,167)
//     ),
//     new Pattern(
//       new RGB(203,195,162)
//     )
//   )
//   const deleter = new Pattern(
//     new RGB(230, 20,40)
//   );
//   const allDeleters = new PatternRange(
//     deleter,
//     new Pattern(
//       new RGB(230,255,40)
//     )
//   )

//   const delAdd = new Pattern(
//     new RGB(0,1,0)
//   );

//   const air = new Pattern( new RGB(0,0,0) );
//   const stone = new Pattern( new RGB(150,150,150) );
//   const sandStone = new PatternKeyed({
//     "": sand,
//     "s": stone
//   }, "");

//   rules.push(
//     new MovementRule(
//       new SpatialRule(
//         new Matrix(
//           1,2,
//           new PatternSet([ sand ]),
//           new PatternSet([ air ])
//         ),
//         new Matrix(
//           1,2,
//           new PatternSet([ air ]),
//           new PatternSet([ sandStone ])
//         )
//       ),
//       0,0,
//       0,1
//     )
//   );

//   rules.push(
//     new SequenceRule([
//       new QuantumRule([
//         new MovementRule(
//           new SpatialRule(
//             new Matrix(
//               4,2,
//               new PatternSet([ ]),
//               new PatternSet([ sand ]),
//               new PatternSet([ air ]),
//               new NegatedPatternSet([ sand ]),
  
//               new PatternSet([ ]),
//               new NegatedPatternSet([ air ]),
//               new PatternSet([ air ]),
//               new PatternSet([ ]),
//             ),
//             new Matrix(
//               4,2,
//               new PatternSet([ ]),
//               new PatternSet([ air ]),
//               new PatternSet([ ]),
//               new PatternSet([ ]),
  
//               new PatternSet([ ]),
//               new PatternSet([ ]),
//               new PatternSet([ sand ]),
//               new PatternSet([ ]),
//             )
//           ),
//           1,0,
//           2,1
//         ),
//         new MovementRule(
//           new SpatialRule(
//             new Matrix(
//               3,2,
//               new PatternSet([ air ]),
//               new PatternSet([ sand ]),
//               new PatternSet([ ]),
  
//               new PatternSet([ air ]),
//               new NegatedPatternSet([ air ]),
//               new PatternSet([ ])
//             ),
//             new Matrix(
//               3,2,
//               new PatternSet([ ]),
//               new PatternSet([ air ]),
//               new PatternSet([ ]),
  
//               new PatternSet([ sand ]),
//               new PatternSet([ ]),
//               new PatternSet([ ])
//             )
//           ),
//           1,0,
//           0,1
//         )
//       ])
//     ])
//   );

//   rules.push(
//     new SpatialRule(
//       new Matrix(
//         2,2,
//         new PatternSet([ ]),
//         new PatternSet([ ]),
        
//         new PatternSet([ ]),
//         new PatternSet([ allDeleters ])
//       ),
//       new Matrix(
//         3,3,
//         new PatternSet([ air ]),
//         new PatternSet([ air ]),
//         new PatternSet([ air ]),

//         new PatternSet([ air ]),
//         new PatternSet([ ]),
//         new PatternSet([ air ]),

//         new PatternSet([ air ]),
//         new PatternSet([ air ]),
//         new PatternSet([ air ])
//       )
//     )
//   )

//   rules.push(
//     new SurroundingRule({
//       centralBefore: new PatternSet([ allDeleters ]),
//       centralAfter: new PatternSet([ new PatternAddative(delAdd) ]),
//       surrounding: new PatternSet([ sand ]),
//       validCounts: [1,2,3,4,5,6,7,8],
//       includeCorners: true,
//       includeSides: true
//     })
//   )

//   rules.push(
//     new SpatialRule(
//       new Matrix(
//         1,1, new PatternSet([ new Pattern( new RGB(230,255,40) ) ])
//       ),
//       new Matrix(
//         1,1, new PatternSet([ stone ])
//       )
//     )
//   )


//   materials = new Materials(
//     [
//       sand,
//       air,
//       stone,
//       deleter
//     ],
//     2
//   )
// }

// snake
{
  const bodyStart = new Pattern(
    new RGB(100,200,100)
  )
  const bodyEnd = new Pattern(
    new RGB(100,150,100)
  );
  const bodySubtract = new Pattern( new RGB(0,1,0) );
  const bodyRange = new PatternRange(
    bodyStart,
    bodyEnd
  );
  const notBodyRange = new PatternRange(
    bodyEnd,
    new Pattern(
      new RGB(100,0,100)
    )
  )

  const headL = new Pattern(
    new Matrix(
      2,2,

      new RGB(200,0,0),
      new RGB(100,200,100),
      new RGB(200,0,0),
      new RGB(100,200,100),
    )
  )

  const headR = new Pattern(
    new Matrix(
      2,2,

      new RGB(100,200,100),
      new RGB(200,0,0),
      new RGB(100,200,100),
      new RGB(200,0,0),
    )
  )

  const headU = new Pattern(
    new Matrix(
      2,2,

      new RGB(200,0,0),
      new RGB(200,0,0),
      new RGB(100,200,100),
      new RGB(100,200,100),
    )
  )

  const headD = new Pattern(
    new Matrix(
      2,2,

      new RGB(100,200,100),
      new RGB(100,200,100),
      new RGB(200,0,0),
      new RGB(200,0,0),
    )
  )

  const air = new Pattern( new RGB(0,0,0) );

  const heads = new PatternKeyed({
    "w": headU,
    "a": headL,
    "s": headD,
    "d": headR
  });

  rules.push(
    new MovementRule(
      new SpatialRule(
        new Matrix(
          1,2,

          new PatternSet([ air ]),
          new PatternSet([ headU ])
        ),
        new Matrix(
          1,2,

          new PatternSet([ heads ]),
          new PatternSet([ bodyStart ])
        )
      ),
      0,1,
      0,0
    )
  )

  rules.push(
    new MovementRule(
      new SpatialRule(
        new Matrix(
          1,2,
          new PatternSet([ headD ]),
          new PatternSet([ air ])
        ),
        new Matrix(
          1,2,
          new PatternSet([ bodyStart ]),
          new PatternSet([ heads ])
        )
      ),
      0,0,
      0,1
    )
  )

  rules.push(
    new MovementRule(
      new SpatialRule(
        new Matrix(
          2,1,

          new PatternSet([ headR ]),
          new PatternSet([ air ])
        ),
        new Matrix(
          2,1,

          new PatternSet([ bodyStart ]),
          new PatternSet([ heads ])
        )
      ),
      0,0,
      1,0
    )
  )

  rules.push(
    new MovementRule(
      new SpatialRule(
        new Matrix(
          2,1,

          new PatternSet([ air ]),
          new PatternSet([ headL ])
        ),
        new Matrix(
          2,1,

          new PatternSet([ heads ]),
          new PatternSet([ bodyStart ])
        )
      ),
      1,0,
      0,0
    )
  )

  rules.push(
    new SpatialRule(
      new Matrix(
        1,1,
        new PatternSet([ bodyRange ])
      ),
      new Matrix(
        1,1,
        new PatternSet([ new PatternSubtractive(bodySubtract) ])
      )
    )
  )

  rules.push(
    new SpatialRule(
      new Matrix(
        1,1,
        new PatternSet([ notBodyRange ])
      ),
      new Matrix(
        1,1,
        new PatternSet([ air ])
      )
    )
  )

  materials = new Materials(
    [
      headU,
      bodyStart
    ],
    2
  )
}
