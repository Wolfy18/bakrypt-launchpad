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
  error?: string;
  error_description?: string;
  detail?: string;
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

interface IFile {
  uuid: string;
  file: string;
  name: string;
  filename: string;
  size: string;
  mimetype: string;
  ipfs: string;
  gateway: string;
  created_on: string;
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

      :host sl-input,
      :host input,
      :host sl-textarea,
      :host sl-details {
        margin-bottom: 2rem;
      }

      :host .form-control__help-text {
        margin-top: 0.5rem;
      }

      :host .component-section {
        padding:0 2rem;
      }
    `,
  ]);

  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [collectionRequest, setCollectionRequest] = useState();
  const [royalties, setRoyalties] = useState({
    rate: '',
    address: '',
  });

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
    icon = 'gear',
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
    // const notification = this.shadowRoot.querySelector('sl-alert');

    alert.toast = async () => {
      const toastStack = Object.assign(document.createElement('div'), {
        className: 'sl-toast-stack',
      });
      return new Promise<void>(resolve => {
        if (toastStack.parentElement === null) {
          this.shadowRoot.append(toastStack);
        }

        toastStack.appendChild(alert);

        // Wait for the toast stack to render
        requestAnimationFrame(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- force a reflow for the initial transition
          alert.clientWidth;
          alert.show();
        });

        this.addEventListener(
          'sl-after-hide',
          () => {
            toastStack.removeChild(alert);
            resolve();

            // Remove the toast stack from the DOM when there are no more alerts
            if (toastStack.querySelector('sl-alert') === null) {
              toastStack.remove();
            }
          },
          { once: true }
        );
      });
    };

    return alert.toast();
  };

  // Refresh Access token every 30 minutes
  const refreshAccessToken = async (token: string) => {
    let _reToken = token;
    try {
      if (_reToken) {
        const payload = new URLSearchParams();
        payload.append('refresh_token', _reToken);
        payload.append('grant_type', 'refresh_token');

        const tokenRequest = await fetch(`${bakryptURI}/auth/token/`, {
          method: 'post',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: payload,
        });

        if (tokenRequest.ok) {
          const tokenResponse: AccessToken = await tokenRequest.json();

          setAccessToken(tokenResponse.access_token);
          _reToken = tokenResponse.refresh_token;
          notify('Session extended', 'primary');
        } else {
          const tokenResponse: ErrorResponse = await tokenRequest.json();

          if (tokenResponse.error_description) {
            const err = `Unable to refresh access token: ${tokenResponse.error_description}`;
            notify(err, 'danger');
          } else if (tokenResponse.error) {
            const err = `Unable to refresh access token: ${tokenResponse.error}`;
            notify(err, 'danger');
          }
        }
      }
    } catch (error) {
      const err = `Unable to refresh access token: ${error}`;
      notify(String(err), 'danger');
    }

    setTimeout(() => {
      refreshAccessToken(_reToken);
    }, 300000); // Every 30 minutes
  };

  // Upload file to IPFS and return the generated attachment information
  const uploadFile = async (e: CustomEvent) => {
    const { payload } = e.detail;
    const { index } = e.detail;
    try {
      const createAttachmentRequest = await fetch(`${bakryptURI}/v1/files/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
      });

      if (createAttachmentRequest.ok) {
        const jsonResponse: IFile = await createAttachmentRequest.json();
        if (Number(index) > -1) {
          const col = collectionRequest as IAsset[];
          const asset: IAsset = col[Number(index)];
          asset.image = jsonResponse.ipfs;
          asset.mediaType = jsonResponse.mimetype;
        }

        notify('Successfully uploaded file to IPFS', 'success');
      } else {
        const jsonResponse: ErrorResponse =
          await createAttachmentRequest.json();
        if (jsonResponse.error_description)
          notify(jsonResponse.error_description, 'danger');
        else if (jsonResponse.error) notify(jsonResponse.error, 'danger');
        else if (jsonResponse.detail) notify(jsonResponse.detail, 'danger');
      }
    } catch (error) {
      console.log(error);
      notify('Unable to upload file to IPFS server', 'danger');
    }
  };

  // Add additional tab and panel
  const addAdditionalAsset = () => {
    const template = this.shadowRoot
      .querySelector('#asset-template')
      .cloneNode(true);

    const container = this.shadowRoot.querySelector('sl-tab-group');
    if (container) {
      const indx = (collectionRequest as Array<IAsset>).length;
      template.innerHTML = template.innerHTML.replace(/__prefix__/g, indx + 1);
      const newNode = template.content.cloneNode(true);

      // Set index
      newNode.querySelector('bk-asset-form').index = indx;

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
      setTimeout(() => {
        refreshAccessToken(refreshToken);
      }, 3000); // Every 30 minutes
    }

    if (accessToken) {
      // Do something over here
      console.log('This ran! how many times!');
      console.log(accessToken);
      setCollectionRequest([
        {
          blockchain: 'ada',
          name: '',
          asset_name: '',
          image: '',
          mediaType: '',
          description: '',
          files: [],
          attrs: '',
          amount: 1,
        },
      ]);
    }
  }, [accessToken]);

  return html`
    <section class="component-section">
      <sl-tab-group>
        <sl-tab slot="nav" panel="primary">Primary Asset</sl-tab>

        <sl-tab-panel name="primary">
          <div style="text-align: left; padding-top:1rem">
            Token Information
            <sl-divider style="--spacing: 2rem;"></sl-divider>
            <bk-asset-form
              .index=${0}
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
    </section>

    <section class="component-section">
      <sl-details
        summary="Would you like to set royalties for this collection?"
      >
        <sl-input
          label="Royalties Rate in %"
          placeholder="Set the percentage rate from 0 - 100%"
          maxlength="32"
          value=${royalties.rate}
          min="0"
          max="100"
          type="number"
          @input=${(e: { path?: Array<any> }) => {
            if (e.path && e.path.length > 0) {
              setRoyalties({ ...royalties, rate: e.path[0].value });
            }
          }}
        ></sl-input>

        <sl-input
          label="Royalties deposit address"
          placeholder="Set the payment address for the royalties"
          maxlength="128"
          value=${royalties.address}
          type="text"
          @input=${(e: { path?: Array<any> }) => {
            if (e.path && e.path.length > 0) {
              setRoyalties({ ...royalties, address: e.path[0].value });
            }
          }}
        ></sl-input>
      </sl-details>
    </section>

    <section class="component-section" style="padding-bottom:4rem">
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
    </section>

    <div class="alert-container"></div>

    <template id="asset-template">
      <sl-tab slot="nav" panel="__prefix__" closable>Asset #__prefix__</sl-tab>

      <sl-tab-panel name="__prefix__">
        <div style="text-align: left; padding-top:1rem">
          Token Information
          <sl-divider style="--spacing: 2rem;"></sl-divider>
          <bk-asset-form></bk-asset-form>
        </div>
      </sl-tab-panel>
    </template>
  `;
}

export { BakryptLaunchpad };
