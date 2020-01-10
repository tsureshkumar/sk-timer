declare module '*.scss' {
  const content: any;
  export default content;
}

declare interface String {
  log(...args: any[]): void;
}
