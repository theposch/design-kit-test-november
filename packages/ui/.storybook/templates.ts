/* A short note on what the template is for, shown on its Docs page. */
export function about(purpose: string) {
  return {
    layout: 'fullscreen',
    docs: { description: { component: purpose } },
  } as const;
}
