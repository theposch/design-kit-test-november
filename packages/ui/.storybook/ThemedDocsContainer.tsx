import { DocsContainer } from '@storybook/addon-docs/blocks';
import { useEffect, useState, type ComponentProps } from 'react';
import { themes } from 'storybook/theming';

/*
 * Docs pages paint their own chrome from a Storybook theme, so the `.dark`
 * class flip that drives the tokens leaves the docs canvas light. Watch the
 * class withThemeByClassName writes to <html> and mirror it into the docs
 * theme, keeping that class the single mode switch.
 */
export function ThemedDocsContainer(
  props: ComponentProps<typeof DocsContainer>,
) {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark')),
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);
  return <DocsContainer {...props} theme={dark ? themes.dark : themes.light} />;
}
