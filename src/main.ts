/**
 * Highfell. Boots the app into the hearth. Everything else hangs off App.
 */
import { App } from './ui/app';

const app = new App(document.getElementById('app')!);
void app.boot();
(window as unknown as { highfell: App }).highfell = app;
