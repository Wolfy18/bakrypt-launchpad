import { css } from 'lit';
import { html, component, useEffect, useState } from 'haunted';
import shoeStyles from '@shoelace-style/shoelace/dist/themes/light.styles';
import { style } from './assets/css/main.css';
import { gridStyles } from './assets/css/grid.css';
import { useStyles } from './hooks/useStyles';
import { Tab } from './components/tab';
import { AssetForm } from './components/asset';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group';
import '@shoelace-style/shoelace/dist/components/tab/tab';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel';
import '@shoelace-style/shoelace/dist/components/button/button';
import '@shoelace-style/shoelace/dist/components/input/input';
import '@shoelace-style/shoelace/dist/components/textarea/textarea';
import '@shoelace-style/shoelace/dist/components/divider/divider';
import '@shoelace-style/shoelace/dist/components/alert/alert';
import '@shoelace-style/shoelace/dist/components/icon/icon';
import '@shoelace-style/shoelace/dist/components/details/details';
import '@shoelace-style/shoelace/dist/components/button-group/button-group';

const bakryptURI = `http://localhost:8000`;

window.customElements.define('bk-tab', component(Tab));
window.customElements.define('bk-asset-form', component(AssetForm));

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

interface IAssetFile {
  name: string;
  src: string;
  mediaType: string;
}
interface IAsset {
  blockchain: string;
  name: string;
  asset_name: string;
  image: string;
  mediaType: string;
  description: string;
  files: Array<IAssetFile>;
  attrs: object;
  amount: 1;
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
  const [collectionRequest, setCollectionRequest] = useState();

  // Escape html string
  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Custom function to emit toast notifications
  const notify = (
    message: string,
    variant = 'primary',
    icon = 'info-circle',
    duration = 3000
  ) => {
    const alert = Object.assign(document.createElement('sl-alert'), {
      variant,
      closable: true,
      duration,
      innerHTML: `
        <sl-icon name="${icon}" slot="icon"></sl-icon>
        ${escapeHtml(message)}
      `,
    });
    this.shadowRoot.querySelector('.alert-container').appendChild(alert);
    return alert.toast();
  };

  // Refresh Access token every 30 minutes
  const refreshAccessToken = async (token: string) => {
    try {
      if (token) {
        const tokenRequest = await fetch(`${bakryptURI}/auth/token/`, {
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
          if (tokenResponse.error_description)
            notify(tokenResponse.error_description);
          console.log(tokenResponse.error_description);
        }
      }
    } catch (error) {
      const err = `Unable to refresh access token: ${error}`;
      notify(String(err), 'error');
    }

    setTimeout(refreshAccessToken, 300000); // Every 30 minutes
  };

  // Upload file to IPFS and return the generated attachment information
  const uploadFile = async (e: CustomEvent) => {
    const payload: FormData = e.detail.payload;

    try {
      const createAttachmentRequest = await fetch(`${bakryptURI}/v1/files/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
      });

      if (createAttachmentRequest.ok) {
        const jsonResponse = await createAttachmentRequest.json();
        console.log(jsonResponse);
        notify('Successfully uploaded file to IPFS', 'success');
      } else {
        const jsonResponse: ErrorResponse =
          await createAttachmentRequest.json();
        if (jsonResponse.error_description)
          notify(jsonResponse.error_description, 'error');
      }
    } catch (error) {
      console.log(error);
      notify('Unable to upload file to IPFS server', 'error');
    }
  };

  // Add additional tab and panel
  const addAdditionalAsset = () => {
    const template = this.shadowRoot.querySelector('#asset-template').cloneNode(true);

    const container = this.shadowRoot.querySelector('sl-tab-group');
    if (container) {
      const indx = (collectionRequest as Array<IAsset>).length;
      template.innerHTML = template.innerHTML.replace(/__prefix__/g, indx + 1);
      const newNode = template.content.cloneNode(true);
      newNode
        .querySelector('bk-asset-form')
        .addEventListener('token', (e: CustomEvent) => {
          if (e && e.detail && e.detail.token) {
            const asset: IAsset = e.detail.token;
            const col = collectionRequest as Array<IAsset>;
            col[indx] = asset;
            setCollectionRequest(col);
          }
        });

      newNode
        .querySelector('bk-asset-form')
        .addEventListener('upload-file', uploadFile);

      container.appendChild(newNode);
    }
  };

  useEffect(async () => {
    const _access = this.getAttribute('access-token');
    if (_access) {
      setAccessToken(_access);
    }

    const _refresh = this.getAttribute('refresh-token');
    if (_refresh) {
      setRefreshToken(_refresh);
    }

    if (refreshToken) {
      refreshAccessToken(refreshToken);
    }

    if (accessToken) {
      // Do something over here
      console.log('This ran! how many times!');
      console.log(accessToken);
    }
  }, [accessToken]);

  return html`
    <div style="margin-bottom: 2rem">
      <sl-tab-group>
        <sl-tab slot="nav" panel="primary">Primary Asset</sl-tab>

        <sl-tab-panel name="primary">
          <div style="text-align: left; padding: 2rem">
            Token Information
            <sl-divider style="--spacing: 2rem;"></sl-divider>
            <bk-asset-form
              @upload-file=${uploadFile}
              @token=${(e: CustomEvent) => {
                if (e && e.detail && e.detail.token) {
                  const asset: IAsset = e.detail.token;
                  const col = collectionRequest as IAsset[];

                  if (col && col.length > 0) {
                    col[0] = asset;
                    setCollectionRequest(col);
                  } else {
                    setCollectionRequest([col]);
                  }
                }
              }}
            ></bk-asset-form>
          </div>
        </sl-tab-panel>
      </sl-tab-group>
      <sl-button
        variant="primary"
        @click=${() => {
          console.log(collectionRequest);
        }}
        >Submit request</sl-button
      >
      <sl-button variant="primary" outline @click=${addAdditionalAsset}
        >Add Asset</sl-button
      >
      <div class="alert-container"></div>

      <template id="asset-template">
        <sl-tab slot="nav" panel="__prefix__" closable
          >Asset #__prefix__</sl-tab
        >

        <sl-tab-panel name="__prefix__">
          <div style="text-align: left; padding: 2rem">
            Token Information
            <sl-divider style="--spacing: 2rem;"></sl-divider>
            <bk-asset-form></bk-asset-form>
          </div>
        </sl-tab-panel>
      </template>
    </div>
  `;
}

export { BakryptLaunchpad };
