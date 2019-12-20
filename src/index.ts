import * as rx from 'rxjs';
import * as rxop from 'rxjs/operators';
import * as $ from 'jquery';
import './app.scss';

// util functions
const dateFormat = (counter: number) => {
  const millis = counter % 1000;
  const ss = ~~(counter / 1000) % 60;
  const mm = ~~(counter / 1000 / 60) % 60;
  const hh = ~~(counter / 1000 / 60 / 60);
  return `${hh}:${mm}:${ss}`;
};

const updateTimer = (elapsed: number) => $('#timer').html(dateFormat(elapsed));

const enum Command {
  Play,
  Pause,
  Stop,
  Reset
}

interface Counter {
  count: number;
}

const fromEventMapTo = (id: string, cmd: Command) =>
  rx.fromEvent($(id), 'click').pipe(rxop.mapTo(cmd));
const command$ = rx.merge(
  fromEventMapTo('#play', Command.Play),
  fromEventMapTo('#stop', Command.Stop),
  fromEventMapTo('#reset', Command.Reset)
);

const delta = 5;
const counter$ = command$.pipe(
  rxop.startWith(Command.Reset),
  rxop.switchMap((cmd: Command) => {
    if (cmd === Command.Play)
      return rx.interval(delta).pipe(rxop.map(x => [x, cmd]));
    if (cmd === Command.Reset) return rx.of([0, cmd]);
    return rx.NEVER;
  }),
  rxop.scan(
    (prev: Counter, [_, cmd]: [number, Command]) => ({
      ...prev,
      count: cmd === Command.Reset ? 0 : prev.count + delta
    }),
    { count: 0 }
  ),
  rxop.map(x => x.count)
);

counter$.subscribe((x: any) => updateTimer(x));
