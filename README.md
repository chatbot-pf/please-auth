# template

열정팩토리에서 사용하는 기본 템플릿입니다.


## 시작하기

### Git Hooks 설정

[mise](https://mise.jdx.dev/)를 사용하여 Git hooks를 관리합니다.

> [mise](https://mise.jdx.dev/getting-started.html)가 설치되어 있어야 합니다. `mise install`로 bun 등 필요한 도구가 자동으로 설치됩니다.

```bash
mise trust
mise install
mise run setup
```

`mise run setup`은 `bun install`로 의존성을 설치한 후, `commit-msg` hook을 설치하여 커밋 시 [commitlint](https://commitlint.js.org/)가 자동으로 실행됩니다.


## Claude Code 설정

1. 프로젝트 디렉토리에서 Claude Code를 실행합니다:

```bash
claude
```

2. 설정 스킬을 실행하여 이 프로젝트에 맞게 Claude Code를 구성합니다:

```
/claude-code-setup:claude-code-setup
```

기술 스택을 자동으로 감지하고, 플러그인을 추천하며, 최적의 설정으로 `.claude/settings.json`을 생성합니다.


## 도구

- [Cubic](https://www.cubic.dev/)
- [SonarCloud](https://sonarcloud.io/)


## 참조

- [engineering-standards](https://github.com/chatbot-pf/engineering-standards/)
- [claude-code-plugins](https://github.com/pleaseai/claude-code-plugins)
- [code-intelligence](https://github.com/chatbot-pf/code-intelligence)
- [code-style](https://github.com/pleaseai/code-style)
- [release-please-action](https://github.com/googleapis/release-please-action)
- [commitlint](https://commitlint.js.org/)
