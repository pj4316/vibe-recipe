# Inspect 동작 문서

`inspect`는 정기 점검, release 전 점검, dependency/security hygiene, dead code, 오래된 spec 상태를 확인하는 read-only audit skill입니다. 사용자는 `/vr:inspect` 또는 개발자 alias `/vr:audit`로 호출할 수 있습니다.

`inspect`는 코드를 고치거나 release를 진행하지 않습니다. 위험을 찾고 severity를 분류한 뒤 후속 skill을 추천합니다.

## 목표

- audit scope를 `release-readiness`, `security`, `dependency`, `maintenance`, `performance`, `spec-hygiene` 중 하나 이상으로 정합니다.
- evidence 중심으로 risk signal을 확인합니다.
- finding을 `BLOCKER`, `CONCERN`, `SUGGESTION`으로 분류합니다.
- release readiness 질문에는 `pass`, `concern`, `blocked` 판단을 남깁니다.
- archival, cleanup, deletion 후보는 제안만 하고 사람 승인 없이 수행하지 않습니다.

## Audit Scope

| Scope | 확인 내용 |
| --- | --- |
| `release-readiness` | latest `taste`, `wrap`, `serve`, `verify`, dirty tree, critical audit finding |
| `security` | secret pattern, unsafe IO, auth/authz, injection, dependency advisory, data-loss risk |
| `dependency` | vulnerable/outdated signal, unsupported runtime, lockfile drift, license/engine mismatch |
| `maintenance` | dead code, generated artifact drift, shallow module, repeated gotcha |
| `performance` | obvious regression signal, complexity jump, bundle/query/workload risk |
| `spec-hygiene` | stale active spec, unused handoff, missing INDEX, abandoned/done mismatch |

## Severity

| Severity | 의미 |
| --- | --- |
| `BLOCKER` | release/merge를 막아야 하는 confirmed risk |
| `CONCERN` | 바로 막지는 않지만 고쳐야 하는 confirmed risk 또는 strong signal |
| `SUGGESTION` | cleanup, hardening, documentation, follow-up candidate |

추측만으로 `BLOCKER`를 만들지 않습니다. `BLOCKER`에는 evidence reference, affected surface, release/merge를 막아야 하는 이유가 필요합니다.

## 흐름

1. Scope: audit scope와 release readiness 여부를 정합니다.
2. Preflight: git status, command profile, active spec, latest taste/wrap/serve 상태를 확인합니다.
3. Collect: manifest, lockfile, config, runbook, spec/handoff, generated artifact, relevant diff를 읽습니다.
4. Check: scope별 signal을 evidence 중심으로 점검합니다.
5. Delegate: 필요한 경우 read-only subagent를 사용합니다.
6. Classify: finding을 `BLOCKER`, `CONCERN`, `SUGGESTION`으로 분류합니다.
7. Recommend: 각 finding에 다음 skill을 붙입니다.
8. Report: audit report를 최종 응답에 남깁니다.

## Subagent 연계

| Subagent | 사용 시점 |
| --- | --- |
| `security-auditor` | auth, secret, injection, unsafe IO, dependency, data-loss 위험 |
| `tester` | release readiness, verify/e2e/manual coverage gap |
| `reviewer` | maintainability, dead code, convention, architecture drift |
| `red-team` | abuse, replay, race, boundary, automation risk |

모든 subagent는 read-only입니다. 제품 코드, test, generated artifact, spec status, ADR status를 수정하지 않습니다.

## Report 필수 항목

- status: `pass`, `concern`, `blocked`
- audit scope
- inputs: git state, command profile, spec/release state, sources checked
- `BLOCKER`, `CONCERN`, `SUGGESTION` findings
- finding별 evidence, affected surface, recommended next skill
- release readiness 판단
- not checked 항목과 이유

사용자가 요청했거나 release gate 근거가 필요하면 `.agent/spec/handoffs/NNNN-inspect.md`에 저장할 수 있습니다.

## Loop Recommendation

- confirmed bug, failing check, vulnerable code path는 `fix`로 보냅니다.
- 동작 변경 없는 구조/cleanup/dead code 정리는 `tidy`로 보냅니다.
- scope, acceptance, product decision 문제는 `recipe`로 보냅니다.
- harness, command profile, generated instruction 문제는 `kitchen`으로 보냅니다.
- stale index, memory, archive 정리는 `librarian`으로 보냅니다.
- version/changelog/release prep 문제는 `wrap`으로 보냅니다.
- release gate와 local tag만 남았으면 `serve`로 보냅니다.

## 검증 포인트

`inspect` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/inspect/SKILL.md
test -f plugins/vibe-recipe/docs/skills/INSPECT.md
grep -q 'Inspect Report' plugins/vibe-recipe/skills/inspect/SKILL.md
grep -q 'release-readiness' plugins/vibe-recipe/skills/inspect/SKILL.md
plugins/vibe-recipe/scripts/build-universal-agents-md.sh /tmp/vibe-recipe-AGENTS.md
grep -q 'inspect (audit)' /tmp/vibe-recipe-AGENTS.md
```

스크립트나 JSON을 함께 수정했다면 해당 파일에는 별도 문법 검증을 실행합니다.
