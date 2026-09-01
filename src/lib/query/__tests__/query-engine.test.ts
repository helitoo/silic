import { InMemoryEntityRepository } from "../repository/EntityRepository"
import { GraphTraversalEngine } from "../traversal/GraphTraversalEngine"
import { AggregateEngine } from "../aggregate/AggregateEngine"
import { OperatorEngine } from "../operator/OperatorEngine"
import { QueryExecutionRouter } from "../executor/QueryExecutionRouter"
import type { Connection, Entity } from "@/lib/types"
import type { EntityQuery, PathQuery } from "@/lib/query-types"

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function runTests() {
  console.log("Starting Query Engine Verification (TRANVERSAL with operator & subjects, ConnectionSelector combination)...")

  // --- 1. Operator Engine ---
  console.log("1. Testing OperatorEngine...")
  assert(OperatorEngine.compare(">", 5, 3) === true, "5 > 3 should be true")
  assert(OperatorEngine.compare("<", 5, 3) === false, "5 < 3 should be false")
  assert(OperatorEngine.compare("=", 5, 5) === true, "5 = 5 should be true")
  assert(OperatorEngine.compare("~", "aBcD", "bc") === true, '"aBcD" ~ "bc" should be true')
  assert(OperatorEngine.compare("~", 5, 5) === true, "5 ~ 5 non-string fuzzy should be true")
  assert(OperatorEngine.compare("~", 5, 6) === false, "5 ~ 6 non-string fuzzy should be false")

  // Array + Primitive Comparison
  assert(OperatorEngine.compare(">", [1, 2, 3], 2) === true, "[1, 2, 3] > 2 should be true (3 > 2)")
  assert(OperatorEngine.compare("=", [1, 2, 3], 2) === true, "[1, 2, 3] = 2 should be true (contains 2)")
  assert(OperatorEngine.compare("=", [1, 2, 3], 4) === false, "[1, 2, 3] = 4 should be false")

  // Arithmetic
  assert(OperatorEngine.arithmetic("+", 1, 2) === 3, "1 + 2 should be 3")
  const addArr = OperatorEngine.arithmetic("+", [1, 2, 3], [4, 5, 6]) as number[]
  assert(
    Array.isArray(addArr) && addArr[0] === 5 && addArr[1] === 7 && addArr[2] === 9,
    "[1,2,3] + [4,5,6] should be [5,7,9]"
  )
  const subArr = OperatorEngine.arithmetic("-", [10, 20, 30], [1, 2, 3]) as number[]
  assert(
    Array.isArray(subArr) && subArr[0] === 9 && subArr[1] === 18 && subArr[2] === 27,
    "[10,20,30] - [1,2,3] should be [9,18,27]"
  )
  const addScalarArr = OperatorEngine.arithmetic("+", [1, 2, 3], 5) as number[]
  assert(
    Array.isArray(addScalarArr) && addScalarArr.length === 1 && addScalarArr[0] === 6,
    "[1,2,3] + 5 should be [6]"
  )

  // --- 2. Aggregate Engine ---
  console.log("2. Testing AggregateEngine...")
  assert(AggregateEngine.sum([1, 2, 3]) === 6, "SUM([1,2,3]) = 6")
  assert(AggregateEngine.count([1, 2, 3]) === 3, "COUNT([1,2,3]) = 3")
  assert(AggregateEngine.mean([1, 2, 3]) === 2, "MEAN([1,2,3]) = 2")
  assert(AggregateEngine.median([1, 2, 3, 4]) === 2.5, "MEDIAN([1,2,3,4]) = 2.5")
  assert(AggregateEngine.min([10, 2, 30]) === 2, "MIN([10,2,30]) = 2")
  assert(AggregateEngine.max([10, 2, 30]) === 30, "MAX([10,2,30]) = 30")

  // --- 3. Graph Traversal & Path Query ---
  console.log("3. Testing GraphTraversalEngine & PathQuery with multi-entity connections...")
  const sampleEntities: Entity[] = [
    {
      id: "A",
      records: [
        { id: "r1", name: "username", type: "shortText", isArray: false, value: "Alice" },
        { id: "r2", name: "age", type: "number", isArray: false, value: 25 },
        { id: "r3", name: "scores", type: "number", isArray: true, value: [8, 9, 10] },
      ],
    },
    {
      id: "B",
      records: [
        { id: "r4", name: "username", type: "shortText", isArray: false, value: "Bob" },
        { id: "r5", name: "age", type: "number", isArray: false, value: 30 },
      ],
    },
    {
      id: "C",
      records: [
        { id: "r6", name: "username", type: "shortText", isArray: false, value: "Charlie" },
        { id: "r7", name: "age", type: "number", isArray: false, value: 17 },
      ],
    },
    {
      id: "D",
      records: [
        { id: "r8", name: "companyName", type: "shortText", isArray: false, value: "Google" },
      ],
    },
  ]

  const sampleConnections: Connection[] = [
    {
      id: "conn-ab",
      from: ["A"],
      to: ["B"],
      isDirectional: true,
      records: [
        { id: "cr1", name: "friend", type: "shortText", isArray: false, value: "true" },
      ],
    },
    {
      id: "conn-ac",
      from: ["A"],
      to: ["C"],
      isDirectional: true,
      records: [
        { id: "cr2", name: "worksAt", type: "shortText", isArray: false, value: "true" },
      ],
    },
    {
      id: "conn-bd",
      from: ["B"],
      to: ["D"],
      isDirectional: true,
      records: [
        { id: "cr3", name: "worksAt", type: "shortText", isArray: false, value: "true" },
      ],
    },
    {
      id: "conn-cd",
      from: ["C"],
      to: ["D"],
      isDirectional: true,
      records: [
        { id: "cr4", name: "worksAt", type: "shortText", isArray: false, value: "true" },
      ],
    },
  ]

  const repo = new InMemoryEntityRepository(sampleEntities, sampleConnections)
  const traversal = new GraphTraversalEngine(repo)

  // Test outbound traversal from A
  const aNeighbors = traversal.getOutboundNeighbors("A")
  assert(
    aNeighbors.some((n) => n.to === "B" && n.connection.id === "conn-ab"),
    "A should connect to B via conn-ab"
  )

  // Test inbound traversal to B
  const bSources = traversal.getInboundNeighbors("B")
  assert(
    bSources.some((s) => s.from === "A" && s.connection.id === "conn-ab"),
    "B should receive connection from A via conn-ab"
  )

  // Shortest path A -> D with via = [{ record: 'worksAt' }]
  const pathViaWorksAt: PathQuery = {
    from: "A",
    to: "D",
    via: [{ record: "worksAt" }],
  }
  const resWorksAt = QueryExecutionRouter.executePathQuery(pathViaWorksAt, repo)
  assert(resWorksAt.found === true, "Path A -> D should be found")
  assert(
    JSON.stringify(resWorksAt.entities.map((e) => e.id)) ===
      JSON.stringify(["A", "C", "D"]),
    `Path should be A -> C -> D, got ${JSON.stringify(resWorksAt.entities.map((e) => e.id))}`
  )

  // --- 4. Entity Query (Direct PrimaryOperand in subjects & Chained comparison) ---
  console.log("4. Testing EntityQuery with direct PrimaryOperand subjects...")
  // Query: WHERE age >= 18 AND SUM(scores) > 20
  const query: EntityQuery = {
    where: {
      type: "MULTI",
      operators: ["AND"],
      subjects: [
        {
          type: "MULTI",
          operators: [">="],
          subjects: [
            {
              value: {
                type: "ENTITYSELECTOR",
                value: { record: "age" },
              },
            },
            {
              value: {
                type: "LITERAL",
                value: 18,
              },
            },
          ],
        },
        {
          type: "MULTI",
          operators: [">"],
          subjects: [
            {
              value: {
                type: "ENTITYSELECTOR",
                value: { record: "scores" },
                function: "SUM",
              },
            },
            {
              value: {
                type: "LITERAL",
                value: 20,
              },
            },
          ],
        },
      ],
    },
  }

  const queryResults: Entity[] = QueryExecutionRouter.executeEntityQuery(query, repo)
  assert(queryResults.length === 1, `Expected 1 matching entity, got ${queryResults.length}`)
  assert(queryResults[0].id === "A", `Expected entity A, got ${queryResults[0].id}`)

  // --- 5. TRANVERSAL Expression with operators and subjects (Combining ConnectionSelector & EntitySelector) ---
  console.log("5. Testing TRANVERSAL Expression with operators and subjects...")
  
  // A has connection "cr1: friend" to B (Bob, age 30)
  // Query for NEIGHBORS: Find entity with connection where friend = 'true' AND neighbor's username = 'Bob'
  const traversalNeighborsQuery: EntityQuery = {
    where: {
      type: "TRANVERSAL",
      operators: ["AND"],
      subjectType: "NEIGHBORS",
      subjects: [
        {
          type: "MULTI",
          operators: ["="],
          subjects: [
            {
              value: {
                type: "CONNECTIONSELECTOR",
                value: { record: "friend" },
              },
            },
            {
              value: {
                type: "LITERAL",
                value: "true",
              },
            },
          ],
        },
        {
          type: "MULTI",
          operators: ["="],
          subjects: [
            {
              value: {
                type: "ENTITYSELECTOR",
                value: { record: "username" },
              },
            },
            {
              value: {
                type: "LITERAL",
                value: "Bob",
              },
            },
          ],
        },
      ],
    },
  }

  const resNeighbors = QueryExecutionRouter.executeEntityQuery(traversalNeighborsQuery, repo)
  assert(resNeighbors.length === 1, `Expected 1 entity for NEIGHBORS query, got ${resNeighbors.length}`)
  assert(resNeighbors[0].id === "A", `NEIGHBORS query should match A, got ${resNeighbors[0].id}`)

  // Query for SELF: Find entity with incoming connection where friend = 'true' from Alice
  const traversalSelfQuery: EntityQuery = {
    where: {
      type: "TRANVERSAL",
      operators: ["AND"],
      subjectType: "SELF",
      subjects: [
        {
          type: "MULTI",
          operators: ["="],
          subjects: [
            {
              value: {
                type: "CONNECTIONSELECTOR",
                value: { record: "friend" },
              },
            },
            {
              value: {
                type: "LITERAL",
                value: "true",
              },
            },
          ],
        },
        {
          type: "MULTI",
          operators: ["="],
          subjects: [
            {
              value: {
                type: "ENTITYSELECTOR",
                value: { record: "username" },
              },
            },
            {
              value: {
                type: "LITERAL",
                value: "Alice",
              },
            },
          ],
        },
      ],
    },
  }

  const resSelf = QueryExecutionRouter.executeEntityQuery(traversalSelfQuery, repo)
  assert(resSelf.length === 1, `Expected 1 entity for SELF query, got ${resSelf.length}`)
  assert(resSelf[0].id === "B", `SELF query should match B, got ${resSelf[0].id}`)

  // --- 6. Multi-operator chaining & Automatic Multiplicative Grouping (*, /) ---
  console.log("6. Testing multi-operator chaining & automatic multiplicative grouping...")

  // Flat arithmetic with mixed precedence: [10] [+] [5] [*] [2]
  // Preprocessor will automatically group [5 * 2] into sub-block, yielding: 10 + (5 * 2) = 20
  const flatMixedArithmetic: EntityQuery = {
    where: {
      type: "MULTI",
      operators: ["=", "AND"],
      subjects: [
        {
          type: "MULTI",
          operators: ["+", "*"],
          subjects: [
            { value: { type: "LITERAL", value: 10 } },
            { value: { type: "LITERAL", value: 5 } },
            { value: { type: "LITERAL", value: 2 } },
          ],
        },
        { value: { type: "LITERAL", value: 20 } },
      ],
    },
  }
  const resFlatMixed = QueryExecutionRouter.executeEntityQuery(flatMixedArithmetic, repo)
  assert(resFlatMixed.length === sampleEntities.length, "Flat mixed arithmetic 10 + 5 * 2 = 20 should match all entities")

  // Complex flat arithmetic: [20] [-] [6] [/] [2] [+] [3] [*] [4]
  // Automatically groups: 20 - (6 / 2) + (3 * 4) = 20 - 3 + 12 = 29
  const complexFlatArithmetic: EntityQuery = {
    where: {
      type: "MULTI",
      operators: ["=", "AND"],
      subjects: [
        {
          type: "MULTI",
          operators: ["-", "/", "+", "*"],
          subjects: [
            { value: { type: "LITERAL", value: 20 } },
            { value: { type: "LITERAL", value: 6 } },
            { value: { type: "LITERAL", value: 2 } },
            { value: { type: "LITERAL", value: 3 } },
            { value: { type: "LITERAL", value: 4 } },
          ],
        },
        { value: { type: "LITERAL", value: 29 } },
      ],
    },
  }
  const resComplexFlat = QueryExecutionRouter.executeEntityQuery(complexFlatArithmetic, repo)
  assert(resComplexFlat.length === sampleEntities.length, "Complex flat arithmetic 20 - 6 / 2 + 3 * 4 = 29 should match all")

  // Explicit sub-block for overriding precedence: (10 + 5) * 2 = 30
  const explicitSubBlockArithmetic: EntityQuery = {
    where: {
      type: "MULTI",
      operators: ["=", "AND"],
      subjects: [
        {
          type: "MULTI",
          operators: ["*"],
          subjects: [
            {
              type: "MULTI",
              operators: ["+"],
              subjects: [
                { value: { type: "LITERAL", value: 10 } },
                { value: { type: "LITERAL", value: 5 } },
              ],
            },
            { value: { type: "LITERAL", value: 2 } },
          ],
        },
        { value: { type: "LITERAL", value: 30 } },
      ],
    },
  }
  const resExplicitSubBlock = QueryExecutionRouter.executeEntityQuery(explicitSubBlockArithmetic, repo)
  assert(resExplicitSubBlock.length === sampleEntities.length, "Explicit sub-block (10 + 5) * 2 = 30 should match all")

  // Chained logic with multiple operators: [age > 20] [AND] [username = 'Alice'] [OR] [age = 17]
  // For Alice (age 25, username 'Alice'): (true AND true) OR false -> true
  // For Bob (age 30, username 'Bob'): (true AND false) OR false -> false
  // For Charlie (age 17, username 'Charlie'): (false AND false) OR true -> true
  const chainedLogicQuery: EntityQuery = {
    where: {
      type: "MULTI",
      operators: ["AND", "OR"],
      subjects: [
        {
          type: "MULTI",
          operators: [">"],
          subjects: [
            { value: { type: "ENTITYSELECTOR", value: { record: "age" } } },
            { value: { type: "LITERAL", value: 20 } },
          ],
        },
        {
          type: "MULTI",
          operators: ["="],
          subjects: [
            { value: { type: "ENTITYSELECTOR", value: { record: "username" } } },
            { value: { type: "LITERAL", value: "Alice" } },
          ],
        },
        {
          type: "MULTI",
          operators: ["="],
          subjects: [
            { value: { type: "ENTITYSELECTOR", value: { record: "age" } } },
            { value: { type: "LITERAL", value: 17 } },
          ],
        },
      ],
    },
  }

  const resChained = QueryExecutionRouter.executeEntityQuery(chainedLogicQuery, repo)
  const matchedIds = resChained.map((e) => e.id).sort()
  assert(
    JSON.stringify(matchedIds) === JSON.stringify(["A", "C"]),
    `Expected matched entities ['A', 'C'], got ${JSON.stringify(matchedIds)}`
  )

  // Multi-operator TRANVERSAL: Find entity where connected friend neighbor has age = 30 AND username = 'Bob'
  const multiOpTraversal: EntityQuery = {
    where: {
      type: "TRANVERSAL",
      operators: ["AND"],
      subjectType: "NEIGHBORS",
      subjects: [
        {
          type: "MULTI",
          operators: ["="],
          subjects: [
            { value: { type: "CONNECTIONSELECTOR", value: { record: "friend" } } },
            { value: { type: "LITERAL", value: "true" } },
          ],
        },
        {
          type: "MULTI",
          operators: ["="],
          subjects: [
            { value: { type: "ENTITYSELECTOR", value: { record: "age" } } },
            { value: { type: "LITERAL", value: 30 } },
          ],
        },
      ],
    },
  }
  const resMultiOpTraversal = QueryExecutionRouter.executeEntityQuery(multiOpTraversal, repo)
  assert(resMultiOpTraversal.length === 1 && resMultiOpTraversal[0].id === "A", "Multi-op TRANVERSAL should match A")

  // --- 7. Sub-block Grouping (Parentheses Precedence via Nested MULTI) ---
  console.log("7. Testing Sub-block Grouping for Operator Precedence...")

  // Case 7.1: Arithmetic Sub-block: 10 + (5 * 2) = 20 vs (10 + 5) * 2 = 30
  // Inner block: 5 * 2 = 10
  // Outer block: 10 + (5 * 2) = 20
  const subBlockArithmetic: EntityQuery = {
    where: {
      type: "MULTI",
      operators: ["=", "AND"],
      subjects: [
        {
          type: "MULTI",
          operators: ["+"],
          subjects: [
            { value: { type: "LITERAL", value: 10 } },
            {
              type: "MULTI",
              operators: ["*"],
              subjects: [
                { value: { type: "LITERAL", value: 5 } },
                { value: { type: "LITERAL", value: 2 } },
              ],
            },
          ],
        },
        { value: { type: "LITERAL", value: 20 } },
      ],
    },
  }
  const resSubBlockArithmetic = QueryExecutionRouter.executeEntityQuery(subBlockArithmetic, repo)
  assert(resSubBlockArithmetic.length === sampleEntities.length, "Sub-block arithmetic 10 + (5 * 2) = 20 should match all")

  // Case 7.2: Logic Sub-block: [username = 'Bob'] OR ([username = 'Alice'] AND [age = 25])
  // Alice: false OR (true AND true) -> true
  // Bob: true OR (false AND false) -> true
  // Charlie: false OR (false AND false) -> false
  const subBlockLogicQuery: EntityQuery = {
    where: {
      type: "MULTI",
      operators: ["OR"],
      subjects: [
        {
          type: "MULTI",
          operators: ["="],
          subjects: [
            { value: { type: "ENTITYSELECTOR", value: { record: "username" } } },
            { value: { type: "LITERAL", value: "Bob" } },
          ],
        },
        {
          type: "MULTI",
          operators: ["AND"],
          subjects: [
            {
              type: "MULTI",
              operators: ["="],
              subjects: [
                { value: { type: "ENTITYSELECTOR", value: { record: "username" } } },
                { value: { type: "LITERAL", value: "Alice" } },
              ],
            },
            {
              type: "MULTI",
              operators: ["="],
              subjects: [
                { value: { type: "ENTITYSELECTOR", value: { record: "age" } } },
                { value: { type: "LITERAL", value: 25 } },
              ],
            },
          ],
        },
      ],
    },
  }
  const resSubBlockLogic = QueryExecutionRouter.executeEntityQuery(subBlockLogicQuery, repo)
  const matchedSubBlockIds = resSubBlockLogic.map((e) => e.id).sort()
  assert(
    JSON.stringify(matchedSubBlockIds) === JSON.stringify(["A", "B"]),
    `Expected matched entities ['A', 'B'], got ${JSON.stringify(matchedSubBlockIds)}`
  )

  console.log("All Query Engine Tests Passed! 🎉")
}

runTests()
