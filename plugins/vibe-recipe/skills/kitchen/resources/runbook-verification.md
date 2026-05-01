# 검증 런북

`.agent/commands.json`의 `verify` command를 project-wide gate로 사용합니다.

## Merge 전

1. 변경된 surface에 대한 focused test를 실행합니다.
2. project verify command를 실행합니다.
3. 실행한 command와 결과를 handoff에 기록합니다.

## Verification 실패 시

1. 처음 실패한 command를 기록합니다.
2. 동작이 깨졌다면 `fix/debug`를 사용합니다.
3. acceptance criteria가 잘못되었다면 `recipe/plan`을 사용합니다.
