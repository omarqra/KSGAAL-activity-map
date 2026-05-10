"use client";

import NProgress from "nprogress";
import "nprogress/nprogress.css";

let isStarted = false;

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 120,
  minimum: 0.15,
  barSelector: '[role="bar"]',
  spinnerSelector: '[role="spinner"]',
  parent: "body",
  template:
    '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>',
});

export function startProgress() {
  if (!isStarted) {
    isStarted = true;
    NProgress.start();
  }
}

export function doneProgress() {
  if (isStarted) {
    isStarted = false;
    NProgress.done();
  }
}
