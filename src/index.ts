import * as rx from 'rxjs';
import * as rxop from 'rxjs/operators';
import * as $ from 'jquery';
import * as moment from 'moment';
import { sprintf } from 'sprintf-js';
import './app.scss';

// util functions
const dateFormat = (counter: number, options = { showMillis: true }) => {
  const millis = counter % 1000;
  const ss = ~~(counter / 1000) % 60;
  const mm = ~~(counter / 1000 / 60) % 60;
  const hh = ~~(counter / 1000 / 60 / 60);
  const res = sprintf(
    "<span class='hh'>%02d</span>&nbsp;<span class='mm'>%02d</span>&nbsp;<span class='ss'>%02d</spann>",
    hh,
    mm,
    ss
  );
  return options.showMillis
    ? sprintf("%s&nbsp;<sub class='millis'>%03d</sub>", res, millis)
    : res;
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
  start: any;
  elapsed: number;
}

// translate states when pressed
const shortpress = (prev: Command): Command => {
  switch (prev) {
    case Command.Play:
      return Command.Pause;
    case Command.Pause:
    case Command.Stop:
    case Command.Reset:
      return Command.Play;
    default:
      return prev;
  }
};

// translate states when pressed for long
// always translates from next possible command
const longpress = (prev: Command) => {
  switch (shortpress(prev)) {
    case Command.Play:
    case Command.Stop:
      return Command.Reset;
    case Command.Pause:
      return Command.Stop;
    default:
      return prev;
  }
};

// which icon to display in control bar
const status2icon = (s: Command) => {
  switch (s) {
    case Command.Play:
      return 'fa-play';
    case Command.Pause:
      return 'fa-pause';
    case Command.Stop:
      return 'fa-stop';
    case Command.Reset:
      return 'fa-power-off';
    default:
      return 'fa-play';
  }
};

const playUp$ = rx.fromEvent($('#play'), 'mouseup');
const playDown$ = rx.fromEvent($('#play'), 'mousedown');

// subject for display temporary control on long press
const longpress$ = new rx.BehaviorSubject(5);

// sequence of commands when user keeps the mouse button down
const nextCommand$ = (cmd: Command) =>
  rx.of(cmd).pipe(
    rxop.mergeScan(
      ([pa, prev]: [number, Command], curr: Command) => {
        return rx.interval(300).pipe(
          rxop.scan((a, _) => a + 300, 0),
          rxop.map(a => [a, prev]),
          rxop.takeUntil(playUp$)
        );
      },
      [0, cmd]
    ),
    rxop.map(
      ([a, prev]: [number, Command]) =>
        a > 2000 ? longpress(prev) : shortpress(prev) // more than 2 seconds pressed, change the command
    ),
    rxop.distinctUntilChanged(),
    rxop.tap(x => longpress$.next(x)),
    rxop.last()
  );

// sequence of commands when user does mousedown and up.
const commands$ = playDown$.pipe(
  rxop.mapTo(Command.Stop),
  rxop.mergeScan((prev: Command, curr: Command) => {
    return nextCommand$(prev);
  }, Command.Stop)
);
const sharedCommands$ = commands$.pipe(rxop.share());

// when commands changenge, update the control button
rx.merge(
  longpress$,
  sharedCommands$.pipe(rxop.map(x => shortpress(x)))
).subscribe(c =>
  $('#play').html(`<i class='fas ${status2icon(c)} fa-lg'></li>`)
);

// when commands change run the stopwatch
// sequence of ticks in response to user commands on click button
const delta = 100;
const stopwatch$ = sharedCommands$.pipe(
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
      count: cmd === Command.Reset ? 0 : prev.count + delta,
      start: cmd === Command.Reset ? new Date() : prev.start,
      elapsed: cmd === Command.Reset ? 0 : moment().diff(prev.start)
    }),
    { count: 0, start: moment(), elapsed: 0 }
  ),
  rxop.map(x => x.count)
);

stopwatch$.subscribe((x: any) => updateTimer(x));
