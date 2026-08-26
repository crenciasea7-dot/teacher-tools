import assert from "node:assert/strict";
import test from "node:test";
import { analyzePrice, duplicateIds, extractListingFields, initialCash, moneyFromText, priceBand, type Comparable, type RedevelopmentCandidate } from "../app/analysis.ts";

test("keeps asking prices and transactions in separate bands", () => {
  const items: Comparable[] = [
    {id:"1",name:"A",kind:"transaction",price:8,floor:"중층",occupancy:"즉시입주",sourceKind:"official",source:"official",checkedAt:"2026-08-21",included:true},
    {id:"2",name:"A",kind:"transaction",price:8.4,floor:"중층",occupancy:"즉시입주",sourceKind:"official",source:"official",checkedAt:"2026-08-21",included:true},
    {id:"3",name:"A",kind:"asking",price:8.8,floor:"중층",occupancy:"즉시입주",sourceKind:"ad",source:"ad",checkedAt:"2026-08-21",included:true},
    {id:"4",name:"A",kind:"asking",price:9,floor:"고층",occupancy:"즉시입주",sourceKind:"ad",source:"ad",checkedAt:"2026-08-21",included:true},
  ];
  const result=analyzePrice(items,"buy");
  assert.equal(result.transaction?.median,8.2);
  assert.equal(result.asking?.median,8.9);
  assert.ok(result.review && result.review.target <= result.asking.median);
});

test("does not make a price band from a single record",()=>assert.equal(priceBand([8.4]),null));

test("flags duplicate ad candidates without deleting them",()=>{
  const base={name:"가상 A 84",kind:"asking" as const,price:8.8,floor:"중층",occupancy:"즉시입주",sourceKind:"ad" as const,source:"ad",checkedAt:"2026-08-21",included:true};
  const ids=duplicateIds([{id:"a",...base},{id:"b",...base}]);
  assert.deepEqual([...ids].sort(),["a","b"]);
});

test("initial cash exposes missing inputs instead of silently treating them as confirmed",()=>{
  const candidate:RedevelopmentCandidate={id:"x",name:"x",region:"x",projectType:"재개발",stage:"구역지정",salePrice:7,officialPrice:null,deposit:null,assumableLoan:1,immediateCosts:null,contributionLow:null,contributionHigh:null,yearsLow:0,yearsHigh:0,rightsStatus:"미확인",source:"user",sourceKind:"user",checkedAt:"2026-08-21"};
  const result=initialCash(candidate);
  assert.equal(result.value,6);
  assert.deepEqual(result.missing,["승계 임대보증금","즉시 부대비용"]);
});

test("extracts common Korean listing fields from OCR text",()=>{
  const text="매매가 7억 2,000만원\n임대보증금 2억 8,000만원\n초기투자금 4억 4,000만원\n공시가격 9,600만원\n대지지분 18.4㎡\n구역지정";
  const fields=extractListingFields(text);
  assert.equal(moneyFromText("7억 2,000만원"),7.2);
  assert.equal(fields.salePrice,7.2);
  assert.equal(fields.deposit,2.8);
  assert.equal(fields.officialPrice,.96);
  assert.equal(fields.landShare,"18.4㎡");
  assert.equal(fields.stage,"구역지정");
});
