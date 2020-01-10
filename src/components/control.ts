import * as rx from 'rxjs';
import {
  tap,
  map,
  startWith,
  endWith,
  debounce,
  withLatestFrom,
  scan,
  pluck,
  mergeScan,
  flatMap,
  mergeMap,
  switchMap,
  switchMapTo,
  take,
  takeUntil,
  takeWhile,
  delay,
  catchError,
  last,
  share
} from 'rxjs/operators';
import * as $ from 'jquery';
import * as moment from 'moment';
import { sprintf } from 'sprintf-js';
import { logWith, taplog } from '../logger';

import '../app.scss';

const enum Command {
  Play,
  Pause,
  Stop,
  Reset
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

interface Control {
  commands$: rx.Observable<Command>;
  cleanup();
}

function setup(control: any): Control {
  interface StateT1 {
    downLoc?: [number, number];
    upLoc?: [number, number];
    movLoc?: [number, number];
    source: any; // start element
    target: any; // target element dropped
    cmd?: Command;
    elapsedTime?: number;
    notified?: boolean; // long press notified
    last?: boolean; // last of timer/mousemove after down
  }
  type StateT = Partial<StateT1>;

  const playUp$ = rx.fromEvent(document, 'mouseup').pipe(
    tap((e: any) => e.preventDefault()),
    map((e: any) => ({ target: e, upLoc: [e.clientX, e.clientY] } as StateT)),
    tap((x: any) => console.log('mouse up', x.upLoc[0], x.upLoc[1]))
  );

  const playMove$ = rx.fromEvent(document, 'mousemove').pipe(
    tap((e: any) => e.preventDefault()),
    map((e: any) => ({ moveLoc: [e.clientX, e.clientY] } as StateT)),
    tap((x: any) => console.log('mouse move'))
  );

  const playDown$ = rx.fromEvent(control, 'mousedown').pipe(
    tap((e: any) => e.preventDefault()),
    map((e: any) => ({ source: e, downLoc: [e.clientX, e.clientY] } as StateT))
  );

  const playDownWithTimer$ = playDown$.pipe(
    switchMap((initialState: StateT) =>
      // merge with timer and mouse up events
      rx.timer(0, 1000).pipe(
        map(
          (x: number) => ({ ...initialState, elapsedTime: x * 1000 } as StateT)
        ),
        withLatestFrom(
          // if no startsWith, clicks display error 'no sequence' for this secuence
          // startWith puts atleast one event
          playMove$.pipe(startWith(initialState), takeUntil(playUp$))
        ),
        map(([t, m]: StateT[]) => ({ ...m, ...t })),
        taplog('timer'),
        takeUntil(playUp$),
        endWith({ last: true })
      )
    ),
    taplog('down with interval')
  );

  // to notify whe button is long pressed
  const longpress$ = new rx.BehaviorSubject(Command.Play);

  const commands$ = playDownWithTimer$.pipe(
    scan(
      (prev: StateT, s: StateT) => {
        if (!s.last) {
          if (!prev.notified && s.elapsedTime > 1000) {
            longpress$.next(longpress(prev.cmd));
            s.notified = true;
            s.cmd = longpress(prev.cmd);
            return s;
          }
          return {
            ...s,
            notified: prev.notified,
            cmd: prev.cmd
          };
        }
        // last
        return {
          ...s,
          notified: false,
          cmd: prev.notified ? prev.cmd : shortpress(prev.cmd)
        };
      },
      { cmd: Command.Stop } // initial state with command
    ),
    switchMap(x => (x.last ? rx.of(x) : rx.NEVER)), // don't send commands until mouseup(last:true)
    map(s => s.cmd),
    taplog('click command')
  );

  // create a fork, one for handling the command and another for displaying next command
  const sharedCommands$ = commands$.pipe(share());
  const nextDisplayCommand$ = rx.merge(
    longpress$,
    sharedCommands$.pipe(map(shortpress))
  );
  // display the next command icon
  const sub = nextDisplayCommand$
    .pipe(
      catchError(e => {
        console.log(e);
        return rx.of(Command.Play);
      })
    )
    .subscribe(c =>
      control.html(`<i class='fas ${status2icon(c)} fa-lg'></li>`)
    );
  return { commands$: sharedCommands$, cleanup: () => sub.unsubscribe() };
}

const control = {
  // display the play controls under the given element
  setup
};

export { Command, setup };
export default control;
