# cli-tool domain preset

- glossary depth:
  - command surface, user intent, side-effect boundary를 설명할 수 있는 실용 깊이
  - input, output, dry-run, destructive path 용어를 우선 정리
- role/state style:
  - operator, automation caller, local environment actor를 구분
  - command result, validation failure, partial success/failure 상태를 명시
- domain tone:
  - task-oriented, operator-facing, execution-aware
- vocabulary priorities:
  - subcommand와 flag 이름이 실제 사용자 의도와 맞는지 먼저 확인
  - shell/process/filesystem detail은 domain intent와 분리해서 서술
- default warning:
  - implementation detail이나 함수 이름을 그대로 사용자 용어로 쓰지 않음
  - 로그 문구와 domain term을 섞어 같은 상태를 여러 이름으로 부르지 않음
