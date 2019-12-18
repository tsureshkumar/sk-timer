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

interface Counter {
  count: number;
  inc: number; // in millis
}

interface Control {
  play: boolean;
  stop: boolean;
}

const enum Command {
  Play,
  Pause,
  Stop,
  Inc,
  Reset
}

const play$ = rx
  .fromEvent(document.getElementById('play'), 'click')
  .pipe(rxop.mapTo(Command.Play));
const stop$ = rx
  .fromEvent(document.getElementById('stop'), 'click')
  .pipe(rxop.mapTo(Command.Stop));
const reset$ = rx
  .fromEvent(document.getElementById('reset'), 'click')
  .pipe(rxop.mapTo(Command.Reset));
const control$ = rx.merge(
  rx.merge(play$, stop$, reset$).pipe(
    rxop.scan((prev: Command, curr: Command) => {
      switch (curr) {
        case Command.Stop:
          return Command.Stop;
        case Command.Play:
          if (prev === Command.Stop) return Command.Play;
          if (prev === Command.Play) return Command.Pause;
          if (prev === Command.Reset) return Command.Stop;
          return Command.Play;
        default:
          return Command.Stop;
      }
    }, Command.Pause),
    rxop.tap((cmd: Command) => {
      switch (cmd) {
        case Command.Play:
          $('#play').html("<i class='fas fa-pause fa-lg'></i>");
          break;
        case Command.Pause:
          $('#play').html("<i class='fas fa-play fa-lg'></i>");
          break;
        case Command.Stop:
          $('#play').html("<i class='fas fa-play fa-lg'></i>");
          break;
        default:
      }
    })
  ),
  reset$
);

const delta = 5;
const switcher$ = control$.pipe(
  rxop.tap((cmd: Command) => console.log(cmd)),
  rxop.switchMap((cmd: Command) =>
    cmd === Command.Play
      ? rx.interval(delta).pipe(rxop.mapTo(Command.Inc))
      : rx.NEVER
  )
);

const stopWatch$ = rx.merge(control$, switcher$).pipe(
  rxop.filter((v: Command) => v === Command.Reset || v === Command.Inc),
  rxop.scan(
    (acc: Counter, curr: Command) => {
      console.log(acc, curr);
      return {
        ...acc,
        count: curr === Command.Reset ? 0 : acc.count + acc.inc
      };
    },
    { count: 0, inc: delta }
  )
);

stopWatch$.subscribe((value: Counter) => {
  console.log('fired', value);
  updateTimer(value.count);
});
