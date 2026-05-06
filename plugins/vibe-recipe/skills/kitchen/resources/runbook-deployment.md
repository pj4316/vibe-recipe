# 배포 런북

Deployment는 사람 승인이 필요합니다.

1. `taste` report가 `Release readiness: Ready for Wrap`인 active spec을 확인합니다.
2. `wrap/bump`로 release set을 만들고 version/changelog를 준비합니다.
3. `serve/release` pre-flight gate를 실행합니다.
4. local tag 성공 뒤 release set에 포함된 spec만 `.agent/spec/done/`으로 닫혔는지 확인합니다.
5. tag, changelog, clean tree를 확인합니다.
6. 명시적 사람 승인 이후에만 push 또는 deploy합니다.
