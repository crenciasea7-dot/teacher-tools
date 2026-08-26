import assert from "node:assert/strict";
import test from "node:test";
import { analyzeInvestmentCase, applyFollowUp, parseInvestmentRequest, WIRYE_SELL_SCENARIO } from "../app/conversation-engine.ts";

test("위례24단지 한 문단에서 핵심 매도 조건을 추출한다", () => {
  const data = parseInvestmentRequest(WIRYE_SELL_SCENARIO);
  assert.equal(data.intent, "sell");
  assert.equal(data.subject.complexName?.value, "송파꿈에그린위례24단지");
  assert.equal(data.subject.unitType?.value, "70A");
  assert.equal(data.subject.price?.value, 16);
  assert.equal(data.subject.floor?.value, 3);
  assert.equal(data.subject.floorType?.value, "필로티 상부층");
  assert.equal(data.subject.direction?.value, "동향");
  assert.equal(data.subject.occupancy?.value, "즉시입주");
  assert.deepEqual(data.comparables.map((item) => item.price?.value), [15, 15.5]);
  assert.equal(data.comparables[0].floor?.value, 1);
  assert.equal(data.comparables[1].occupancy?.value, "임차인 거주");
  assert.equal(data.comparables[1].availableDate?.value, "다음 해 3월");
  assert.equal(data.duplicateBroker, "탑위례");
  assert.ok(data.missingQuestions.length >= 1 && data.missingQuestions.length <= 3);
});

test("후속 대화는 기존 조건을 유지하며 가격만 바꾼다", () => {
  const before = parseInvestmentRequest(WIRYE_SELL_SCENARIO);
  const after = applyFollowUp(before, "그럼 가격을 15.8억으로 바꾸면?");
  assert.equal(after.subject.price?.value, 15.8);
  assert.equal(after.subject.price?.updated, true);
  assert.equal(after.subject.floor?.value, 3);
  assert.equal(after.comparables.length, 2);
  assert.match(analyzeInvestmentCase(after).headline, /15.8억원/);
});
