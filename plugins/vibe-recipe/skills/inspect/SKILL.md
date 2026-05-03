---
name: inspect
description: /vr:inspect 또는 /vr:audit 호출 시 사용합니다. dependency, dead code, performance risk, 오래된 spec, release readiness를 정기 점검합니다.
---

# inspect (audit) - 위생 점검

정기 점검, release 전 점검, 또는 프로젝트 상태가 오래되었거나 불안정해 보일 때 사용합니다.

`inspect`는 read-only audit skill입니다. 목적은 현재 프로젝트의 위험 신호를 구조적으로 찾고, release를 막아야 하는 문제와 후속 정리 항목을 분리하는 것입니다. 수정은 하지 않고, 필요한 후속 skill만 추천합니다.

## 시작 조건

- 사용자가 `/vr:inspect`, `/vr:audit`, 정기 점검, release readiness, dependency/security hygiene, dead code, 오래된 spec 점검을 요청했습니다.
- `AGENTS.md`, `.agent/constitution.md`, `.agent/spec/design.md`, `.agent/commands.json`, active/done spec, 최신 taste/wrap/serve report를 필요한 범위에서 읽었습니다.
- 변경 diff를 점검하는 경우 `git status --short`와 관련 diff scope를 확인했습니다.
- dependency/security 정보를 확인할 때는 manifest, lockfile, CI/security config, vendor advisory source를 우선합니다.
- audit scope를 `release-readiness`, `security`, `dependency`, `maintenance`, `performance`, `spec-hygiene` 중 하나 이상으로 정했습니다.

## Audit scope

| Scope | 확인 내용 |
| --- | --- |
| `release-readiness` | latest `taste`, `wrap`, `serve`, `verify`, dirty tree, critical audit finding |
| `security` | secret pattern, unsafe IO, auth/authz, injection, dependency advisory, data-loss risk |
| `dependency` | vulnerable/outdated signal, unsupported runtime, lockfile drift, license/engine mismatch |
| `maintenance` | dead code, generated artifact drift, shallow module, repeated gotcha |
| `performance` | obvious regression signal, algorithmic complexity jump, large bundle/query/workload risk |
| `spec-hygiene` | stale active spec, unused handoff, missing INDEX, abandoned/done mismatch |

## 점검 항목

- dependency vulnerability signal과 중요한 outdated package.
- secret pattern과 안전하지 않은 generated artifact.
- dead code, 사용되지 않는 spec, 6개월 이상 오래된 handoff.
- performance regression 또는 의심스러운 complexity 변화.
- active spec과 review 상태 기준 release readiness.

## Severity

| Severity | 의미 |
| --- | --- |
| `BLOCKER` | release/merge를 막아야 하는 confirmed risk. failing verify, critical security/data-loss risk, human gate bypass, broken release state. |
| `CONCERN` | 바로 막지는 않지만 고쳐야 하는 confirmed risk 또는 strong signal. |
| `SUGGESTION` | cleanup, hardening, documentation, follow-up candidate. |

가능성만 있고 증거가 약한 항목은 `BLOCKER`로 올리지 않습니다. evidence reference, 확인 command, affected surface가 있어야 합니다.

## 흐름

1. Scope: audit scope와 release/readiness 여부를 정합니다.
2. Preflight: git status, command profile, active spec, latest taste/wrap/serve 상태를 확인합니다.
3. Collect: manifest, lockfile, config, runbook, spec/handoff, generated artifact, relevant diff를 읽습니다.
4. Check: scope별 signal을 evidence 중심으로 점검합니다.
5. Delegate: 보안 위험이 있으면 `security-auditor`, acceptance/release evidence가 필요하면 `tester`, 구조 위험이면 `reviewer`를 read-only로 사용합니다.
6. Classify: finding을 `BLOCKER`, `CONCERN`, `SUGGESTION`으로 분류하고 중복을 합칩니다.
7. Recommend: 각 finding에 `fix`, `tidy`, `recipe`, `wrap`, `serve`, `kitchen`, `librarian` 중 다음 skill을 붙입니다.
8. Report: audit report를 최종 응답에 남기고, 사용자가 요청했거나 release gate 근거가 필요하면 `.agent/spec/handoffs/NNNN-inspect.md`에 저장합니다.

## Subagent 사용

- `security-auditor`: auth, secret, injection, unsafe IO, dependency, data-loss 위험을 점검합니다.
- `tester`: release readiness, verify/e2e/manual coverage gap을 확인합니다.
- `reviewer`: maintainability, dead code, local convention, architecture drift를 봅니다.
- `red-team`: abuse, replay, race, boundary, automation risk가 audit scope에 포함될 때만 사용합니다.

모든 subagent는 read-only입니다. finding은 severity, affected surface, evidence reference, recommendation만 반환하게 합니다.

## 산출물

finding을 BLOCKER, CONCERN, SUGGESTION으로 나눈 audit report를 작성합니다. archival 후보는 제안만 하고 사람 승인 없이 archive하지 않습니다.

```markdown
# Inspect Report
Status: pass / concern / blocked
Scope:

## Inputs
- Git state:
- Command profile:
- Spec/release state:
- Sources checked:

## Findings
### BLOCKER
- [scope] Finding:
  Evidence:
  Affected surface:
  Recommended next skill:

### CONCERN

### SUGGESTION

## Release readiness
- Latest taste:
- Verify:
- Critical audit finding:
- Decision:

## Not checked
- Item:
- Reason:
```

## Loop recommendation

| 상황 | 다음 skill |
| --- | --- |
| confirmed bug, failing check, vulnerable code path | `fix` |
| 동작 변경 없는 구조/cleanup/dead code 정리 | `tidy` |
| scope, acceptance, product decision 문제 | `recipe` |
| harness, command profile, generated instruction 문제 | `kitchen` |
| stale index, memory, archived/done 정리 | `librarian` |
| version/changelog/release prep 문제 | `wrap` |
| release gate와 local tag만 남음 | `serve` |

## 완료 조건

- audit scope가 명확합니다.
- 확인한 source와 확인하지 않은 항목이 분리되어 있습니다.
- finding이 severity, evidence, affected surface, next skill을 갖습니다.
- release readiness를 물은 경우 pass/concern/blocked 판단이 있습니다.
- archival/deletion/cleanup은 제안만 하고 수행하지 않았습니다.

## 경계

deploy, tag, push를 하지 않습니다. changelog는 `wrap`의 책임이므로 수정하지 않습니다.

product code, test, generated artifact, spec status, ADR status를 수정하지 않습니다. secret value나 private data를 출력하지 않습니다.
