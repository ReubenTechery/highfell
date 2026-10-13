/**
 * Highfell. Boots the app into the hearth. Everything else hangs off App.
 * When a new version of the page arrives while it is open, the viewer swaps it in and hands back
 * what `snapshot` saved (the open panel); progress itself is always in the save.
 */
import { App } from './ui/app';

type Hot = { snapshot?: (fn: () => unknown) => void; ready?: (start: (data: any) => void) => void; data?: any };
const hot = (window as unknown as { claude?: { hot?: Hot } }).claude?.hot;
const app = new App(document.getElementById('app')!);
(window as unknown as { highfell: App }).highfell = app;
hot?.snapshot?.(() => app.snapshot());
const start = (data: any) => { void app.boot(data && typeof data === 'object' ? data : {}); };
if (hot?.ready) hot.ready(start); else start(hot?.data ?? {});
