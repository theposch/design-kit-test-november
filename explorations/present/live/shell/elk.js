// ELK (elkjs, the Eclipse Layout Kernel) works out the flow diagram: where
// each screen sits and the path each arrow takes (flow-layout.js). It is a
// large file, so the page never waits for it: it is fetched on its own, once.

let loading = null;

/** ELK, ready to lay a graph out. A fetch that failed is tried again the next time it is asked for. */
export function loadElk() {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('../vendor/elk.js', import.meta.url).href;
    script.onload = () => resolve(new window.ELK());
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('ELK did not load'));
    };
    document.head.append(script);
  });
  return loading;
}

/** Fetches ELK once the page has nothing better to do, so the flow view opens without a wait. */
export function warmElk() {
  const whenIdle = window.requestIdleCallback ?? (run => setTimeout(run, 1500));
  whenIdle(() => loadElk().catch(() => {}));
}
