// Conventional Commits + restrições do time.

const noCoAuthoredByPlugin = {
  rules: {
    'no-co-authored-by': ({ raw }) => [
      !/^Co-Authored-By:/im.test(raw),
      'Commits do FoodLoop não usam o trailer Co-Authored-By. Remova a linha antes de commitar.',
    ],
  },
};

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [noCoAuthoredByPlugin],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'build', 'ci', 'revert'],
    ],
    'header-max-length': [2, 'always', 100],
    'subject-case': [0],
    'body-max-line-length': [0],
    'no-co-authored-by': [2, 'always'],
  },
  ignores: [(message) => /^Merge (pull request|branch|remote-tracking branch)/.test(message)],
  defaultIgnores: true,
};
