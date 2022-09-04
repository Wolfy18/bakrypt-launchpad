import { css } from 'lit';
import { html, component, useState, useEffect } from 'haunted';
// import { fileTypeFromBuffer } from 'file-type';
import { useStyles } from '../hooks/useStyles';

const dummyData = '';

function assetFile(
  this: any,
  { url = dummyData, alt = '' }: { url: string; alt: string }
) {
  useStyles(this, [css``]);
  const [file, setFile] = useState(html`
    <!-- <sl-responsive-media> -->
    <p>Downloading file....</p>
    <sl-progress-bar
      style="margin-bottom: 1rem"
      value="0"
      class="progress-bar-values"
      >0%</sl-progress-bar
    >
    <!-- </sl-responsive-media> -->
  `);

  const fileMediaTypeCallback = (mediaType: string) => {
    const event = new CustomEvent('media-type', {
      bubbles: true,
      composed: true,
      detail: { type: mediaType },
    });
    this.dispatchEvent(event);
  };

  useEffect(async () => {
    let response: Response | null = null;

    try {
      response = await fetch(
        url.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/')
      );
    } catch (error) {
      console.log(error);
      setFile(html`<p>Failed to load</p>`);
    }

    try {
      if (response && !response.ok) {
        console.log('failed to load image');
      } else if (response && response.ok && response.body) {
        // Get arrayBuffer
        const mimeType = response.headers.get('Content-Type');
        
        if (mimeType) fileMediaTypeCallback(mimeType);
        if (mimeType?.includes('image')) {
          setFile(html`
            <!-- <sl-responsive-media> -->
            <img
              style="display: block; margin-bottom:1rem; object-fit: contain; width: 100% "
              slot="image"
              src=${url.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/')}
              alt=${alt}
            />
            <!-- </sl-responsive-media> -->
          `);
        } else if (mimeType?.includes('video')) {
          setFile(html`
            <!-- <sl-responsive-media> -->
            <video
              style="display: block; margin-bottom:1rem; object-fit: contain; width: 100% "
              src=${url.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/')}
              alt=${alt}
              controls
            ></video>
            <!-- </sl-responsive-media> -->
          `);
        }
      }
    } catch (error) {
      console.log(error);
      setFile(html`<p>Failed to load</p>`);
    }
  }, [url, alt]);

  return file;
}

export { assetFile };
