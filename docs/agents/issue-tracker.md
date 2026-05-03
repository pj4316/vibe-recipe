# Issue tracker: GitHub

이 저장소의 이슈와 PRD는 GitHub Issues에서 관리합니다. 모든 이슈 트래커 작업은 저장소 루트에서 `gh` CLI를 사용합니다.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. 여러 줄 본문은 heredoc을 사용합니다.
- **Read an issue**: `gh issue view <number> --comments`. 필요한 경우 `--json`과 `jq`로 라벨과 댓글을 함께 확인합니다.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`. 필요에 따라 `--label`, `--state` 필터를 추가합니다.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `gh issue edit <number> --remove-label "..."`
- **Close an issue**: `gh issue close <number> --comment "..."`

저장소는 `git remote -v`에서 추론합니다. `gh`는 clone 내부에서 실행하면 현재 GitHub 저장소를 자동으로 사용합니다.

## When a skill says "publish to the issue tracker"

GitHub issue를 생성합니다.

## When a skill says "fetch the relevant ticket"

`gh issue view <number> --comments`를 실행합니다.
