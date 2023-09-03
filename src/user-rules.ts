import { Materials } from "./interface.js";
import { Pattern, PatternAddative, PatternRange, PatternRangeMonochrome } from "./patterns.js";
import { NegatedPatternSet, PatternSet } from "./rule-patterns.js";
import { MovementRule, QuantumRule, Rule, SequenceRule, SpatialRule, SurroundingRule } from "./rules.js";
import { Matrix, RGB } from "./utils.js";

export var rules: Rule[] = [];
export var materials: Materials;

// conway's game of life and death
// const death = new Pattern( new RGB(0,0,0) );
// const life = new Pattern( new RGB(0,200,0) );

// sand
// const sand = new Pattern( new RGB(234, 234, 133) );
// const sand = new Pattern( new RGB(255, 192, 203) ); // pink sand!
const sand = new PatternRangeMonochrome(
  new Pattern(
    new RGB(255,237,167)
  ),
  new Pattern(
    new RGB(203,195,162)
  )
)
const deleter = new Pattern(
  new RGB(230, 20,40)
);
const allDeleters = new PatternRange(
  deleter,
  new Pattern(
    new RGB(230,255,40)
  )
)

const delAdd = new Pattern(
  new RGB(0,1,0)
);

// const sandL = new Pattern( new Matrix( 2,1, new RGB(0,0,0), new RGB(234, 234, 133) ) );
// const sandR = new Pattern( new Matrix( 2,1, new RGB(234, 234, 133), new RGB(0,0,0) ) );
const air = new Pattern( new RGB(0,0,0) );new RGB
// const sandEater = new Pattern( new RGB(30,200,20) )
const stone = new Pattern( new RGB(150,150,150) );

materials = new Materials(
  [
    // life,
    // death
    
    sand,
    air,
    stone,
    deleter
    // sandEater
  ],
  2
)

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
  rules.push(
    new MovementRule(
      new SpatialRule(
        new Matrix(
          1,2,
          new PatternSet([ sand ]),
          new PatternSet([ air ])
        ),
        new Matrix(
          1,2,
          new PatternSet([ air ]),
          new PatternSet([ sand ])
        )
      ),
      0,0,
      0,1
    )
  );

  rules.push(
    new SequenceRule([
      new QuantumRule([
        new MovementRule(
          new SpatialRule(
            new Matrix(
              4,2,
              new PatternSet([ ]),
              new PatternSet([ sand ]),
              new PatternSet([ air ]),
              new NegatedPatternSet([ sand ]),
  
              new PatternSet([ ]),
              new NegatedPatternSet([ air ]),
              new PatternSet([ air ]),
              new PatternSet([ ]),
            ),
            new Matrix(
              4,2,
              new PatternSet([ ]),
              new PatternSet([ air ]),
              new PatternSet([ ]),
              new PatternSet([ ]),
  
              new PatternSet([ ]),
              new PatternSet([ ]),
              new PatternSet([ sand ]),
              new PatternSet([ ]),
            )
          ),
          1,0,
          2,1
        ),
        new MovementRule(
          new SpatialRule(
            new Matrix(
              3,2,
              new PatternSet([ air ]),
              new PatternSet([ sand ]),
              new PatternSet([ ]),
  
              new PatternSet([ air ]),
              new NegatedPatternSet([ air ]),
              new PatternSet([ ])
            ),
            new Matrix(
              3,2,
              new PatternSet([ ]),
              new PatternSet([ air ]),
              new PatternSet([ ]),
  
              new PatternSet([ sand ]),
              new PatternSet([ ]),
              new PatternSet([ ])
            )
          ),
          1,0,
          0,1
        )
      ])
    ])
  );

  rules.push(
    new SpatialRule(
      new Matrix(
        2,2,
        new PatternSet([ ]),
        new PatternSet([ ]),
        
        new PatternSet([ ]),
        new PatternSet([ allDeleters ])
      ),
      new Matrix(
        3,3,
        new PatternSet([ air ]),
        new PatternSet([ air ]),
        new PatternSet([ air ]),

        new PatternSet([ air ]),
        new PatternSet([ ]),
        new PatternSet([ air ]),

        new PatternSet([ air ]),
        new PatternSet([ air ]),
        new PatternSet([ air ])
      )
    )
  )

  rules.push(
    new SurroundingRule({
      centralBefore: new PatternSet([ allDeleters ]),
      centralAfter: new PatternSet([ new PatternAddative(delAdd) ]),
      surrounding: new PatternSet([ sand ]),
      validCounts: [1,2,3,4,5,6,7,8],
      includeCorners: true,
      includeSides: true
    })
  )

  rules.push(
    new SpatialRule(
      new Matrix(
        1,1, new PatternSet([ new Pattern( new RGB(230,255,40) ) ])
      ),
      new Matrix(
        1,1, new PatternSet([ stone ])
      )
    )
  )
}