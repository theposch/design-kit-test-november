/*
 * A tripwire for mechanical comments (narration, port diary), not full
 * coverage: the pattern list stays short and low-false-positive on purpose,
 * and the whole plugin is deletable per engagement. The affirmative rule
 * lives in CLAUDE.md's Comments section.
 */

const bannedPatterns = [
  /\bported from/i,
  /same as (?:before|above)/i,
  /as mentioned (?:above|earlier)/i,
  /this (?:line|function|file) (?:does|is|handles)/i,
];

export default {
  meta: { name: 'comment-hygiene' },
  rules: {
    'no-mechanical-comments': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Comments must state a constraint or reason the code cannot show — never narrate the code or diary a port',
        },
        schema: [],
        messages: {
          mechanical:
            'Mechanical comment: state a constraint or reason the code cannot show, or delete it (see Comments in CLAUDE.md).',
        },
      },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              if (
                bannedPatterns.some((pattern) => pattern.test(comment.value))
              ) {
                context.report({ loc: comment.loc, messageId: 'mechanical' });
              }
            }
          },
        };
      },
    },
  },
};
