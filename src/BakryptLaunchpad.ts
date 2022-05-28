import { css } from 'lit';
import { html, component, useEffect, useState } from 'haunted';
import shoeStyles from '@shoelace-style/shoelace/dist/themes/light.styles';
import { style } from './assets/css/main.css';
import { gridStyles } from './assets/css/grid.css';
import { useStyles } from './hooks/useStyles';
import { BasicComponent } from './components/tab';
import '@shoelace-style/shoelace/dist/components/button/button';
import '@shoelace-style/shoelace/dist/components/button-group/button-group';

window.customElements.define('bk-tab', component(BasicComponent));

function BakryptLaunchpad(this: any) {
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

  const [accessToken, setAccessToken] = useState();
  const [refreshToken, setRefreshToken] = useState();

  useEffect(async () => {
    console.log('alerrt!!');
    for (let i = 0; i <= 5; i += 1) {
      const bkTab: any = document.createElement('bk-tab');
      bkTab.index = i + 1;
      console.log(bkTab);
      // this.shadowRoot.appendChild(bkTab);
      this.shadowRoot.querySelector('.tab-container').appendChild(bkTab);
      console.log('added! -----');
    }

    const _access = this.getAttribute('access-token');
    if (_access) {
      setAccessToken(_access);
    }

    const _refresh = this.getAttribute('refresh-token');
    if (_refresh) {
      setRefreshToken(_refresh);
    }
  }, []);

  return html`
    <div class="container">
      <h2 style="text-align:center; width: 100%">Hello</h2>
      <div class="tab-container">
        <bk-tab .index=${0}></bk-tab>
      </div>
    </div>
    <sl-button-group>
      <sl-button>Left</sl-button>
      <sl-button>Right</sl-button>
    </sl-button-group>
  `;
}

export { BakryptLaunchpad };
