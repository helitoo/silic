import { SilicParser } from "../parser/SilicParser"
import { PathQueryExecutor } from "../executor/PathQueryExecutor"
import { GraphTraversalEngine } from "../traversal/GraphTraversalEngine"
import { InMemoryEntityRepository } from "../repository/EntityRepository"
import type { Connection, Entity, Template } from "../types"

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`)
  }
}

export function runSilicPathTests() {
  console.log("=== RUNNING SILIC PATH QUERY TESTS ===")

  // 1. Path Arrow & Quantifiers: ((TEMPLATE = "Bạn bè") AND (AVOID TEMPLATE = "Người thân")) <-- (*.Tuổi > 10)
  const qPath1 = SilicParser.parsePath(
    '((TEMPLATE = "Bạn bè") AND (AVOID TEMPLATE = "Người thân")) <-- (*.Tuổi > 10)'
  )
  assert(qPath1.type === "PATH_ARROW", "qPath1 should be PATH_ARROW")
  if (qPath1.type === "PATH_ARROW") {
    assert(qPath1.connectionExpr !== undefined, "connectionExpr should exist")
    assert(qPath1.entityExpr !== undefined, "entityExpr should exist")
    assert(
      qPath1.connectionExpr?.type === "PATH_AND",
      "connectionExpr should be PATH_AND"
    )
    assert(
      qPath1.entityExpr?.type === "PATH_CONSTRAINT",
      "entityExpr should be PATH_CONSTRAINT"
    )
  }
  console.log("✓ Test 1 Passed: Arrow & Avoid parsed successfully")

  // 2. Sequence constraint: (TEMPLATE = "Bạn bè") << (TEMPLATE = "Đồng nghiệp")
  const qPath2 = SilicParser.parsePath(
    '(TEMPLATE = "Bạn bè") << (TEMPLATE = "Đồng nghiệp")'
  )
  assert(qPath2.type === "PATH_SEQUENCE", "qPath2 should be PATH_SEQUENCE")
  console.log("✓ Test 2 Passed: Sequence (<<) parsed successfully")

  // 3. Alternative constraint: (."tên" = "A") || (."tên" = "B")
  const qPath3 = SilicParser.parsePath(
    '(."tên" = "A") || (."tên" = "B")'
  )
  assert(qPath3.type === "PATH_OR", "qPath3 should be PATH_OR")
  console.log("✓ Test 3 Passed: Alternative (||) parsed successfully")

  // 4. Exact count quantifier: 2 TIMES (TEMPLATE = "Bạn bè")
  const qPath4 = SilicParser.parsePath('2 TIMES (TEMPLATE = "Bạn bè")')
  assert(qPath4.type === "PATH_CONSTRAINT", "qPath4 should be PATH_CONSTRAINT")
  if (qPath4.type === "PATH_CONSTRAINT") {
    assert(
      typeof qPath4.quantifier === "object" && qPath4.quantifier.times === 2,
      "quantifier should be 2 TIMES"
    )
  }
  console.log("✓ Test 4 Passed: 2 TIMES quantifier parsed successfully")

  // 5. Exclusivity quantifier: ALL TIMES (TEMPLATE = "Bạn bè")
  const qPath5 = SilicParser.parsePath('ALL TIMES (TEMPLATE = "Bạn bè")')
  assert(qPath5.type === "PATH_CONSTRAINT", "qPath5 should be PATH_CONSTRAINT")
  if (qPath5.type === "PATH_CONSTRAINT") {
    assert(
      qPath5.quantifier === "ALL_TIMES",
      "quantifier should be ALL_TIMES"
    )
  }
  console.log("✓ Test 5 Passed: ALL TIMES quantifier parsed successfully")

  // 6. Empty code, (), <--, () <-- () evaluates as true / unconstrained
  const qEmpty = SilicParser.parsePath("")
  assert(qEmpty !== undefined, "Empty path code should parse to true")

  const qParens = SilicParser.parsePath("()")
  assert(qParens !== undefined, "() should parse to true")

  const qArrowOnly = SilicParser.parsePath("<--")
  assert(qArrowOnly.type === "PATH_ARROW", "<-- should parse to PATH_ARROW")

  const qArrowParens = SilicParser.parsePath("() <-- ()")
  assert(qArrowParens.type === "PATH_ARROW", "() <-- () should parse to PATH_ARROW")

  const qConnEmpty = SilicParser.parsePath('() <-- (*.tuổi > 10)')
  assert(qConnEmpty.type === "PATH_ARROW", "() <-- (*.tuổi > 10) should parse")

  const qEntityEmpty = SilicParser.parsePath('(TEMPLATE = "Bạn bè") <-- ()')
  assert(qEntityEmpty.type === "PATH_ARROW", '(TEMPLATE = "Bạn bè") <-- () should parse')
  console.log("✓ Test 6 Passed: Empty, (), <--, () <-- () handled successfully")

  // 7. Graph Search with Constraints Test
  // Graph: E1 -(C1: Friend)-> E2 -(C2: Coworker)-> E3
  //        E1 -(C3: Family)-> E4 -(C4: Family)-> E3
  const entities: Entity[] = [
    { id: "e1", template: "t1", records: [{ id: "r1", name: "tên", type: "shortText", isArray: false, value: "An" }] },
    { id: "e2", template: "t1", records: [{ id: "r2", name: "tên", type: "shortText", isArray: false, value: "Bình" }, { id: "r3", name: "tuổi", type: "number", isArray: false, value: 25 }] },
    { id: "e3", template: "t1", records: [{ id: "r4", name: "tên", type: "shortText", isArray: false, value: "Cường" }] },
    { id: "e4", template: "t1", records: [{ id: "r5", name: "tên", type: "shortText", isArray: false, value: "Dung" }, { id: "r6", name: "tuổi", type: "number", isArray: false, value: 5 }] },
  ]

  const templates: Template[] = [
    { id: "t_friend", name: "Bạn bè", records: [] },
    { id: "t_coworker", name: "Đồng nghiệp", records: [] },
    { id: "t_family", name: "Người thân", records: [] },
  ]

  const connections: Connection[] = [
    { id: "c1", from: ["e1"], to: ["e2"], template: "t_friend", isDirectional: true, records: [] },
    { id: "c2", from: ["e2"], to: ["e3"], template: "t_coworker", isDirectional: true, records: [] },
    { id: "c3", from: ["e1"], to: ["e4"], template: "t_family", isDirectional: true, records: [] },
    { id: "c4", from: ["e4"], to: ["e3"], template: "t_family", isDirectional: true, records: [] },
  ]

  const repo = new InMemoryEntityRepository(entities, connections, templates)
  const traversal = new GraphTraversalEngine(repo)

  // 6.1 Avoid family path: should pick E1 -> E2 -> E3
  const qPathAvoid = SilicParser.parsePath('AVOID (TEMPLATE = "Người thân")')
  const resAvoid = PathQueryExecutor.execute(
    { from: "e1", to: "e3", where: qPathAvoid },
    traversal
  )
  assert(resAvoid.found === true, "Path avoiding family should be found")
  assert(resAvoid.entities.length === 3, "Path should have 3 entities")
  assert(resAvoid.entities[1].id === "e2", "Path should pass through e2")
  console.log("✓ Test 6.1 Passed: Shortest path with AVOID constraint")

  // 6.2 Sequence: Friend << Coworker
  const qPathSeq = SilicParser.parsePath('(TEMPLATE = "Bạn bè") << (TEMPLATE = "Đồng nghiệp")')
  const resSeq = PathQueryExecutor.execute(
    { from: "e1", to: "e3", where: qPathSeq },
    traversal
  )
  assert(resSeq.found === true, "Path with Friend << Coworker should be found")
  assert(resSeq.connections[0].id === "c1" && resSeq.connections[1].id === "c2", "Sequence should be c1 then c2")
  console.log("✓ Test 6.2 Passed: Shortest path with << constraint")

  // 7.3 Combined: (TEMPLATE = "Bạn bè") <-- (*.tuổi > 10)
  const qPathComb = SilicParser.parsePath('(TEMPLATE = "Bạn bè") <-- (*.tuổi > 10)')
  const resComb = PathQueryExecutor.execute(
    { from: "e1", to: "e3", where: qPathComb },
    traversal
  )
  assert(resComb.found === true, "Combined path should be found")
  assert(resComb.entities[1].id === "e2", "Intermediate entity should be e2 (tuổi 25 > 10)")
  console.log("✓ Test 7.3 Passed: Combined (conn) <-- (entity) path search")

  // 7.4 Search with <-- or () <-- () or empty: should find shortest path without error
  const resArrow = PathQueryExecutor.execute(
    { from: "e1", to: "e3", where: SilicParser.parsePath("<--") },
    traversal
  )
  assert(resArrow.found === true, "<-- should find valid path")

  const resBothParens = PathQueryExecutor.execute(
    { from: "e1", to: "e3", where: SilicParser.parsePath("() <-- ()") },
    traversal
  )
  assert(resBothParens.found === true, "() <-- () should find valid path")

  const resEmptyCode = PathQueryExecutor.execute(
    { from: "e1", to: "e3", where: SilicParser.parsePath("") },
    traversal
  )
  assert(resEmptyCode.found === true, "Empty code should find valid path")
  console.log("✓ Test 7.4 Passed: Search with <-- and () <-- () and empty code")

  console.log("ALL SILIC PATH QUERY TESTS PASSED!")
}

// Auto run
runSilicPathTests()
