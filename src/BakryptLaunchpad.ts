import { css } from 'lit';
import { html, component, useEffect, useState, useCallback } from 'haunted';
import shoeStyles from '@shoelace-style/shoelace/dist/themes/light.styles';
import { style } from './assets/css/main.css';
import { useStyles } from './hooks/useStyles';
import { AssetForm } from './components/asset';
import {
  IAsset,
  ITransaction,
  IFile,
  AccessToken,
  ErrorResponse,
} from './adapters/interfaces';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group';
import '@shoelace-style/shoelace/dist/components/tab/tab';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel';
import '@shoelace-style/shoelace/dist/components/button/button';
import '@shoelace-style/shoelace/dist/components/input/input';
import '@shoelace-style/shoelace/dist/components/textarea/textarea';
import '@shoelace-style/shoelace/dist/components/divider/divider';
import '@shoelace-style/shoelace/dist/components/alert/alert';
import '@shoelace-style/shoelace/dist/components/icon/icon';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button';
import '@shoelace-style/shoelace/dist/components/details/details';
import '@shoelace-style/shoelace/dist/components/button-group/button-group';
import '@shoelace-style/shoelace/dist/components/badge/badge';
import '@shoelace-style/shoelace/dist/components/card/card';
import '@shoelace-style/shoelace/dist/components/dialog/dialog';
import '@shoelace-style/shoelace/dist/components/qr-code/qr-code';
import '@shoelace-style/shoelace/dist/components/skeleton/skeleton';
import '@shoelace-style/shoelace/dist/components/spinner/spinner';
import '@shoelace-style/shoelace/dist/components/menu/menu';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item';

window.customElements.define('bk-asset-form', component(AssetForm));

