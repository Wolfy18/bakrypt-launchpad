import { css } from 'lit';
import { html } from 'haunted';
import shoeStyles from '@shoelace-style/shoelace/dist/themes/light.styles';
import { style } from './assets/css/main.css';
import { gridStyles } from './assets/css/grid.css';
import { useStyles } from './hooks/useStyles';

function BakryptLaunchpad(this: unknown) {
  useStyles(this, [
    gridStyles,
    shoeStyles,
    style,
    css`
      :host {
        font-family: 'arial';
        font-weight: 400;
      }
    `,
  ]);

  return html` <h2 style="text-align:center; width: 100%">Hello</h2> `;
}

export { BakryptLaunchpad };
