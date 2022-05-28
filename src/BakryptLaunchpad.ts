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

interface AccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
}

interface ErrorResponse {
  error: string;
  error_description?: string;
}

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

  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  const refreshAccessToken = async (token: string) => {
    try {
      if (token) {
        const tokenRequest = await fetch(``, {
          method: 'post',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: token }),
        });

        if (tokenRequest.ok) {
          const tokenResponse: AccessToken = await tokenRequest.json();

          setAccessToken(tokenResponse.access_token);
        } else {
          const tokenResponse: ErrorResponse = await tokenRequest.json();
          console.log(tokenResponse.error_description);
        }
      }
    } catch (error) {
      console.log(error);
    }
    console.log('Ran -----');
    setTimeout(refreshAccessToken, 300000); // Every 30 minutes
  };

  useEffect(async () => {
    console.log('init component...');

    const _access = this.getAttribute('access-token');
    if (_access) {
      setAccessToken(_access);
    }

    const _refresh = this.getAttribute('refresh-token');
    if (_refresh) {
      setRefreshToken(_refresh);
    }
    console.log(refreshToken);
    if (refreshToken) {
      refreshAccessToken(refreshToken);
    }

    if (accessToken) {
      for (let i = 0; i <= 5; i += 1) {
        const bkTab: any = document.createElement('bk-tab');
        bkTab.index = i + 1;
        this.shadowRoot.querySelector('.tab-container').appendChild(bkTab);

        console.log(bkTab);
        console.log('Add tab...');
      }
    }
  }, [accessToken]);

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
