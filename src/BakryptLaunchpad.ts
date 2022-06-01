import { css } from 'lit';
import { html, component, useEffect, useState } from 'haunted';
import shoeStyles from '@shoelace-style/shoelace/dist/themes/light.styles';
import { style } from './assets/css/main.css';
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
import '@shoelace-style/shoelace/dist/components/badge/badge';
import '@shoelace-style/shoelace/dist/components/card/card';
import '@shoelace-style/shoelace/dist/components/dialog/dialog';
import '@shoelace-style/shoelace/dist/components/qr-code/qr-code';
import '@shoelace-style/shoelace/dist/components/skeleton/skeleton';
import '@shoelace-style/shoelace/dist/components/responsive-media/responsive-media';

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

interface ITransaction {
  uuid: string;
  blockchain: string;
  status: string;
  status_description: string;
  fraud_status: string;
  issuer_address: string;
  policy_id: string;
  invalid_slot: string;
  cost: string;
  convenience_fee: string;
  blockchain_fee: string;
  is_deleted: boolean;
  is_minted: boolean;
  is_voided: boolean;
  is_resubmitted: boolean;
  is_refunded: boolean;
  deposit_address: string;
  created_on: string;
  updated_on: string;
  is_auto_processing: boolean;
  has_royalties: boolean;
  royalties_minted: boolean;
  royalties_minted_on: string;
  royalties_burned: boolean;
  royalties_burned_on: string;
  name: string;
  image: string;
  description: string;
  amount: number;
}

interface IAsset {
  uuid?: string;
  blockchain: string;
  name: string;
  asset_name: string;
  image: string;
  mediaType: string;
  description: string;
  files: Array<IAssetFile>;
  attrs: object;
  amount: number;
  royalties?: string;
  royalties_rate?: string;
  transaction?: string | ITransaction;
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
      :host sl-details,
      :host sl-qr-code {
        margin-bottom: 2rem;
      }

      :host .form-control__help-text {
        margin-top: 0.5rem;
      }

      :host .component-section {
        padding-left: 0.85rem;
        padding-right: 0.85rem;
        max-width: 1200px;
        margin: 0 auto;
      }
    `,
  ]);

  const [bakryptURI, setBakryptUri] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [transactionStatusVariant, setTransactionStatusVariant] =
    useState('neutral');
  const [collectionRequest, setCollectionRequest] = useState([
    {
      blockchain: 'ada',
      name: '',
      asset_name: '',
      image: '',
      mediaType: '',
      description: '',
      files: [],
      attrs: {},
      amount: 1,
    } as IAsset,
  ]);
  const [royalties, setRoyalties] = useState({
    rate: '',
    address: '',
  });
  const [transaction, setTransaction] = useState();

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

  // Retrieve transaction information
  const retrieveTransaction = async (uuid: string) => {
    try {
      const retrieveTransactionRequest = await fetch(
        `${bakryptURI}/v1/transactions/${uuid}`,
        {
          method: 'GET',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (retrieveTransactionRequest.ok) {
        const jsonResponse: ITransaction =
          await retrieveTransactionRequest.json();
        setTransaction(jsonResponse);

        let _variant = 'primary';

        if (
          ['error', 'rejected', 'canceled'].includes(
            (<ITransaction>jsonResponse).status
          )
        ) {
          _variant = 'danger';
        } else if (
          ['burning', 'royalties', 'refund'].includes(
            (<ITransaction>jsonResponse).status
          )
        ) {
          _variant = 'warning';
        } else if (
          ['confirmed', 'stand-by'].includes(
            (<ITransaction>jsonResponse).status
          )
        ) {
          _variant = 'success';
        }

        setTransactionStatusVariant(_variant);
      } else {
        const jsonResponse: ErrorResponse =
          await retrieveTransactionRequest.json();
        if (jsonResponse.error_description)
          notify(jsonResponse.error_description, 'danger');
        else if (jsonResponse.error) notify(jsonResponse.error, 'danger');
        else if (jsonResponse.detail) notify(jsonResponse.detail, 'danger');
      }
    } catch (error) {
      console.log(error);
      notify('Unable to retrieve transaction. Internal Server Error', 'danger');
    }
  };

  // Submit collection to the assets API
  const submitRequest = async (collection: IAsset[]) => {
    let showInvoice = false;
    try {
      const submitCollectionRequest = await fetch(`${bakryptURI}/v1/assets/`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(collection),
      });

      if (submitCollectionRequest.ok) {
        const jsonResponse: IAsset[] | IAsset =
          await submitCollectionRequest.json();

        notify('Request was submitted', 'success');

        if (Array.isArray(jsonResponse)) {
          const prAsset = jsonResponse[0];
          if (prAsset.transaction) {
            // Retrieve Transaction Data
            retrieveTransaction(String(prAsset.transaction));
          }
        } else if (
          jsonResponse.transaction &&
          (<ITransaction>jsonResponse.transaction).uuid
        ) {
          setTransaction(jsonResponse.transaction);
        }

        showInvoice = true;
      } else {
        const jsonResponse: ErrorResponse =
          await submitCollectionRequest.json();
        if (jsonResponse.error_description)
          notify(jsonResponse.error_description, 'danger');
        else if (jsonResponse.error) notify(jsonResponse.error, 'danger');
        else if (jsonResponse.detail) notify(jsonResponse.detail, 'danger');
      }
    } catch (error) {
      notify(`Unable to submit request. Error: ${error}`, 'danger');
    }

    const invDialog: any = this.shadowRoot.querySelector('sl-dialog');
    if (invDialog && showInvoice) {
      invDialog.show();
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

      // newTab.active = true;
      container.appendChild(newNode);
    }
  };

  const viewTransaction = () => {
    const dialog = this.shadowRoot.querySelector('sl-dialog');
    if (dialog) {
      dialog.show();
    }
  };

  useEffect(async () => {
    const testnet = this.getAttribute('testnet');
    setBakryptUri(
      testnet ? 'https://testnet.bakrypt.io' : 'https://bakrypt.io'
    );

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
      console.log(accessToken);
    }
  }, [accessToken]);

  return html`
    <!-- Tab groupand panel section -->
    <section class="component-section">
      <sl-tab-group>
        <sl-tab slot="nav" panel="primary">Primary Asset</sl-tab>

