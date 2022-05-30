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
        setTokenType({ type: 'Fungible Token', variant: 'neutral' });
      }
    }
  }, [asset]);

  return html`
    <sl-badge variant=${tokenType.variant}>${tokenType.type}</sl-badge>
    <div style="margin-top:2rem"></div>
    <sl-input
      label="Name*"
      placeholder="What would you like people to call you?"
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

    <sl-details summary="Do you want to upload a file to IPFS instead?">
      Select a file to upload and whenevr you're ready press the upload button
      to start pushing into IPFS.
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
      Select a file to upload and whenevr you're ready press the upload button
      to start pushing into IPFS.
    </sl-details>

    <sl-details summary="More Attributes">
      Select a file to upload and whenevr you're ready press the upload button
      to start pushing into IPFS.
    </sl-details>
  `;
}
export { AssetForm };
