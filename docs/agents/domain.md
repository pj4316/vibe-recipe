# Domain Docs

engineering skills가 이 저장소의 도메인 언어와 결정 기록을 읽는 방식입니다.

## Before exploring, read these

도메인/context 탐색의 1순위는 루트 카탈로그가 아니라 실제 플러그인 패키지인 `plugins/vibe-recipe/`입니다.

- `plugins/vibe-recipe/docs/README.md`
- 작업과 관련된 `plugins/vibe-recipe/docs/skills/*.md`
- agent 동작을 바꾸는 작업이면 `plugins/vibe-recipe/docs/agents/README.md`
- 향후 존재한다면 `plugins/vibe-recipe/CONTEXT.md`
- 향후 존재한다면 `plugins/vibe-recipe/CONTEXT-MAP.md`
- 향후 존재한다면 관련 `plugins/vibe-recipe/docs/adr/`

파일이 없으면 경고하지 말고 조용히 진행합니다. domain glossary나 ADR은 `/grill-with-docs`류 작업에서 용어와 결정이 실제로 정리될 때 lazy하게 생성될 수 있습니다.

## Use the glossary's vocabulary

이슈 제목, 리팩터링 제안, 가설, 테스트 이름에서 도메인 개념을 부를 때는 `CONTEXT.md`에 정의된 용어를 사용합니다. glossary가 명시적으로 피하는 동의어로 바꾸지 않습니다.

필요한 개념이 glossary에 없다면, 프로젝트가 아직 합의하지 않은 언어일 수 있습니다. 이 경우 새 용어를 임의로 고정하지 말고 `/grill-with-docs`로 정리할 후보로 남깁니다.

## Flag ADR conflicts

출력이 기존 ADR과 충돌한다면 조용히 덮어쓰지 말고 명시합니다.

> _Contradicts ADR-0007 (event-sourced orders) - but worth reopening because..._
