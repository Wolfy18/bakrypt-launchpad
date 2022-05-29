import { css } from 'lit';
import { html, component, useState, useEffect } from 'haunted';
import { useStyles } from '../hooks/useStyles';

function Tab(this: any, {index}: {index:number}) {
  useStyles(this, [css`:host {
      text-align: center
  }`]);
  return html` <p>lorem ${index} - Ipsum</p>
    <sl-button>Just a button!</sl-button>`;
}
export { Tab };
