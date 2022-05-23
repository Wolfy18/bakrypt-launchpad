import { css } from 'lit';
import { html, component, useState, useEffect } from 'haunted';
import { useStyles } from '../hooks/useStyles';
function BasicComponent(this: unknown) {
  useStyles(this, [css``]);
  return html``;
}
export { BasicComponent };
