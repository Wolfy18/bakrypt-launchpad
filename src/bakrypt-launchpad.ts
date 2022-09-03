import {component} from "haunted";
import { BakryptLaunchpad } from './BakryptLaunchpad.js';

window.customElements.define(
  'bakrypt-launchpad',
  component(BakryptLaunchpad, { observedAttributes: ['access-token', 'refresh-token', 'csrf-token', 'testnet']})
);
