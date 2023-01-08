import 'bakrypt-invoice/dist/src/bakrypt-invoice';
declare type StringArrayIAsset = string;
declare function BakryptLaunchpad(this: any, { accessToken, refreshToken, csrfToken, testnet, initial, }: {
    accessToken: string;
    refreshToken: string;
    csrfToken: string;
    testnet: string;
    initial: StringArrayIAsset;
}): import("lit-html").TemplateResult<1>;
export default BakryptLaunchpad;
