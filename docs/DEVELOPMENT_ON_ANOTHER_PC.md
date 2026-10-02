# 회사와 집에서 이어서 개발하기

## 집 PC 첫 준비
Git, Node.js 24 LTS 계열(프로젝트 최소 22.13), Codex를 설치하고 본인 GitHub/ChatGPT 계정으로 로그인한다. DB 통합 테스트를 실행할 때만 Docker가 추가로 필요하다.

터미널에서:

    git clone https://github.com/gyulsangja/daegwangchurch-project.git
    cd daegwangchurch-project
    npm ci

저장소는 사용자 선택에 따라 Public이다. clone은 로그인 없이 가능하며, 변경사항을 push할 때는 본인 GitHub 로그인이 필요하다. npm ci는 생성 클라이언트를 만들지만 운영 DB migration/seed는 실행하지 않는다.

## 환경변수
PowerShell 예시:

    Copy-Item apps/website/.env.example apps/website/.env.local
    Copy-Item apps/admin/.env.example apps/admin/.env.local
    Copy-Item apps/mobile/.env.example apps/mobile/.env.local
    Copy-Item packages/database/.env.example packages/database/.env

실제 연결값은 별도로 입력한다. 이미 파일이 있으면 덮어쓰지 않는다. 회사 PC의 .env는 GitHub로 전송하지 않는다. 본인만 접근 가능한 암호관리 도구 등으로 전달하고 채팅/커밋에 비밀값을 붙여넣지 않는다. DB 연결 전에는 홈페이지 기본 화면을 볼 수 있지만 실제 데이터·로그인·발행은 설정이 필요하다.

각각 다른 터미널:

    npm run dev:website
    npm run dev:admin
    npm run dev:mobile

홈페이지 http://localhost:3000, 관리자 http://localhost:3001/admin. 모바일 API는 관리자 서버를 바라본다. 실기기는 PC의 접근 가능한 주소가 필요하다. API는 APP_PUBLICATION_ENABLED 설정과 DB migration, APP 발행 데이터가 준비돼야 응답한다.

## 두 PC 왕복
작업 시작 전 git status로 미커밋 변경을 확인하고 깨끗할 때 git pull --ff-only를 한다. 변경이 남아 있으면 먼저 검토하여 커밋하고 동기화한다. 작업 종료 시 git diff 확인 → git add → git commit → git push 순서로 저장한다. 집과 회사에서 서로 다른 변경을 만들었다면 강제 push나 reset으로 없애지 말고 충돌을 검토한다.

예시:

    git status
    git pull --ff-only
    # 작업 후
    git add .
    git commit -m "Describe the change"
    git push

## Codex 대화와 작업 맥락
집에서 clone한 폴더를 Codex 프로젝트로 열고 docs/HANDOFF.md의 이어받기 문장을 입력한다. 같은 프로젝트 파일과 결정사항을 읽고 새 대화에서 계속 개발할 수 있다. GitHub는 코드와 이 문서들을 옮기며, 로컬 Codex 대화 자체를 자동으로 옮기지는 않는다.

원래 대화를 그대로 열려면 지원되는 앱에서 Settings → Connections → Control other devices를 통해 같은 계정의 회사 PC를 연결하는 방법이 있다. 회사 PC가 켜져 있고 앱과 네트워크가 유지돼야 한다. 이는 회사 PC에서 작업하는 원격 방식이다. 지원되는 연결 호스트와 같은 Git 프로젝트가 등록돼 있으면 대화 하단 실행 위치의 Hand off로 대화/Git 상태를 호스트 간 넘기는 기능도 있다. 기능 노출은 앱 버전/계정에 따라 달라질 수 있다. 현재 채팅은 프로젝트 없는 작업 폴더에서 시작했으므로 해당 저장소와 매칭되는 프로젝트 등록 여부를 먼저 확인해야 한다.

회사를 끄고 집 PC에서 독립 작업할 때는 clone + 프로젝트 문서 방식이 가장 단순하다. 이 문서는 원본 대화 전문을 대체하는 작업 요약이다.

공식 안내: https://learn.chatgpt.com/docs/remote-connections