        <sl-tab-panel name="primary">
          <div style="text-align: left; padding-top:1rem">
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
                  }
                }
              }}
            ></bk-asset-form>
          </div>
        </sl-tab-panel>
      </sl-tab-group>
    </section>

    <!-- Royalties section -->
    <section class="component-section" style="margin-top:1rem">
      Royalties Information
      <sl-badge
        style="margin-left:0.5rem"
        variant=${royalties.rate.length > 0 && royalties.address.length > 0
          ? 'success'
          : 'neutral'}
        >${royalties.rate.length > 0 && royalties.address.length > 0
          ? 'Active'
          : 'Not Active'}</sl-badge
      >
      <sl-divider style="--spacing: 2rem;"></sl-divider>
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

    <!-- Button section -->
    <section class="component-section" style="padding-bottom:4rem;">
      ${transaction
        ? null
        : html` <sl-button
              variant="primary"
              @click=${() => {
                const col: IAsset[] = collectionRequest;
                if (
                  col &&
                  royalties.rate.length > 0 &&
                  royalties.address.length > 0
                ) {
                  const prAsset = {
                    ...col[0],
                    royalties: royalties.address,
                    royalties_rate: royalties.rate,
                  };

                  col[0] = prAsset;
                } else {
                  const prAsset = col[0];
                  delete prAsset.royalties;
                  delete prAsset.royalties_rate;
                  col[0] = { ...prAsset };
                }

                submitRequest(col);
              }}
              >Submit request</sl-button
            ><sl-button
              variant="primary"
              outline
              @click=${addAdditionalAsset}
              style="margin-left:2rem"
              >Add Asset</sl-button
            >`}
      ${transaction
        ? html` <sl-button variant="success" outline @click=${viewTransaction}
            >Show Transaction Invoice</sl-button
          >`
        : null}
    </section>

    <!-- Transaction Dialog -->
    <sl-dialog
      label="Transaction Invoice"
      class="dialog-width"
      style="--width: 50vw;"
    >
      <sl-qr-code
        value=${transaction
          ? (<ITransaction>transaction).deposit_address
          : 'https://bakrypt.io'}
        label="Scan this code for the deposit_address!"
      ></sl-qr-code>
      <sl-input
        maxlength="255"
        label="Deposit Address"
        value=${transaction ? (<ITransaction>transaction).deposit_address : ''}
        readonly
      ></sl-input>
      <sl-input
        maxlength="255"
        type="number"
        label="Deposit Amount Required"
        value=${transaction ? (<ITransaction>transaction).cost : ''}
        readonly
      ></sl-input>
      <sl-badge
        style="margin-top:1rem; margin-bottom: 2rem"
        variant=${transactionStatusVariant}
        >${transaction ? (<ITransaction>transaction).status : ''}</sl-badge
      >
      <sl-textarea
        label="Status Description"
        value=${transaction
          ? (<ITransaction>transaction).status_description
          : ''}
        readonly
      >
      </sl-textarea>

      <sl-card class="card-header">
        <div slot="header">
          Attention! Please read this message

          <sl-icon-button name="gear" label="Settings"></sl-icon-button>
        </div>

        DO NOT DEPOSIT FROM A EXCHANGE! We will send all the tokens and change
        to the payor's address; meaning that the payment must be done from a
        wallet that you own.
      </sl-card>

      <br />
      <sl-button slot="footer" variant="primary">Close</sl-button>
    </sl-dialog>

    <!-- Alert container -->
    <div class="alert-container"></div>

    <!-- Asset template -->
    <template id="asset-template">
      <sl-tab slot="nav" panel="__prefix__" closable>Asset #__prefix__</sl-tab>

      <sl-tab-panel name="__prefix__">
        <div style="text-align: left; padding-top:1rem">
          <bk-asset-form></bk-asset-form>
        </div>
      </sl-tab-panel>
    </template>
  `;
}

export { BakryptLaunchpad };
