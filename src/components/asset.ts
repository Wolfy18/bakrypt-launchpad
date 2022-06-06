import { css } from 'lit';
import {
  html,
  component,
  useState,
  useEffect,
  useReducer,
  useCallback,
} from 'haunted';
import { useStyles } from '../hooks/useStyles';
import { IAsset, IAssetFile } from '../adapters/interfaces';
import SlInput from '@shoelace-style/shoelace/dist/components/input/input';

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

function AssetForm(
  this: any,
  {
    index,
    assetDetailed,
  }: { index: number | string | null; assetDetailed: IAsset }
) {
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

      #additional-files-section .file-input-group {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        grid-gap: 1rem;
        margin-top: 2rem;
        position: relative;
      }

      #additional-attrs-section .file-input-group {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        grid-gap: 1rem;
        margin-top: 2rem;
        position: relative;
      }

      .file-input-group sl-button[variant='danger'] {
        position: absolute;
        top: -2rem;
        right: 0;
      }

      :host .attr-row {
        width: 90%;
        margin: 0 auto;
      }
    `,
  ]);

  const [tokenType, setTokenType] = useState({
    type: 'NFT',
    variant: 'primary',
  });
  const [asset, setAsset] = useState(assetDetailed || { ..._asset });

  const clearFile = () => {};

  const requestUpload = (inputfile: any, input: HTMLInputElement | SlInput) => {
    const payload = new FormData();

    // const inputfile: HTMLInputElement =
    //   this.shadowRoot.querySelector(fileInput.id);

    if (inputfile && inputfile.files) {
      // do
      payload.set('file', inputfile.files[0]);
    }

    const event = new CustomEvent('upload-file', {
      bubbles: true,
      composed: true,
      detail: { payload, index, input },
    });

    this.dispatchEvent(event);
  };

  // Return callback with the token information
  const tokenCallback = () => {
    console.log(asset, '<========= from callback');
    setAsset(asset);
    const event = new CustomEvent('token', {
      bubbles: true,
      composed: true,
      detail: { token: asset, index: String(index) },
    });

    this.dispatchEvent(event);
  };

  const addAttribute = (name: keyof Object) => {
    const section = this.shadowRoot.querySelector('#additional-attrs-section');
    const container = section.querySelector('.container');

    if (section && container) {
      // create object and append it to files dictionary
      Object.defineProperty(asset.attrs, name, {
        value: '',
        writable: true,
        configurable: true,
      });

      // Create input group: name, src, mediaType.
      // Link input event to the file keys
      const nameInput = document.createElement('sl-input');
      nameInput.label = 'Key';
      nameInput.type = 'text';
      nameInput.placeholder = 'Set attribute name';
      nameInput.value = name;
      nameInput.setAttribute('disabled', 'disabled');

      const valueInput = document.createElement('sl-input');
      valueInput.label = 'Value';
      valueInput.type = 'text';
      valueInput.placeholder = 'Set the attribute value';

      valueInput.addEventListener('input', (e: any) => {
        if (e.path && e.path.length > 0) {
          asset.attrs[name] = e.path[0].value;

          // Update asset object
          asset.attrs = { ...asset.attrs };
          tokenCallback();
        }
      });

      // Create group
      const group: HTMLElement = document.createElement('div');
      group.classList.add('file-input-group');
      group.appendChild(nameInput);
      group.appendChild(valueInput);
      const delFile = document.createElement('sl-button');
      delFile.name = 'gear';
      delFile.variant = 'danger';
      delFile.innerHTML = 'Delete';
      delFile.size = 'small';

      group.appendChild(delFile);

      // Append input group to section
      container.appendChild(group);
      // valueInput.focus();
      // Remove group and file listener
      delFile.addEventListener('click', () => {
        container.removeChild(group);
        // Delete
        delete asset.attrs[name];

        // Update asset object
        asset.attrs = { ...asset.attrs };
        tokenCallback();
      });
    }
  };

  const addFile = () => {
    const section = this.shadowRoot.querySelector('#additional-files-section');
    const container = section.querySelector('.container');
    if (section && container) {
      // create object and append it to files dictionary
      const file: IAssetFile = { name: '', src: '', mediaType: '' };

      if (!asset.files || !Array.isArray(asset.files)) {
        asset.files = [];
      }

      // Create input group: name, src, mediaType.
      // Link input event to the file keys
      const nameInput = document.createElement('sl-input');
      nameInput.label = 'Name';
      nameInput.type = 'text';
      nameInput.placeholder = 'Name of the file';
      nameInput.addEventListener('input', (e: any) => {
        if (e.path && e.path.length > 0) {
          file.name = e.path[0].value;
          tokenCallback();
        }
      });

      const srcInput = document.createElement('sl-input');
      srcInput.label = 'Src';
      srcInput.type = 'text';
      srcInput.placeholder = 'Set the image source like IPFS';

      srcInput.addEventListener('input', (e: any) => {
        if (e.path && e.path.length > 0) {
          file.src = e.path[0].value;
          tokenCallback();
        }
      });

      const mediaTypeInput = document.createElement('sl-input');
      mediaTypeInput.label = 'MediaType';
      mediaTypeInput.type = 'text';
      mediaTypeInput.placeholder = 'Media type e.g. image/jpg';
      mediaTypeInput.addEventListener('input', (e: any) => {
        if (e.path && e.path.length > 0) {
          file.mediaType = e.path[0].value;
          tokenCallback();
        }
      });

      asset.files.push(file);
      const fileIndx = asset.files.length - 1;
      // Create group
      const group: HTMLElement = document.createElement('div');
      group.classList.add('file-input-group');
      group.appendChild(nameInput);
      group.appendChild(srcInput);
      group.appendChild(mediaTypeInput);

      // Add file upload group
      const btnGroup = document.createElement('sl-button-group');
      const fileInputForm = document.createElement('input');
      fileInputForm.type = 'file';
      const uploadFileBtn = document.createElement('sl-button');
      uploadFileBtn.addEventListener('click', () => {
        requestUpload(fileInputForm, srcInput);
      });
      uploadFileBtn.variant = 'primary';
      uploadFileBtn.innerHTML = 'Upload file to IPFS';
      const clearFileBtn = document.createElement('sl-button');
      clearFileBtn.variant = 'warning';
      clearFileBtn.setAttribute('outline', '');
      clearFileBtn.addEventListener('click', clearFile);
      clearFileBtn.innerHTML = 'Clear File';
      btnGroup.appendChild(fileInputForm);
      btnGroup.appendChild(uploadFileBtn);
      btnGroup.appendChild(clearFileBtn);

      const delFile = document.createElement('sl-button');
      delFile.name = 'gear';
      delFile.variant = 'danger';
      delFile.innerHTML = 'Delete';
      delFile.size = 'small';

      group.appendChild(delFile);

      // Append input group to section
      container.appendChild(group);

      const divider = document.createElement('sl-divider');
      divider.setAttribute('style', '--spacing:2rem');
      container.appendChild(btnGroup);
      container.appendChild(divider);

      // Remove group and file listener
      delFile.addEventListener('click', (e: Event) => {
        container.removeChild(group);
        console.log(delFile);
        console.log(e);
        // Delete
        console.log(file, ' <======= delete this guy');
        console.log(asset.files, ' <<<==== from here...');
        asset.files = asset.files.filter(i => i !== file);
        tokenCallback();

        console.log(asset.files);
        console.log('we need to reindex the buttons. Do we?');
      });
    }
  };

  const openAttrDialog = () => {
    const dialog = this.shadowRoot.querySelector('#attr-dialog');
    if (dialog) {
      dialog.show();
    }
  };

  const closeAttrDialog = () => {
    const dialog = this.shadowRoot.querySelector('#attr-dialog');
    if (dialog) {
      dialog.hide();
    }
  };

  useEffect(() => {
    console.log(index, '<===== INDEX');
    console.log(asset);
    console.log(assetDetailed, ' <=========== assetDEtailed');

    if (asset) {
      if (asset.amount === 1) {
        setTokenType({ type: 'NFT', variant: 'primary' });
      } else if (asset.amount > 1) {
        setTokenType({ type: 'Fungible Token', variant: 'warning' });
      }
    }

    // console.log('Checking for existence...');
    // if (assetDetailed) {
    //   console.log(assetDetailed, ' <=========== this is the assetdetailed');
    //   setAsset(assetDetailed);
    // }

    tokenCallback();
  }, [index, asset]);

  return html`
    <sl-input
      style="margin: 0"
      placeholder="Token Name"
      size="large"
      .value=${asset.asset_name.length < 1 ? asset.name : asset.asset_name}
      disabled
    ></sl-input>
    <div class="container asset">
      <section>
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
            placeholder="Set the asset name. Only numbers and letters. Up to 32 characters"
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
          label="Token unit amount*"
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
          id="cover-image-input"
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
            <sl-button
              variant="primary"
              @click=${() => {
                const input =
                  this.shadowRoot.querySelector('#cover-image-input');
                const fileInput =
                  this.shadowRoot.querySelector('#ipfs-fileinput');
                if (input) {
                  requestUpload(fileInput, input);
                }
              }}
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

        <sl-details summary="Additional Files" id="additional-files-section">
          <div class="container"></div>
          <sl-button variant="success" @click=${addFile}>Add File</sl-button>
        </sl-details>

        <sl-details summary="More Attributes" id="additional-attrs-section">
          <div class="container"></div>
          <sl-button variant="success" @click=${openAttrDialog}
            >Add Attribute</sl-button
          ></sl-details
        >
      </section>
      <section>
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
                ? html`
                    <h1><strong>${asset.name}</strong></h1>
                    ${asset.description.length > 0
                      ? html`
                          <small>Description</small> <br />
                          <p>${asset.description}</p>
                        `
                      : null}
                  `
                : html`
                    <sl-skeleton effect="pulse"></sl-skeleton>
                    <sl-skeleton effect="pulse"></sl-skeleton>
                  `}
              ${asset.files && asset.files.length > 0
                ? asset.files.map(
                    i =>
                      html`<div class="attr-row">
                        <img
                          style="display: block; margin-bottom:1rem; object-fit: contain; width: 100% "
                          slot="image"
                          src=${i.src.replace(
                            'ipfs://',
                            'https://ipfs.infura-ipfs.io/ipfs/'
                          )}
                          alt=${i.name}
                        />
                        <h3>${i.name}</h3>
                      </div>`
                  )
                : html`<sl-skeleton effect="pulse"></sl-skeleton>
                    <sl-skeleton effect="pulse"></sl-skeleton>`}
              ${asset.attrs && Object.keys(asset.attrs).length > 0
                ? Object.keys(asset.attrs).map(
                    (i: any) =>
                      html`<div class="attr-row">
                        <h4 style="margin-bottom: 0.5rem">${String(i)}</h4>
                        <p style="margin-top: 0;">
                          ${asset.attrs[i as keyof Object]}
                        </p>
                      </div>`
                  )
                : null}
            </div>
          </sl-card>
        </div>
      </section>

      <!-- Attributes dialog -->
      <sl-dialog
        label="Additional attribute"
        class="dialog-focus"
        id="attr-dialog"
      >
        <sl-input
          id="attr-dialog-input"
          autofocus
          style="margin-bottom: 0"
          placeholder="Set property name"
        ></sl-input>
        <sl-button
          slot="footer"
          variant="primary"
          @click=${() => {
            const input = this.shadowRoot.querySelector('#attr-dialog-input');
            if (input) {
              addAttribute(input.value);
              input.value = '';
              closeAttrDialog();
            }
          }}
          >Add</sl-button
        >
      </sl-dialog>
    </div>
  `;
}

export { AssetForm };
