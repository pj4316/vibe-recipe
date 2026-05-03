# Forage 동작 문서

`forage`는 접근 방식, library, vendor, API, architecture 선택지가 불명확할 때 `recipe` 전에 사용하는 research skill입니다. 사용자는 `/vr:forage` 또는 개발자 alias `/vr:research`로 호출할 수 있습니다.

`forage`의 결과물은 구현이 아니라 option 비교와 `Status: Proposed` ADR 초안입니다. 사람 승인 없이 결정을 accepted로 바꾸지 않습니다.

## 목표

- 하나의 blocking decision question을 제품/기술 문맥 안에서 명확히 씁니다.
- 가능한 option 2-4개를 같은 기준으로 비교합니다.
- 외부 기술 사실은 primary source 중심으로 확인합니다.
- 추천 option, tradeoff, risk, migration cost, reversal condition을 남깁니다.
- `.agent/wiki/decisions/NNNN-<slug>.md`에 proposed ADR을 작성합니다.
- `recipe`가 반영할 constraint, validation check, task implication을 전달합니다.

## 시작 조건

| 조건 | 처리 |
| --- | --- |
| 기술 선택 질문이 명확함 | 바로 option 비교 진행 |
| 제품 goal이 불명확함 | `recipe`에서 제품 질문으로 먼저 정렬 |
| 기존 accepted ADR이 있음 | 결정을 다시 열지 않고 compatibility 확인 |
| 외부 API/pricing/security 정보가 필요함 | primary source로 현재 사실 확인 |
| vendor signup/purchase가 필요함 | 실행하지 않고 human gate로 기록 |

## Decision Question

조사 전에 아래 내용을 짧게 고정합니다.

- decision question
- context
- must-have constraints
- nice-to-have preferences
- out of scope
- decision owner

질문이 여러 개면 가장 blocking한 하나만 먼저 다룹니다. 예를 들어 "DB와 auth provider를 고르자"는 두 질문이므로 분리합니다.

## Evidence 기준

- official docs, standards, release notes, source repository, vendor pricing/security page를 primary source로 봅니다.
- 블로그, benchmark, community 글은 보조 근거로만 사용합니다.
- model/API/pricing/dependency/security/license/platform support처럼 변할 수 있는 정보는 현재 source를 확인합니다.
- 확인하지 못한 정보는 `Unknown` 또는 `Needs verification`으로 남깁니다.
- ADR에는 source link, 확인 날짜, 관련 version 또는 문서 위치를 남깁니다.

## Option 비교 기준

| 기준 | 질문 |
| --- | --- |
| Fit | product goal과 current architecture에 맞는가 |
| Tradeoff | 무엇을 얻고 무엇을 포기하는가 |
| Risk | security, reliability, lock-in, operations 위험은 무엇인가 |
| Cost | money, complexity, maintenance, learning cost는 어떤가 |
| Migration | 기존 코드와 데이터에 어떤 영향을 주는가 |
| Reversal | 선택을 되돌리기 쉬운가 |
| Verification | 선택이 맞는지 어떤 spike/check로 확인할 수 있는가 |

명백히 부적합한 option은 긴 비교표에 넣지 않고 제외 이유만 남깁니다.

## ADR 초안

권장 경로는 `.agent/wiki/decisions/NNNN-<slug>.md`입니다.

필수 항목:

- title
- `Status: Proposed`
- date
- owner
- decision question
- context
- constraints
- options considered
- recommendation
- why this could be wrong
- validation plan
- impact on recipe
- sources

승인된 ADR은 append-only입니다. 기존 결정과 충돌하면 기존 파일을 조용히 수정하지 않고 supersession ADR 후보를 제안합니다.

## Loop Recommendation

- 제품 목표와 성공 기준이 불명확하면 `recipe`에서 alignment 질문을 먼저 진행합니다.
- 기능 scope와 acceptance를 확정해야 하면 `recipe`로 보냅니다.
- 구현 중 작은 spike가 필요하면 `cook`의 bounded task로 넘깁니다.
- 선택이 승인되고 spec 작성이 가능하면 `recipe`로 돌아갑니다.

## 검증 포인트

`forage` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/forage/SKILL.md
test -f plugins/vibe-recipe/docs/skills/FORAGE.md
grep -q 'Decision question' plugins/vibe-recipe/skills/forage/SKILL.md
grep -q 'Status: Proposed' plugins/vibe-recipe/skills/forage/SKILL.md
plugins/vibe-recipe/scripts/build-universal-agents-md.sh /tmp/vibe-recipe-AGENTS.md
grep -q 'forage (research)' /tmp/vibe-recipe-AGENTS.md
```

스크립트나 JSON을 함께 수정했다면 해당 파일에는 별도 문법 검증을 실행합니다.
