import { css } from 'lit';
import { html, component, useState, useEffect } from 'haunted';

// import * as pdfjslib from 'pdfjs-dist';
// const PDFJS = (<any>pdfjslib) as PDFJSStatic;

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
    <sl-spinner style="font-size: 3rem;"></sl-spinner>
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
    setFile(html`
      <!-- <sl-responsive-media> -->
      <sl-spinner style="font-size: 3rem;"></sl-spinner>
      <p>Loading file....</p>
      <!-- </sl-responsive-media> -->
    `);
    try {
      response = await fetch(
        url.replace('ipfs://', 'https://gateway.bakrypt.io/ipfs/')
      );
    } catch (error) {
      console.log(error);
      setFile(html`<p>Failed to load</p>`);
    }

    try {
      if (response && !response.ok) {
        setFile(html`
          <!-- <sl-responsive-media> -->
          <p>File not found.</p>
          <!-- </sl-responsive-media> -->
        `);
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
              src=${url.replace('ipfs://', 'https://gateway.bakrypt.io/ipfs/')}
              alt=${alt}
            />
            <!-- </sl-responsive-media> -->
          `);
        } else if (mimeType?.includes('video')) {
          setFile(html`
            <!-- <sl-responsive-media> -->
            <video
              style="display: block; margin-bottom:1rem; object-fit: contain; width: 100% "
              src=${url.replace('ipfs://', 'https://gateway.bakrypt.io/ipfs/')}
              alt=${alt}
              controls
            ></video>
            <!-- </sl-responsive-media> -->
          `);
        } else if (mimeType?.includes('audio')) {
          setFile(html`
            <!-- <sl-responsive-media> -->
            <audio
              style="display: block; margin-bottom:1rem; object-fit: contain; width: 100% "
              src=${url.replace('ipfs://', 'https://gateway.bakrypt.io/ipfs/')}
              alt=${alt}
              controls
            ></audio>
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
