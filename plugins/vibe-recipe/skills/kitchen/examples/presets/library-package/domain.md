# library-package domain preset

- glossary depth:
  - public API 개념, consumer mental model, compatibility boundary를 설명하는 깊이
  - export surface와 내부 구현 용어를 구분
- role/state style:
  - library consumer, optional framework bridge, maintainer 관점을 구분
  - input contract, invalid usage, compatibility or versioning state를 명시
- domain tone:
  - API-clarity-first, consumer-facing, compatibility-aware
- vocabulary priorities:
  - public type/function/class 이름이 domain language의 기준이 되도록 정리
  - adapter/bridge가 있으면 framework 용어와 core concept를 분리
- default warning:
  - internal module name이나 file layout을 그대로 public domain language로 노출하지 않음
  - convenience overload 때문에 핵심 개념 이름이 흐려지지 않게 함
