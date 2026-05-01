# vibe-recipe 플러그인 에이전트 운영 지침

이 저장소의 루트는 `vibe-recipe` Codex 마켓플레이스 카탈로그입니다. 실제 플러그인 패키지는 `plugins/vibe-recipe/`에 있습니다. 작업할 때 루트 카탈로그와 플러그인 패키지의 역할을 혼동하지 마세요.

## 기본 규칙

- 모든 응답, 새 문서, 주석성 설명은 기본적으로 한글로 작성합니다.
- 기존 영어 파일명, 명령어, JSON 키, 플러그인 이름, 스킬 이름, 식별자는 원문을 유지합니다.
- 사용자가 만든 변경을 되돌리지 않습니다. 관련 없는 변경은 그대로 두고, 필요한 범위만 수정합니다.
- 공개 API나 플러그인 인터페이스를 바꾸는 작업은 매니페스트, 문서, 검증 명령의 영향을 함께 확인합니다.
- 이 파일은 루트 저장소 운영 지침입니다. 사용 프로젝트에 복사되는 템플릿 지침은 `plugins/vibe-recipe/templates/AGENTS.md`에서 관리합니다.

## 주요 경로

| 경로 | 목적 |
| --- | --- |
| `.agents/plugins/marketplace.json` | 마켓플레이스 등록 정보 |
| `plugins/vibe-recipe/.codex-plugin/plugin.json` | Codex 플러그인 매니페스트 |
| `plugins/vibe-recipe/skills/` | 스킬 정의 |
| `plugins/vibe-recipe/agents/` | 전문 서브에이전트 문서 |
| `plugins/vibe-recipe/templates/` | 사용 프로젝트에 복사될 템플릿 |
| `plugins/vibe-recipe/scripts/` | 설치와 생성 보조 스크립트 |
| `plugins/vibe-recipe/hooks/` | 플러그인 훅과 훅 설정 |

## 검증 규칙

- 전체 구조, JSON, shell, universal `AGENTS.md` 생성 검증은 루트에서 `make -f Makefile verify`를 실행합니다.
- 개별 shell 스크립트를 수정했다면 관련 파일에 `bash -n <file>`을 우선 실행합니다.
- JSON 파일을 수정했다면 `python3 -m json.tool <file>`로 문법을 확인합니다.
- `plugins/vibe-recipe/scripts/build-universal-agents-md.sh` 또는 스킬/서브에이전트 문서를 수정했다면 universal `AGENTS.md` 생성 검증까지 확인합니다.

## 작업 범위 기준

- 루트 마켓플레이스 등록 변경은 `.agents/plugins/marketplace.json`을 중심으로 확인합니다.
- 플러그인 기능, 스킬, 훅, 템플릿 변경은 `plugins/vibe-recipe/` 아래에서 수행합니다.
- `plugins/vibe-recipe/templates/AGENTS.md`와 `plugins/vibe-recipe/skills/kitchen/resources/AGENTS.md`는 생성 대상 프로젝트용 지침입니다. 루트 운영 규칙을 고치려는 목적만으로 수정하지 않습니다.
- 기존 README와 플러그인 문서는 별도 요청이 없으면 한글화하지 않습니다.

## Git

- 변경 전후로 작업 트리 상태를 확인하고, 관련 없는 사용자 변경은 보호합니다.
- 자동 push는 하지 않습니다.
- 커밋 메시지가 필요할 때는 기존 프로젝트 관례를 우선하고, 별도 관례가 없으면 Conventional Commits를 사용합니다.
