# backend-service domain preset

- glossary depth:
  - business workflow와 integration boundary를 함께 설명하는 중간 이상 깊이
  - request, job, resource, policy 용어를 구분해 기록
- role/state style:
  - human actor, system actor, downstream integration role을 분리
  - lifecycle state, retry/failure state, approval/validation state 이름을 명시
- domain tone:
  - operational, policy-heavy, interface-aware
- vocabulary priorities:
  - HTTP/API, queue, storage 용어보다 business intent를 먼저 드러내는 이름 사용
  - transport DTO, ORM entity, external payload 이름을 domain language와 분리
- default warning:
  - CRUD 명사만 반복해서 도메인 용어집을 채우지 않음
  - endpoint path, table name, vendor field name을 그대로 ubiquitous language로 승격하지 않음
