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
  Play = 1,
  Pause = 0,
  Stop = 0
}

const play$ = rx
  .fromEvent(document.getElementById('play'), 'click')
  .pipe(rxop.mapTo(Command.Play));
const stop$ = rx
  .fromEvent(document.getElementById('stop'), 'click')
  .pipe(rxop.mapTo(Command.Stop));
const control$ = rx.merge(
  rx.merge(play$, stop$).pipe(
    rxop.scan((prev: Command, curr: Command) => {
      switch (curr) {
        case Command.Stop:
          return Command.Stop;
        case Command.Play:
          if (prev === Command.Stop) return Command.Play;
          if (prev === Command.Play) return Command.Pause;
          return Command.Play;
        default:
          return Command.Stop;
      }
    }, Command.Pause),
    rxop.map((cmd: Command) => cmd === 1),
    rxop.tap((x: boolean) => console.log(x)),
    rxop.map((x: boolean) => ({ play: x }))
  )
);

const stopWatch$ = control$.pipe(
  rxop.tap((state: Control) => console.log(state)),
  rxop.switchMap((control: Control) =>
    control.play ? rx.interval(1000) : rx.NEVER
  ),
  rxop.scan(
    (acc: Counter, curr: number) => {
      console.log(acc, curr);
      return {
        ...acc,
        count: acc.count + acc.inc
      };
    },
    { count: 0, inc: 1000 }
  ),
  rxop.tap((state: Counter) => {
    console.log('fired', state);
    updateTimer(state.count);
  })
);

stopWatch$.subscribe();
