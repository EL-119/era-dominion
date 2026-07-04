# Era Dominion 3D v30 Black Screen Fix

GitHub/Vercel 단일 파일 업로드용 버전입니다.

업로드 파일:
- index.html
- README.md

변경 사항:
- v29에서 게임 시작 후 검정화면으로 멈출 수 있던 JS 문법 오류 수정
- 버튼 fallback이 startGame을 호출할 수 있도록 window.startGame 노출
- 게임 시작, 홈, 다시 시작, 일시정지 관련 함수 노출 보정
- 플레이어/적 리더 GLB 모델은 index.html 내부 포함 구조 유지
- 일반 NPC/추종자는 가벼운 모델 유지
- 건물/나무/상점/분수 충돌 반경을 줄여 길막힘 완화

배포 방법:
1. GitHub 저장소에 index.html과 README.md만 업로드합니다.
2. assets 폴더는 필요 없습니다.
3. Vercel에서 재배포 후 새로고침하여 확인합니다.
