import { css } from 'lit';
import { html, component, useState, useEffect } from 'haunted';
import { useStyles } from '../hooks/useStyles';

function AssetForm(this: any, { index }: { index: number | string | null }) {
  useStyles(this, [
    css`
      :host sl-input,
      :host input,
      :host sl-textarea,
      :host sl-details {
        margin-bottom: 2rem;
      }

      :host .form-control__help-text {
        margin-top: 0.5rem;
      }

      :host .container.asset {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        grid-gap: 2rem;
      }

      .skeleton-overview header {
        width: 100%;
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
      }

      .skeleton-overview header sl-skeleton:last-child {
        flex: 0 0 auto;
        width: 100%;
      }

      .skeleton-overview sl-skeleton {
        margin-bottom: 1rem;
      }

      .skeleton-overview sl-skeleton:nth-child(1) {
        float: left;
        width: 95%;
        height: 5rem;
        margin-right: 1rem;
        vertical-align: middle;
      }
      .skeleton-overview sl-skeleton:nth-child(4) {
        width: 85%;
      }
      .skeleton-overview sl-skeleton:nth-child(5) {
        width: 75%;
      }
      .skeleton-effects {
        font-size: var(--sl-font-size-small);
      }
    `,
  ]);

  const [tokenType, setTokenType] = useState({
    type: 'NFT',
    variant: 'primary',
  });
  const [asset, setAsset] = useState({
    blockchain: 'ada',
    name: '',
    asset_name: '',
    image: '',
    mediaType: '',
    description: '',
    files: [],
    attrs: {},
    amount: 1,
  });

  const clearFile = () => {};

  const requestUpload = () => {
    const payload = new FormData();

    const inputfile: HTMLInputElement =
      this.shadowRoot.querySelector('#ipfs-fileinput');

    if (inputfile && inputfile.files) {
      // do
      payload.set('file', inputfile.files[0]);
    }

    const event = new CustomEvent('upload-file', {
      bubbles: true,
      composed: true,
      detail: { payload, index },
    });

    this.dispatchEvent(event);
  };

  // Return callback with the token information
  const token = () => {
    const event = new CustomEvent('token', {
      bubbles: true,
      composed: true,
      detail: { token: asset },
    });

    this.dispatchEvent(event);
  };

  useEffect(() => {
    token();

    if (asset) {
      if (asset.amount === 1) {
        setTokenType({ type: 'NFT', variant: 'primary' });
      } else if (asset.amount > 1) {
        setTokenType({ type: 'Fungible Token', variant: 'warning' });
      }
    }
  }, [asset]);

  return html`
    <div class="container asset">
      <section>
        <sl-input
          style="margin: 0"
          placeholder="Token Name"
          size="large"
          .value=${asset.asset_name.length < 1 ? asset.name : asset.asset_name}
          disabled
        ></sl-input>
        <div>
          <sl-badge style="margin-top:1rem" variant=${tokenType.variant}
            >${tokenType.type}</sl-badge
          >
          <sl-badge style="margin-top:1rem" variant="success"
            >${asset.amount}</sl-badge
          >
        </div>

        <div style="width: 100%; display: flex; justify-content:center;">
          <sl-card
            class="card-overview"
            style="text-align:center; width:100%; max-width: 560px; margin-top: 1rem"
          >
            <div class="skeleton-overview">
              ${asset.image.length > 0
                ? html`
                    <!-- <sl-responsive-media> -->
                    <img
                      style="display: block; margin-bottom:1rem; object-fit: contain; width: 100% "
                      slot="image"
                      src=${asset.image.length > 0
                        ? `${asset.image}`.replace(
                            'ipfs://',
                            'https://ipfs.infura-ipfs.io/ipfs/'
                          )
                        : ''}
                      alt="Token cover"
                    />
                    <!-- </sl-responsive-media> -->
                  `
                : html` <header>
                    <sl-skeleton effect="pulse"></sl-skeleton>
                  </header>`}
              ${asset.name.length > 0
                ? html` <strong>${asset.name}</strong><br /><br />
                    ${asset.description.length > 0
                      ? html` <small>Description</small> <br />
                          ${asset.description}<br />`
                      : null}`
                : html` <sl-skeleton effect="pulse"></sl-skeleton>
                    <sl-skeleton effect="pulse"></sl-skeleton>
                    <sl-skeleton effect="pulse"></sl-skeleton>
                    <sl-skeleton effect="pulse"></sl-skeleton>`}
            </div>
          </sl-card>
        </div>

        <sl-divider style="--spacing: 2rem;"></sl-divider>
        <div style="margin-top:2rem"></div>
        <sl-input
          label="Name*"
          placeholder="What would you like the token to be named?"
          required
          maxlength="64"
          value=${asset.name}
          @input=${(e: { path?: Array<any> }) => {
            if (e.path && e.path.length > 0) {
              setAsset({ ...asset, name: e.path[0].value });
            }
          }}
        ></sl-input>

        <sl-details summary="Do you want to specify a different token name?">
          <sl-input
            label="Asset Name"
            placeholder="Set the asset name. Only numbers and letters. Up to 32 chars"
            maxlength="32"
            value=${asset.asset_name}
            type="text"
            @input=${(e: { path?: Array<any> }) => {
              if (e.path && e.path.length > 0) {
                setAsset({ ...asset, asset_name: e.path[0].value });
              }
            }}
          ></sl-input>
        </sl-details>

        <sl-input
          label="Amount*"
          type="number"
          placeholder="Number of copies for this token. 1 for NFTs and more than 1 for fungible tokens (FTs)"
          min="1"
          value=${asset.amount}
          required
          maxlength="64"
          @input=${(e: { path?: Array<any> }) => {
            if (e.path && e.path.length > 0 && Number(e.path[0].value) > 1) {
              setAsset({ ...asset, amount: Number(e.path[0].value) });
            } else {
              setAsset({ ...asset, amount: 1 });
            }
          }}
          @blur=${(e: { path?: Array<any> }) => {
            if (e.path && e.path.length > 0 && Number(e.path[0].value) > 1) {
              setAsset({ ...asset, amount: Number(e.path[0].value) });
            } else {
              setAsset({ ...asset, amount: 1 });
            }
          }}
        ></sl-input>

        <sl-input
          label="Cover Image*"
          type="url"
          placeholder="Which image would you like to use? IPFS links are recommended"
          required
          maxlength="64"
          value=${asset.image}
          @input=${(e: { path?: Array<any> }) => {
            if (e.path && e.path.length > 0) {
              setAsset({ ...asset, image: e.path[0].value });
            }
          }}
        ></sl-input>

        <sl-details
          summary="Do you want to upload a file to IPFS and use the attachment instead?"
        >
          Select a file to upload. When you're ready, press the upload button to
          start pushing into IPFS.
          <br /><br />
          <input type="file" id="ipfs-fileinput" />

          <sl-button-group>
            <sl-button variant="primary" @click=${requestUpload}
              >Upload file to IPFS</sl-button
            >
            <sl-button variant="warning" outline @click=${clearFile}
              >Clear file</sl-button
            >
          </sl-button-group>
        </sl-details>

        <sl-textarea
          label="Description"
          placeholder="If you wish, write a description about the token"
          value=${asset.description}
          @input=${(e: { path?: Array<any> }) => {
            if (e.path && e.path.length > 0) {
              setAsset({ ...asset, description: e.path[0].value });
            }
          }}
        >
        </sl-textarea>

        <sl-details summary="Additional Files">
          Coming Soon on this interface</sl-details
        >

        <sl-details summary="More Attributes">
          Coming Soon on this interface</sl-details
        >
      </section>
      <!-- <section></section> -->
    </div>
  `;
}
export { AssetForm };
