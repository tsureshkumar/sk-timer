import * as rx from 'rxjs';
import * as rxop from 'rxjs/operators';
import * as $ from 'jquery';
import moment from 'moment';
import '../app.scss';
import control, { Command } from './control';

interface Counter {
  count: number;
  start: any;
  elapsed: number;
}

// when commands change run the stopwatch
// sequence of ticks in response to user commands on click button
const delta = 1000 / 40;
const stopwatch$ = commands$ => {
  return commands$.pipe(
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
        start: cmd === Command.Reset ? new Date() : prev.start
      }),
      { count: 0, start: moment(), elapsed: 0 }
    ),
    rxop.map((x: Counter) => x.count)
  );
};

export default stopwatch$;