const testTransaction: ITransaction | {} = {
  amount: 1,
  blockchain_fee: 0.227805,
  convenience_fee: 6,
  cost: 15.25561,
  created_on: '2022-04-30 16:12:13.983673+00:00',
  deposit_address: 'addr1vxzqwzt22hkmkslkhyzt65976etatclvxvtwht6g3z8hgds8n20s8',
  description: 'Collection: 7c4dcc1b-73db-4e74-90c8-a0e2b23a0bb1',
  fraud_status: 'unknown',
  has_royalties: true,
  image: '',
  invalid_slot: '59855240',
  is_auto_processing: false,
  is_deleted: false,
  is_minted: false,
  is_refunded: false,
  is_resubmitted: false,
  is_voided: false,
  issuer_address: null,
  name: '',
  policy_id: '7517575ec43144fcba643475f01832ca3c3685fbb6b0b618f752700c',
  royalties:
    'addr_test1qzr84dy9syhkdy3ffn8c3mn8n2zh0wzhgwltz2dle5phaaky56y0ulyxyrz2mra05y8xsnxcgphrleag8mxs0llszrkjah',
  royalties_burned: false,
  royalties_burned_on: null,
  royalties_minted: false,
  royalties_minted_on: null,
  royalties_rate: '3.00',
  status: 'error',
  status_description: 'Waiting for funds',
  type: 'ADA',
  updated_on: '2022-04-30 16:12:16.840865+00:00',
  uuid: '20baaf19-7cd6-4723-95c6-b1f554a27bbb',
};

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
      :host sl-details {
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

      :host .dialog__overlay {
        position: fixed;
        inset: 0px;
        background-color: var(--sl-overlay-background-color);
      }
    `,
  ]);

  const [bakryptURI, setBakryptUri] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

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
  const [transactionStatusVariant, setTransactionStatusVariant] = useState(
    transaction ? 'primary' : 'neutral'
  );
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
        ${message}
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
  const uploadFile = async (e: any) => {
    const { payload } = e.detail;
    const { input } = e.detail;
    console.log(input);
    setRequestLoading(true);
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
        if (input) {
          input.value = jsonResponse.ipfs;

          const inputEvent = new Event('input');
          input.dispatchEvent(inputEvent);
        }
        // if (Number(index) > -1) {
        //   const col = collectionRequest as IAsset[];
        //   const asset: IAsset = col[Number(index)];
        //   asset.image = jsonResponse.ipfs;
        //   asset.mediaType = jsonResponse.mimetype;
        //   col[Number(index)] = asset;
        //   const form = this.shadowRoot.querySelectorAll('bk-asset-form');
        //   if (form) {
        //     [...form]
        //       .filter((i: any) => i.index === Number(index))
        //       .map((i: HTMLElement) => {
        //         console.log('its going to pass it down...');
        //         console.log(i);
        //         console.log(asset);
        //         const event = new Event('token');
        //         i.dispatchEvent(event);
        //         // Object.defineProperty(i, 'assetDetailed', {
        //         //   value: asset,
        //         //   writable: true,
        //         //   configurable: true,
        //         // });

        //         return i;
        //       });
        //   }
        // }

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
    setRequestLoading(false);
  };

  // Retrieve transaction information
  const retrieveTransaction = async (uuid: string) => {
    try {
      const retrieveTransactionRequest = await fetch(
        `${bakryptURI}/v1/transactions/${uuid}/`,
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

        // Repeat call every 15 seconds
        setTimeout(() => {
          retrieveTransaction(uuid);
        }, 15000);
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
      notify('Unable to retrieve transaction.', 'danger');
    }
  };

  // Submit collection to the assets API
  const submitRequest = async (collection: IAsset[]) => {
    console.log(collection);
    let showInvoice = false;
    setRequestLoading(true);
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
        else if (Array.isArray(jsonResponse)) {
          const errors = jsonResponse.map((i, idx) => {
            let error = ``;
            if (Object.keys(i).length > 0) {
              error = `<br/>Asset #${idx + 1} <br/>`;
              for (const [k, v] of Object.entries(i)) {
                error += `${k}: ${v} <br/>`;
              }
            }

            return error;
          });

          notify(errors.join(' '), 'danger');
        }
      }
    } catch (error) {
      notify(`Unable to submit request. Error: ${error}`, 'danger');
    }
    setRequestLoading(false);
    const invDialog: any = this.shadowRoot.querySelector('sl-dialog');
    if (invDialog && showInvoice) {
      invDialog.show();
    }
  };

  // Submit collection to the assets API
  const submitRetry = async () => {
    try {
      const submitRetryRequest = await fetch(
        `${bakryptURI}/v1/transactions/${
          (<ITransaction>transaction).uuid
        }/mint/`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (submitRetryRequest.ok) {
        const jsonResponse: IAsset[] | IAsset = await submitRetryRequest.json();

        notify('Request was submitted', 'success');
        console.log(jsonResponse);
        // if (Array.isArray(jsonResponse)) {
        //   const prAsset = jsonResponse[0];
        //   if (prAsset.transaction) {
        //     // Retrieve Transaction Data
        //     retrieveTransaction(String(prAsset.transaction));
        //   }
        // } else if (
        //   jsonResponse.transaction &&
        //   (<ITransaction>jsonResponse.transaction).uuid
        // ) {
        //   setTransaction(jsonResponse.transaction);
        // }
      } else {
        const jsonResponse: ErrorResponse = await submitRetryRequest.json();
        if (jsonResponse.error_description)
          notify(jsonResponse.error_description, 'danger');
        else if (jsonResponse.error) notify(jsonResponse.error, 'danger');
        else if (jsonResponse.detail) notify(jsonResponse.detail, 'danger');
      }
    } catch (error) {
      notify(`Unable to submit request. Error: ${error}`, 'danger');
    }
  };

  // Submit collection to the assets API
  const submitRefund = async () => {
    setRequestLoading(true);
    try {
      const submitRefundRequest = await fetch(
        `${bakryptURI}/v1/transactions/${
          (<ITransaction>transaction).uuid
        }/refund/`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (submitRefundRequest.ok) {
        const jsonResponse: IAsset[] | IAsset =
          await submitRefundRequest.json();

        notify('Refund was submitted', 'success');
        console.log(jsonResponse);
        // if (Array.isArray(jsonResponse)) {
        //   const prAsset = jsonResponse[0];
        //   if (prAsset.transaction) {
        //     // Retrieve Transaction Data
        //     retrieveTransaction(String(prAsset.transaction));
        //   }
        // } else if (
        //   jsonResponse.transaction &&
        //   (<ITransaction>jsonResponse.transaction).uuid
        // ) {
        //   setTransaction(jsonResponse.transaction);
        // }
      } else {
        const jsonResponse: ErrorResponse = await submitRefundRequest.json();
        if (jsonResponse.error_description)
          notify(jsonResponse.error_description, 'danger');
        else if (jsonResponse.error) notify(jsonResponse.error, 'danger');
        else if (jsonResponse.detail) notify(jsonResponse.detail, 'danger');
      }
    } catch (error) {
      notify(`Unable to refund request. Error: ${error}`, 'danger');
    }
    setRequestLoading(false);
  };

  // Add additional tab and panel
  const addAsset = () => {
    const template = this.shadowRoot
      .querySelector('#asset-template')
      .cloneNode(true);

    const tabGroup = this.shadowRoot.querySelector('sl-tab-group');
    if (tabGroup) {
      const indx = [...tabGroup.children].filter(
        i => i.tagName.toLowerCase() === 'sl-tab'
      ).length;
      template.innerHTML = template.innerHTML.replace(/__prefix__/g, indx);
      const newNode = template.content.cloneNode(true);

      // Set index
      newNode.querySelector('bk-asset-form').index = indx;

      const _asset: IAsset = {
        blockchain: 'ada',
        name: '',
        asset_name: '',
        image: '',
        mediaType: '',
        description: '',
        files: [],
        attrs: {},
        amount: 1,
      };

      Object.defineProperty(
        newNode.querySelector('bk-asset-form'),
        'assetDetailed',
        { writable: true, configurable: true, value: _asset }
      );

      // newNode
      //   .querySelector('bk-asset-form')
      //   .addEventListener('upload-file', uploadFile);

      // newTab.active = true;
      tabGroup.appendChild(newNode);

      // Renumerate panel
      const tabs = [...tabGroup.children]
        .filter(i => i.tagName.toLowerCase() === 'sl-tab')
        .map((i, index) => {
          const j = tabGroup.querySelector(`sl-tab-panel[name="${i.panel}"]`);

          i.innerHTML = i.innerHTML.replace(/#[0-9]+/g, `#${index + 1}`);

          i.setAttribute('panel', index);
          j.setAttribute('name', index);
          return i;
        });

      // click the new tab
      // const newTab = tabs.pop();
      // if (newTab) {
      //   console.log(tabGroup);
      //   console.log(newTab);
      //   console.log(newTab.panel);
      //   console.log(tabGroup.tabs);
      //   console.log(
      //     tabGroup.tabs.find((i: any) => i.panel === String(newTab.panel))
      //   );
      //   tabGroup.setActiveTab(newTab, { scrollBehavior: 'smooth' });
      // }
    }
  };

  const viewTransaction = () => {
    const dialog = this.shadowRoot.querySelector('sl-dialog');
    if (dialog) {
      dialog.show();
    }
  };

  const removeAsset = async (event: CustomEvent) => {
    const tab: any = event.target;
    const tabGroup = this.shadowRoot.querySelector('sl-tab-group');
    if (tab) {
      const panel = tabGroup.querySelector(`sl-tab-panel[name="${tab.panel}"]`);

      // Show the previous tab if the tab is currently active
      // if (tab.active) {
      //   console.log(tab.previousElementSibling);
      //   tabGroup.show(tab.previousElementSibling.panel);
      // }

      // Remove from colllection
      let col = collectionRequest as IAsset[];

      const indx = [...tabGroup.children]
        .filter(i => i.tagName.toLowerCase() === 'sl-tab')
        .indexOf(tab);

      const del = col.splice(indx, 1);

      if (del.length > 0) {
        col = collectionRequest.filter(i => i !== del[0]);
        setCollectionRequest(col);
      }

      // Remove the tab + panel
      tab.remove();
      panel.remove();

      // Renumerate panel
      [...tabGroup.children]
        .filter(i => i.tagName.toLowerCase() === 'sl-tab')
        .map((i, index) => {
          const j = tabGroup.querySelector(`sl-tab-panel[name="${i.panel}"]`);

          i.innerHTML = i.innerHTML.replace(/#[0-9]+/g, `#${index + 1}`);

          i.setAttribute('panel', index);
          j.setAttribute('name', index);

          const form = j.querySelector('bk-asset-form');

          if (form) {
            Object.defineProperty(form, 'index', {
              writable: true,
              configurable: true,
              value: index,
            });
          }
          return i;
        });
    }
  };

  const pushToken = (e: any) => {
    const asset: IAsset = e.detail.token;
    const col = collectionRequest as Array<IAsset>;
    col[e.detail.index] = asset;
    setCollectionRequest(col);

    return false;
  };

  useEffect(() => {
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
      }, 300000); // Every 30 minutes
    }
    const tabGroup = this.shadowRoot.querySelector('sl-tab-group');
    if (accessToken) {
      // tab group listener
      tabGroup.addEventListener('sl-close', removeAsset);

      // Add event listeners
      window.addEventListener('token', pushToken);
      window.addEventListener('upload-file', uploadFile);
    }

    return () => {
      tabGroup.removeEventListener('sl-close', removeAsset);
      window.removeEventListener('token', pushToken);
      window.removeEventListener('upload-file', uploadFile);
    };
  }, [accessToken]);

  return html`
    <!-- Spinner loader overlay -->
    ${requestLoading
      ? html`
          <sl-spinner
            style="position:absolute; right: 2rem; --track-width: 5px; font-size: 1.5rem"
          ></sl-spinner>
        `
      : null}

    <!-- Tab groupand panel section -->
    <section class="component-section">
      <sl-tab-group>
        <sl-tab slot="nav" panel="0">Primary Asset</sl-tab>

        <sl-tab-panel name="0">
          <div style="text-align: left; padding-top:1rem">
            <bk-asset-form .index=${0}></bk-asset-form>
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
          label="Royalties wallet address"
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
              class="--sl-color-emerald-300"
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
              @click=${addAsset}
              style="margin-left:2rem"
              >Add Asset</sl-button
            >`}
      ${transaction
        ? html` <sl-button variant="success" outline @click=${viewTransaction}
            >Show Invoice</sl-button
          >`
        : null}
    </section>

    <!-- Transaction Dialog -->
    <sl-dialog
      label="Invoice Details"
      class="dialog-width"
      style="--width: 80vw;"
    >
      <div
        style="
      "
      >
        <small style="float:right"
          >Save this value for verification purposes</small
        >
        <sl-input
          maxlength="255"
          label="Transaction UUID"
          value=${transaction ? (<ITransaction>transaction).uuid : ''}
          type="text"
          readonly
          filled
        ></sl-input>
        <div
          style="display:grid; grid-template-columns: repeat(auto-fit, minmax(305px, 1fr)); grid-gap: 0.5rem; align-items:center; margin-bottom: 2rem"
        >
          <div style="text-align:center">
            <sl-qr-code
              value=${transaction
                ? (<ITransaction>transaction).deposit_address
                : 'Not found'}
              label="Scan this code for the deposit_address!"
            ></sl-qr-code>
          </div>
          <sl-alert variant="warning" open>
            <strong>DO NOT TRANSFER FUNDS FROM AN EXCHANGE!</strong> <br />
            We will send all tokens and change to the payor's address; meaning
            that the payment must be done from a wallet that you can control and
            its capable of manage native tokens.
          </sl-alert>
        </div>
        <div>
          <sl-badge
            style="margin-bottom: 2rem"
            .pulse=${true}
            variant=${transactionStatusVariant}
            >${transaction ? (<ITransaction>transaction).status : ''}</sl-badge
          >
          <sl-input
            maxlength="255"
            label="Policy ID"
            value=${transaction ? (<ITransaction>transaction).policy_id : ''}
            type="text"
            readonly
            filled
          ></sl-input>
          ${transaction && (<ITransaction>transaction).status !== 'confirmed'
            ? html` <small style="float:right">Click to copy</small
                ><sl-input
                  maxlength="255"
                  label="Deposit Address"
                  value=${transaction
                    ? (<ITransaction>transaction).deposit_address
                    : ''}
                  type="password"
                  readonly
                  filled
                  toggle-password
                  @click=${(e: any) => {
                    if (e.path && e.path.length > 0) {
                      const depAddr = e.path[0].value;
                      navigator.clipboard.writeText(depAddr);
                      notify('Copy to clipboard!', 'success');
                    }
                    return false;
                  }}
                ></sl-input>`
            : null}
          ${transaction && (<ITransaction>transaction).status !== 'confirmed'
            ? html` <sl-input
                maxlength="255"
                type="number"
                label="Estimated cost"
                value=${transaction ? (<ITransaction>transaction).cost : ''}
                readonly
                filled
              ></sl-input>`
            : html` <sl-input
                maxlength="255"
                type="number"
                label="Final Cost"
                value=${transaction ? (<ITransaction>transaction).cost : ''}
                readonly
                filled
              ></sl-input>`}
          <h4>Summary</h4>
          <sl-menu style="width: 100%">
            <sl-menu-item>
              <strong>Minting:</strong>
              <br />
              <small
                >** These tokens are returned to the payor's wallet
                automatically. **</small
              >
              <sl-menu style="width: 100%">
                <sl-menu-item
                  >Number of assets: ${collectionRequest.length}</sl-menu-item
                >
                <sl-menu-item
                  >Bond per asset:
                  ${transaction && (<ITransaction>transaction).cost
                    ? collectionRequest.length * Number(1.95)
                    : null}</sl-menu-item
                >
                <sl-menu-item
                  >Change:
                  ${transaction && (<ITransaction>transaction).cost
                    ? (
                        Number((<ITransaction>transaction).cost) -
                        Number((<ITransaction>transaction).blockchain_fee) -
                        Number((<ITransaction>transaction).convenience_fee) -
                        Number(collectionRequest.length * Number(1.95))
                      ).toFixed(6)
                    : null}</sl-menu-item
                >
                <sl-divider></sl-divider>
                <sl-menu-item
                  >Total Change:
                  ${transaction && (<ITransaction>transaction).cost
                    ? `${Number(
                        collectionRequest.length * Number(1.95) +
                          Number((<ITransaction>transaction).cost) -
                          Number((<ITransaction>transaction).blockchain_fee) -
                          Number((<ITransaction>transaction).convenience_fee) -
                          Number(collectionRequest.length * Number(1.95))
                      ).toFixed(6)}`
                    : null}</sl-menu-item
                >
              </sl-menu></sl-menu-item
            >
            <sl-menu-item
              ><strong>Convenience Fee</strong>:
              ${transaction
                ? (<ITransaction>transaction).convenience_fee
                : ''}</sl-menu-item
            >
            <sl-menu-item
              ><strong>Blockchain Fee</strong>:
              ${transaction
                ? (<ITransaction>transaction).blockchain_fee
                : ''}</sl-menu-item
            >
          </sl-menu>

          <sl-divider></sl-divider>
        </div>
      </div>

      <sl-textarea
        label="Status Description"
        value=${transaction
          ? (<ITransaction>transaction).status_description
          : ''}
        readonly
        filled
      >
      </sl-textarea>
      <div>
        ${transaction &&
        (<ITransaction>transaction).status &&
        ['rejected', 'error'].includes((<ITransaction>transaction).status)
          ? html`
              <sl-button
                variant="primary"
                style="margin-right:1rem"
                @click=${submitRetry}
                >Retry</sl-button
              >
            `
          : null}
        ${transaction &&
        (<ITransaction>transaction).status &&
        (<ITransaction>transaction).status !== 'confirmed'
          ? html`
              <sl-button
                variant="warning"
                outline
                @click=${() => {
                  if (confirm('Would you like to refund the transaction?')) {
                    submitRefund();
                  }
                }}
                style=""
                >Submit Refund</sl-button
              >
            `
          : null}
      </div>
    </sl-dialog>

    <!-- Alert container -->
    <div class="alert-container"></div>

    <!-- Asset template -->
    <template id="asset-template">
      <sl-tab slot="nav" panel="__prefix__" closable>
        Asset #__prefix__
      </sl-tab>

      <sl-tab-panel name="__prefix__">
        <div style="text-align: left; padding-top:1rem">
          <bk-asset-form></bk-asset-form>
        </div>
      </sl-tab-panel>
    </template>
    <!-- Spinner loader overlay -->
    ${requestLoading
      ? html` <div part="overlay" class="dialog__overlay" tabindex="-1"></div> `
      : null}
  `;
}

export { BakryptLaunchpad };
