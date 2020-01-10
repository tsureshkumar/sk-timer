import * as rx from 'rxjs';
import * as rxop from 'rxjs/operators';
import $ from 'jquery';
import moment from 'moment';
import { sprintf } from 'sprintf-js';
import './app.scss';
import control, { Command } from './components/control';
import stopwatch$ from './components/stopwatch';

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

const { commands$ } = control.setup($('#play'));

// stopwatch$(commands$)
//  .pipe(rxop.catchError(e => rx.of(e)))
//  .subscribe((c: Error | number) => {
//    if (<Error>c !== undefined) console.log(c as Error);
//    else updateTimer(c as number);
//  });

stopwatch$(commands$).subscribe((c: number) => {
  updateTimer(c);
});
