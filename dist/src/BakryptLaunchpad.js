import { css } from 'lit';
import { html, component, useEffect, useState } from 'haunted';
import shoeStyles from '@shoelace-style/shoelace/dist/themes/light.styles';
import 'bakrypt-invoice/dist/src/bakrypt-invoice';
import SlTabGroup from '@shoelace-style/shoelace/dist/components/tab-group/tab-group';
import SlTab from '@shoelace-style/shoelace/dist/components/tab/tab';
import SlTabPanel from '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel';
import SlCard from '@shoelace-style/shoelace/dist/components/card/card';
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog';
import SlSkeleton from '@shoelace-style/shoelace/dist/components/skeleton/skeleton';
import SlSpinner from '@shoelace-style/shoelace/dist/components/spinner/spinner';
import SlMenu from '@shoelace-style/shoelace/dist/components/menu/menu';
import SlMenuItem from '@shoelace-style/shoelace/dist/components/menu-item/menu-item';
import SlProgressBar from '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar';
import SlResponsiveMedia from '@shoelace-style/shoelace/dist/components/responsive-media/responsive-media';
import { AssetForm } from './components/asset.js';
import { useStyles } from './hooks/useStyles.js';
import { style } from './assets/css/main.css';
// if (!customElements.get('bakrypt-invoice')) {
//   customElements.define(
//     'bakrypt-invoice',
//     component(BakryptInvoice, {
//       observedAttributes: ['transaction', 'collection'],
//     })
//   );
// }
if (!customElements.get('sl-tab-group')) {
    customElements.define('sl-tab-group', SlTabGroup);
}
if (!customElements.get('sl-tab')) {
    customElements.define('sl-tab', SlTab);
}
if (!customElements.get('sl-tab-panel')) {
    customElements.define('sl-tab-panel', SlTabPanel);
}
if (!customElements.get('sl-card')) {
    customElements.define('sl-card', SlCard);
}
if (!customElements.get('sl-dialog')) {
    customElements.define('sl-dialog', SlDialog);
}
if (!customElements.get('sl-skeleton')) {
    customElements.define('sl-skeleton', SlSkeleton);
}
if (!customElements.get('sl-spinner')) {
    customElements.define('sl-spinner', SlSpinner);
}
if (!customElements.get('sl-menu')) {
    customElements.define('sl-menu', SlMenu);
}
if (!customElements.get('sl-menu-item')) {
    customElements.define('sl-menu-item', SlMenuItem);
}
if (!customElements.get('sl-progress-bar')) {
    customElements.define('sl-progress-bar', SlProgressBar);
}
if (!customElements.get('sl-responsive-media')) {
    customElements.define('sl-responsive-media', SlResponsiveMedia);
}
window.customElements.define('bk-asset-form', component(AssetForm, { observedAttributes: ['index', 'asset'] }));
function BakryptLaunchpad({ accessToken, refreshToken, csrfToken, testnet, initial, }) {
    useStyles(this, [
        shoeStyles,
        style,
        css `
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

      .sl-toast-stack {
        right: 0;
        left: auto;
        top: 0vh;
      }
      sl-dialog::part(base) {
        max-height: 80vh;
        margin-top: 10vh;
      }
    `,
    ]);
    const bakryptURI = testnet
        ? 'https://testnet.bakrypt.io'
        : 'https://bakrypt.io';
    const [requestLoading, setRequestLoading] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [collectionRequest, setCollectionRequest] = useState([
        {
            blockchain: 'ada',
            name: '',
            asset_name: '',
            image: '',
            media_type: '',
            description: '',
            files: [],
            attrs: {},
            amount: 1,
        },
    ]);
    const [royalties, setRoyalties] = useState({
        rate: '',
        address: '',
    });
    const [transaction, setTransaction] = useState();
    // Custom function to emit toast notifications
    const notify = (message, variant = 'primary', 
    // icon = 'gear',
    duration = 6000) => {
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
            return new Promise(resolve => {
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
                this.addEventListener('sl-after-hide', () => {
                    toastStack.removeChild(alert);
                    resolve();
                    // Remove the toast stack from the DOM when there are no more alerts
                    if (toastStack.querySelector('sl-alert') === null) {
                        toastStack.remove();
                    }
                }, { once: true });
            });
        };
        return alert.toast();
    };
    // Upload file to IPFS and return the generated attachment information
    const uploadFile = async (e) => {
        const { payload } = e.detail;
        const { input } = e.detail;
        setRequestLoading(true);
        try {
            const requestHeaders = {
                Authorization: `Bearer ${accessToken}`,
            };
            if (csrfToken && csrfToken.length > 0) {
                requestHeaders['X-CSRFToken'] = csrfToken;
            }
            const createAttachmentRequest = await fetch(`${bakryptURI}/v1/files/`, {
                method: 'POST',
                headers: requestHeaders,
                body: payload,
            });
            if (createAttachmentRequest.ok) {
                const jsonResponse = await createAttachmentRequest.json();
                if (input) {
                    input.value = jsonResponse.ipfs;
                    const inputEvent = new Event('input');
                    input.dispatchEvent(inputEvent);
                }
                notify('Successfully uploaded file to IPFS', 'success');
            }
            else {
                const jsonResponse = await createAttachmentRequest.json();
                if (jsonResponse.error_description)
                    notify(jsonResponse.error_description, 'danger');
                else if (jsonResponse.error)
                    notify(jsonResponse.error, 'danger');
                else if (jsonResponse.detail)
                    notify(jsonResponse.detail, 'danger');
            }
        }
        catch (error) {
            // console.log(error);
            notify('Unable to upload file to IPFS server', 'danger');
        }
        setRequestLoading(false);
    };
    // Retrieve transaction information
    const retrieveTransaction = async (uuid) => {
        let tx;
        try {
            const requestHeaders = {
                'content-type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            };
            if (csrfToken && csrfToken.length > 0) {
                requestHeaders['X-CSRFToken'] = csrfToken;
            }
            const retrieveTransactionRequest = await fetch(`${bakryptURI}/v1/transactions/${uuid}/`, {
                method: 'GET',
                headers: requestHeaders,
            });
            if (retrieveTransactionRequest.ok) {
                const jsonResponse = await retrieveTransactionRequest.json();
                setTransaction(jsonResponse);
                tx = jsonResponse;
            }
            else {
                const jsonResponse = await retrieveTransactionRequest.json();
                if (jsonResponse.error_description)
                    notify(jsonResponse.error_description, 'danger');
                else if (jsonResponse.error)
                    notify(jsonResponse.error, 'danger');
                else if (jsonResponse.detail)
                    notify(jsonResponse.detail, 'danger');
            }
        }
        catch (error) {
            // console.log(error);
            notify('Unable to retrieve transaction.', 'danger');
        }
        return tx;
    };
    // Submit collection to the assets API
    const submitRequest = async (collection) => {
        // console.log(collection);
        let openInvoice = false;
        setRequestLoading(true);
        let submittedTx;
        let submittedCol;
        try {
            const requestHeaders = {
                'content-type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            };
            if (csrfToken && csrfToken.length > 0) {
                requestHeaders['X-CSRFToken'] = csrfToken;
            }
            const submitCollectionRequest = await fetch(`${bakryptURI}/v1/assets/`, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(collection),
            });
            if (submitCollectionRequest.ok) {
                const jsonResponse = await submitCollectionRequest.json();
                notify('Request was submitted', 'success');
                submittedCol = jsonResponse;
                if (Array.isArray(jsonResponse)) {
                    const prAsset = jsonResponse[0];
                    if (prAsset.transaction) {
                        // Retrieve Transaction Data
                        submittedTx = await retrieveTransaction(String(prAsset.transaction));
                    }
                }
                else if (jsonResponse.transaction &&
                    jsonResponse.transaction.uuid) {
                    setTransaction(jsonResponse.transaction);
                    submittedTx = jsonResponse.transaction;
                }
                openInvoice = true;
            }
            else {
                const jsonResponse = await submitCollectionRequest.json();
                if (jsonResponse.error_description)
                    notify(jsonResponse.error_description, 'danger');
                else if (jsonResponse.error)
                    notify(jsonResponse.error, 'danger');
                else if (jsonResponse.detail)
                    notify(jsonResponse.detail, 'danger');
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
        }
        catch (error) {
            notify(`Unable to submit request. Error: ${error}`, 'danger');
        }
        setRequestLoading(false);
        if (openInvoice) {
            setShowInvoice(true);
            // Add submit event
            const event = new CustomEvent('submit', {
                bubbles: true,
                composed: true,
                detail: {
                    collection: submittedCol,
                    transaction: submittedTx,
                },
            });
            this.dispatchEvent(event);
        }
    };
    // Add additional tab and panel
    const addAsset = () => {
        const template = this.shadowRoot
            .querySelector('#asset-template')
            .cloneNode(true);
        const tabGroup = this.shadowRoot.querySelector('sl-tab-group');
        if (tabGroup) {
            const indx = [...tabGroup.children].filter(i => i.tagName.toLowerCase() === 'sl-tab').length;
            template.innerHTML = template.innerHTML.replace(/__prefix__/g, indx);
            const newNode = template.content.cloneNode(true);
            // Set index
            newNode.querySelector('bk-asset-form').index = indx;
            Object.defineProperty(newNode.querySelector('bk-asset-form'), 'assetDetailed', { writable: true, configurable: true, value: collectionRequest[indx] });
            // newTab.active = true;
            tabGroup.appendChild(newNode);
            // Renumerate panel
            [...tabGroup.children]
                .filter(i => i.tagName.toLowerCase() === 'sl-tab')
                .map((i, index) => {
                const j = tabGroup.querySelector(`sl-tab-panel[name="${i.panel}"]`);
                Object.assign(i, {
                    innerHTML: i.innerHTML.replace(/#[0-9]+/g, `#${index + 1}`),
                });
                // i.innerHTML = i.innerHTML.replace(/#[0-9]+/g, `#${index + 1}`);
                i.setAttribute('panel', index);
                j.setAttribute('name', index);
                return i;
            });
        }
    };
    const removeAsset = async (event) => {
        if (transaction)
            return;
        const tab = event.target;
        const tabGroup = this.shadowRoot.querySelector('sl-tab-group');
        if (tab) {
            const panel = tabGroup.querySelector(`sl-tab-panel[name="${tab.panel}"]`);
            // Show the previous tab if the tab is currently active
            if (tab.active) {
                const currentIndx = tabGroup.tabs.indexOf(tab);
                if (currentIndx >= 0) {
                    tabGroup.show(tabGroup.tabs[currentIndx - 1].panel);
                }
            }
            // Remove from colllection
            let col = collectionRequest;
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
                Object.assign(i, {
                    innerHTML: i.innerHTML.replace(/#[0-9]+/g, `#${index + 1}`),
                });
                // i.innerHTML = i.innerHTML.replace(/#[0-9]+/g, `#${index + 1}`);
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
    const pushToken = (e) => {
        if (transaction)
            return;
        const asset = e.detail.token;
        const col = collectionRequest;
        col[e.detail.index] = asset;
        setCollectionRequest(col);
    };
    const pushNotification = (e) => {
        const [msg, type] = e.detail;
        notify(msg, type);
        return false;
    };
    const hideInvoice = () => {
        setShowInvoice(false);
    };
    // const retryTransaction = (e: any) => {
    //   submitRetry(e.detail.tx);
    // };
    // const refundTransaction = (e: any) => {
    //   submitRefund(e.detail.tx);
    // };
    useEffect(() => {
        const tabGroup = this.shadowRoot.querySelector('sl-tab-group');
        // Add event listeners
        tabGroup.addEventListener('sl-close', removeAsset);
        const dialog = this.shadowRoot.querySelector('sl-dialog');
        dialog.addEventListener('sl-hide', hideInvoice);
        this.addEventListener('token', pushToken);
        this.addEventListener('upload-file', uploadFile);
        this.addEventListener('notification', pushNotification);
        // this.addEventListener('retryTransaction', retryTransaction);
        // this.addEventListener('refundTransaction', refundTransaction);
        this.addEventListener('hideInvoice', hideInvoice);
        return () => {
            tabGroup.removeEventListener('sl-close', removeAsset);
            this.removeEventListener('token', pushToken);
            this.removeEventListener('upload-file', uploadFile);
            this.removeEventListener('notification', pushNotification);
            // this.removeEventListener('retryTransaction', retryTransaction);
            // this.removeEventListener('refundTransaction', refundTransaction);
            this.removeEventListener('hideInvoice', hideInvoice);
            dialog.removeEventListener('sl-hide', hideInvoice);
        };
    }, [accessToken, refreshToken, transaction, showInvoice]);
    useEffect(() => {
        // console.log(initial);
        // console.log('-------------------------- initial string started');
        if (initial) {
            const collection = JSON.parse(initial);
            if (Array.isArray(collection) && collection.length) {
                for (let i = 0; i < collection.length; i += 1) {
                    pushToken({
                        detail: {
                            token: collection[i],
                            index: i,
                        },
                    });
                }
                for (let i = 0; i < collection.length; i += 1) {
                    addAsset();
                }
            }
        }
        else {
            pushToken({
                detail: {
                    token: {
                        blockchain: 'ada',
                        name: '',
                        asset_name: '',
                        image: '',
                        media_type: '',
                        description: '',
                        files: [],
                        attrs: {},
                        amount: 1,
                    },
                    index: 0,
                },
            });
            addAsset();
        }
    }, [initial]);
    return html `
    <!-- Spinner loader overlay -->
    ${requestLoading
        ? html `
          <sl-spinner
            style="position:absolute; right: 2rem; --track-width: 5px; font-size: 1.5rem"
          ></sl-spinner>
        `
        : null}

    <!-- Tab groupand panel section -->
    <section class="component-section">
      <sl-tab-group id="mainTabsSection"> </sl-tab-group>
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
      <sl-details summary="Set Royalties">
        <sl-input
          label="Royalties Rate in %"
          placeholder="Set the percentage rate from 0 - 100%"
          maxlength="32"
          value=${royalties.rate}
          min="0"
          max="100"
          type="number"
          @input=${(e) => {
        if (e.currentTarget && e.currentTarget.value.length > 0) {
            setRoyalties({
                ...royalties,
                rate: e.currentTarget.value,
            });
        }
        else if (e.path && e.path.length > 0) {
            setRoyalties({ ...royalties, rate: e.path[0].value });
        }
        else if (e.originalTarget && e.originalTarget.value.length > 0) {
            setRoyalties({
                ...royalties,
                rate: e.originalTarget.value,
            });
        }
    }}
        ></sl-input>

        <sl-input
          label="Royalties wallet address"
          placeholder="Set the wallet address that will be receiving royalties"
          maxlength="128"
          value=${royalties.address}
          type="text"
          @input=${(e) => {
        if (e.currentTarget && e.currentTarget.value.length > 0) {
            setRoyalties({
                ...royalties,
                address: e.currentTarget.value,
            });
        }
        else if (e.path && e.path.length > 0) {
            setRoyalties({
                ...royalties,
                address: e.path[0].value,
            });
        }
        else if (e.originalTarget && e.originalTarget.value.length > 0) {
            setRoyalties({
                ...royalties,
                address: e.originalTarget.value,
            });
        }
    }}
        ></sl-input>
      </sl-details>
    </section>

    <!-- Button section -->
    <section class="component-section" style="padding-bottom:4rem;">
      ${transaction
        ? null
        : html ` <sl-button
              variant="primary"
              class="--sl-color-emerald-300"
              @click=${() => {
            const col = collectionRequest;
            if (col &&
                royalties.rate.length > 0 &&
                royalties.address.length > 0) {
                const prAsset = {
                    ...col[0],
                    royalties: royalties.address,
                    royalties_rate: royalties.rate,
                };
                col[0] = prAsset;
            }
            else {
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
              @click=${async () => {
            await addAsset();
            const tabGroup = this.shadowRoot.querySelector('sl-tab-group');
            if (tabGroup) {
                const newTab = tabGroup.tabs[tabGroup.tabs.length - 1];
                tabGroup.show(newTab.panel);
                tabGroup.scrollIntoView();
            }
        }}
              style="margin-left:2rem"
              >Add Asset</sl-button
            >`}
      ${transaction
        ? html ` <sl-button
            variant="success"
            @click=${() => setShowInvoice(true)}
            >Show Invoice</sl-button
          >`
        : null}
    </section>

    <!-- Transaction Dialog -->
    <sl-dialog
      label="Invoice Details"
      class="dialog-width"
      style="--width: 95vw;"
      .open=${showInvoice}
    >
      <bakrypt-invoice
        .transaction=${transaction}
        .collection=${collectionRequest}
        .accessToken=${accessToken}
        .testnet=${testnet}
        .csrfToken=${csrfToken}
      ></bakrypt-invoice>
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
        ? html ` <div part="overlay" class="dialog__overlay" tabindex="-1"></div> `
        : null}
  `;
}
export default BakryptLaunchpad;
//# sourceMappingURL=BakryptLaunchpad.js.map