// Sample comments. A prototype can come with a few (sample-comments.json
// beside its prototype.json), so the viewer has something to show the first
// time it is opened on someone's own computer. They are put in once and kept
// in this browser like comments made here. Never on Sites: there, comments
// are real people's.

import { engine } from './engine.js';
import { sampleDocuments } from './model.js';
import { remembered } from './store.js';

const proto = () => engine.prototypes().proto;
const samples = () => proto()?.samples ?? [];
const added = () => `samples:${proto().name}`;

export const hasSamples = () => Boolean(engine.comments()?.local()) && samples().length > 0;

const put = () => engine.comments().addAll(sampleDocuments(samples(), { proto: proto().name }));

export function addSamplesOnce() {
  if (!hasSamples() || remembered.get(added())) return;
  remembered.set(added(), '1');
  put();
}

/** Back to the sample comments alone: everything said here about this prototype goes. */
export async function resetSamples() {
  await engine.comments().clear();
  remembered.set(added(), '1');
  await put();
}
