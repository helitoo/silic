import { SilicParser } from "../parser/SilicParser"
import { QueryExecutionRouter } from "../executor/QueryExecutionRouter"
import type { Entity, Connection, Template } from "@/lib/types"

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

export function runSilicParserTests() {
  console.log("Starting SILIC Parser & Execution Tests...")

  // 1. Simple comparison and logical AND
  const query1 = SilicParser.parse('(*.tên = "Hoa") AND (*.tuổi > 10)')
  assert(query1.where.type === "MULTI", "query1 where should be MULTI")
  if (query1.where.type === "MULTI") {
    assert(query1.where.operators[0] === "AND", "operator should be AND")
    assert(query1.where.subjects.length === 2, "subjects length should be 2")
  }
  console.log("✓ Test 1 Passed: Simple comparison and logical AND")

  // 2. Traversal expressions for SELF and NEIGHBORS
  const query2 = SilicParser.parse(
    '(SELF <-- *.tên = "Hoa") AND (NEIGHBORS <-- *.tuổi > 10)'
  )
  assert(query2.where.type === "MULTI", "query2 where should be MULTI")
  if (query2.where.type === "MULTI") {
    const left = query2.where.subjects[0] as any
    assert(left.type === "TRANVERSAL", "left should be TRANVERSAL")
    assert(left.subjectType === "SELF", "left subjectType should be SELF")

    const right = query2.where.subjects[1] as any
    assert(right.type === "TRANVERSAL", "right should be TRANVERSAL")
    assert(right.subjectType === "NEIGHBORS", "right subjectType should be NEIGHBORS")
  }
  console.log("✓ Test 2 Passed: Traversal for SELF and NEIGHBORS")

  // 3. Traversal with hop count <--2--
  const query3 = SilicParser.parse('SELF <--2-- (*.tên = "Hoa")')
  assert(query3.where.type === "TRANVERSAL", "query3 should be TRANVERSAL")
  if (query3.where.type === "TRANVERSAL") {
    assert(query3.where.hop === 2, "hop count should be 2")
    assert(query3.where.subjectType === "SELF", "subjectType should be SELF")
  }
  console.log("✓ Test 3 Passed: Traversal with hop count")

  // 4. Traversal with connection condition
  const query4 = SilicParser.parse(
    'SELF (*.role = "friend") <-- (*.name = "Hoa")'
  )
  assert(query4.where.type === "TRANVERSAL", "query4 should be TRANVERSAL")
  if (query4.where.type === "TRANVERSAL") {
    assert(Boolean(query4.where.connection && query4.where.connection.length === 1), "connection condition should be parsed")
  }
  console.log("✓ Test 4 Passed: Traversal with connection condition")

  // 5. Execution Test against Mock Graph
  const templates: Template[] = [
    {
      id: "tpl-person",
      name: "Person",
      records: [],
    },
  ]

  const entities: Entity[] = [
    {
      id: "e1",
      template: "tpl-person",
      records: [
        { id: "r1", name: "tên", value: "Hoa", type: "shortText", isArray: false },
        { id: "r2", name: "tuổi", value: 15, type: "number", isArray: false },
      ],
    },
    {
      id: "e2",
      template: "tpl-person",
      records: [
        { id: "r3", name: "tên", value: "Lan", type: "shortText", isArray: false },
        { id: "r4", name: "tuổi", value: 8, type: "number", isArray: false },
      ],
    },
    {
      id: "e3",
      template: "tpl-person",
      records: [
        { id: "r5", name: "tên", value: "Hoa", type: "shortText", isArray: false },
        { id: "r6", name: "tuổi", value: 5, type: "number", isArray: false },
      ],
    },
  ]

  const connections: Connection[] = [
    {
      id: "c1",
      from: ["e2"],
      to: ["e1"],
      isDirectional: true,
      records: [{ id: "cr1", name: "role", value: "friend", type: "shortText", isArray: false }],
    },
  ]

  // Filter 1: (*.tên = "Hoa") AND (*.tuổi > 10) -> e1 only
  const qExec1 = SilicParser.parse('(*.tên = "Hoa") AND (*.tuổi > 10)')
  const res1 = QueryExecutionRouter.executeEntityQuery(
    qExec1,
    entities,
    connections,
    undefined,
    templates
  )
  assert(res1.length === 1 && res1[0].id === "e1", "res1 should match e1")
  console.log("✓ Test 5.1 Passed: Execution filter (*.tên = 'Hoa') AND (*.tuổi > 10)")

  // Filter 2: SELF <-- (*.tên = "Lan") -> e1 (since e2 points to e1)
  const qExec2 = SilicParser.parse('SELF <-- (*.tên = "Lan")')
  const res2 = QueryExecutionRouter.executeEntityQuery(
    qExec2,
    entities,
    connections,
    undefined,
    templates
  )
  assert(res2.length === 1 && res2[0].id === "e1", "res2 should match e1")
  console.log("✓ Test 5.2 Passed: Execution Traversal SELF <-- (*.tên = 'Lan')")

  // Filter 3: SELF (*.role = "friend") <-- (*.tên = "Lan") -> e1
  const qExec3 = SilicParser.parse('SELF (*.role = "friend") <-- (*.tên = "Lan")')
  const res3 = QueryExecutionRouter.executeEntityQuery(
    qExec3,
    entities,
    connections,
    undefined,
    templates
  )
  assert(res3.length === 1 && res3[0].id === "e1", "res3 should match e1 with connection condition")
  console.log("✓ Test 5.3 Passed: Execution Traversal with matching connection condition")

  // Filter 4: SELF (*.role = "enemy") <-- (*.tên = "Lan") -> none
  const qExec4 = SilicParser.parse('SELF (*.role = "enemy") <-- (*.tên = "Lan")')
  const res4 = QueryExecutionRouter.executeEntityQuery(
    qExec4,
    entities,
    connections,
    undefined,
    templates
  )
  assert(res4.length === 0, "res4 should match none")
  console.log("✓ Test 5.4 Passed: Execution Traversal with non-matching connection condition")
  // 6. Tests with Dot Notation for Record and Template names
  // 6.1: Literal test: "a" = "a" evaluates to true -> returns all 3 entities
  const qLiteral = SilicParser.parse('"a" = "a"')
  const resLiteral = QueryExecutionRouter.executeEntityQuery(
    qLiteral,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resLiteral.length === 3, '"a" = "a" should evaluate to true and return all 3 entities')
  console.log('✓ Test 6.1 Passed: "a" = "a" (Literal equality)')

  // 6.2: Leading dot with quotes: (."tên" = "Hoa") AND (."tuổi" > 10)
  const qQuoted1 = SilicParser.parse('(."tên" = "Hoa") AND (."tuổi" > 10)')
  const resQuoted1 = QueryExecutionRouter.executeEntityQuery(
    qQuoted1,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resQuoted1.length === 1 && resQuoted1[0].id === "e1", "resQuoted1 should match e1")
  console.log('✓ Test 6.2 Passed: (."tên" = "Hoa") AND (."tuổi" > 10)')

  // 6.3: Leading dot without quotes: (.tên = "Hoa") AND (.tuổi > 10)
  const qUnquoted = SilicParser.parse('(.tên = "Hoa") AND (.tuổi > 10)')
  const resUnquoted = QueryExecutionRouter.executeEntityQuery(
    qUnquoted,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resUnquoted.length === 1 && resUnquoted[0].id === "e1", "resUnquoted should match e1")
  console.log('✓ Test 6.3 Passed: (.tên = "Hoa") AND (.tuổi > 10)')

  // 6.4: Quoted with wildcard *."tên" = "Hoa"
  const qQuoted2 = SilicParser.parse('(*."tên" = "Hoa") AND (*."tuổi" > 10)')
  const resQuoted2 = QueryExecutionRouter.executeEntityQuery(
    qQuoted2,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resQuoted2.length === 1 && resQuoted2[0].id === "e1", "resQuoted2 should match e1")
  console.log('✓ Test 6.4 Passed: (*."tên" = "Hoa") AND (*."tuổi" > 10)')

  // 6.5: Quoted template and record "Person"."tên" = "Hoa"
  const qQuoted3 = SilicParser.parse('("Person"."tên" = "Hoa") AND ("Person"."tuổi" > 10)')
  const resQuoted3 = QueryExecutionRouter.executeEntityQuery(
    qQuoted3,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resQuoted3.length === 1 && resQuoted3[0].id === "e1", "resQuoted3 should match e1")
  console.log('✓ Test 6.5 Passed: ("Person"."tên" = "Hoa") AND ("Person"."tuổi" > 10)')

  // 6.6: Quoted template selector "Person".
  const qQuoted4 = SilicParser.parse('"Person".')
  const resQuoted4 = QueryExecutionRouter.executeEntityQuery(
    qQuoted4,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resQuoted4.length === 3, "resQuoted4 should match all 3 Person entities")
  console.log('✓ Test 6.6 Passed: "Person". (Template Selector)')

  // 6.7: Traversal with leading dot: SELF (."role" = "friend") <-- (."tên" = "Lan")
  const qQuoted5 = SilicParser.parse('SELF (."role" = "friend") <-- (."tên" = "Lan")')
  const resQuoted5 = QueryExecutionRouter.executeEntityQuery(
    qQuoted5,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resQuoted5.length === 1 && resQuoted5[0].id === "e1", "resQuoted5 should match e1")
  console.log('✓ Test 6.7 Passed: SELF (."role" = "friend") <-- (."tên" = "Lan")')

  // 7. Tests with Left-to-Right Sequential Evaluation in MULTI
  // 7.1: 3 > 2 > 1 evaluates to (3 > 2) > 1 = (true) > 1 = 1 > 1 = false -> matches 0 entities
  const qChained1 = SilicParser.parse("3 > 2 > 1")
  assert(qChained1.where.type === "MULTI", "3 > 2 > 1 should parse to MULTI")
  if (qChained1.where.type === "MULTI") {
    assert(qChained1.where.subjects.length === 3, "subjects length should be 3")
    assert(qChained1.where.operators.length === 2, "operators length should be 2")
  }
  const resChained1 = QueryExecutionRouter.executeEntityQuery(
    qChained1,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resChained1.length === 0, "3 > 2 > 1 should evaluate to false (0 matches)")
  console.log("✓ Test 7.1 Passed: 3 > 2 > 1 evaluates to false from left to right")

  // 7.2: 3 > 2 > 0 evaluates to (3 > 2) > 0 = (true) > 0 = 1 > 0 = true -> matches all 3 entities
  const qChained2 = SilicParser.parse("3 > 2 > 0")
  const resChained2 = QueryExecutionRouter.executeEntityQuery(
    qChained2,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resChained2.length === 3, "3 > 2 > 0 should evaluate to true (3 matches)")
  console.log("✓ Test 7.2 Passed: 3 > 2 > 0 evaluates to true from left to right")

  // 8. Tests for empty code and () evaluating to true
  // 8.1: "" (empty string) matches all entities
  const qEmpty = SilicParser.parse("")
  const resEmpty = QueryExecutionRouter.executeEntityQuery(
    qEmpty,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resEmpty.length === 3, "empty query should match all entities")
  console.log("✓ Test 8.1 Passed: empty query matches all entities")

  // 8.2: () (empty parentheses) matches all entities
  const qParens = SilicParser.parse("()")
  const resParens = QueryExecutionRouter.executeEntityQuery(
    qParens,
    entities,
    connections,
    undefined,
    templates
  )
  assert(resParens.length === 3, "() should match all entities")
  console.log("✓ Test 8.2 Passed: () matches all entities")

  console.log("ALL SILIC PARSER & EXECUTION TESTS PASSED!")
}
