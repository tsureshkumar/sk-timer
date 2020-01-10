import * as rx from 'rxjs';
import { tap } from 'rxjs/operators';
// Object.assign(String.prototype, {
//   log(...args: Object[]) {
//     console.log(this, ...args);
//   }
// });

String.prototype.log = (x: string, ...args: any[]) => {
  console.log(args, x);
  const s = x;
  console.log(`${s}`, ...args);
};

const consoleWith = (...args: any[]) => (...args2: any[]) =>
  console.log(...args, ...args2);

const taplog = <T>(...args: any[]): rx.MonoTypeOperatorFunction<T> =>
  tap((y: T) => console.log(...args, y));

export { consoleWith as logWith };
export { taplog };
export default console;
