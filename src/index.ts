import * as PIXI from 'pixi.js';
import * as rx from 'rxjs';
import * as $ from 'jquery';
import './app.scss';

const app: PIXI.Application = new PIXI.Application({
  transparent: true,
  height: 300,
});
let message: PIXI.Text = null;

function setup(counter: any) {
  $('#container').append(app.view);
  function resize() {
    app.renderer.view.style.position = 'absolute';
    app.renderer.view.style.left =
      ((window.innerWidth - app.renderer.width) >> 1) + 'px';
    app.renderer.view.style.top =
      ((window.innerHeight - app.renderer.height) >> 1) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);
  app.ticker.add((delta: number) => gameLoop());
  const counterStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 128,
    fill: 'black',
    stroke: 'black',
    strokeThickness: 1,
    dropShadow: true,
    dropShadowColor: '#ADBDBD',
    dropShadowBlur: 8,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
  });

  message = new PIXI.Text(dateFormat(counter), counterStyle);
  app.stage.addChild(message);

  function gameLoop() {
    message.x = (app.renderer.width - message.width) / 2;
    message.y = (app.renderer.height - message.height) / 2;
  }
}

function setupControls() {
  $('#container').append(
    "<div id='controls' class='container__row'><div class='row_element'><a href='#'><i class='fas fa-play fa-lg'></i></a><div></div>",
  );
  $('#controls').append(
    "<div class='row_element'><a href='#'><i class='fas fa-stop fa-lg'></i></a></div>",
  );
  $('#controls').css({});
}

let counter: number = 0; //number of millis

let start = new Date();
const delta: number = 1000;
const dateFormat = (counter: number) => {
  let millis = counter % 1000;
  let ss = ~~(counter / 1000) % 60;
  let mm = ~~(counter / 1000 / 60) % 60;
  let hh = ~~(counter / 1000 / 60 / 60);
  return `${hh}:${mm}:${ss} ${millis}`;
};

function init() {
  rx.interval(delta).subscribe((x: number) => {
    counter += delta;
    message.text = dateFormat(counter);
  });
}

$(document).ready(function() {
  setup(counter);
  setupControls();
  init();
});

