export interface AccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
}

export interface ErrorResponse {
  error?: string;
  error_description?: string;
  detail?: string;
}

export interface IAssetFile {
  name: string;
  src: string;
  mediaType: string;
}
export interface IAsset {
  uuid?: string;
  blockchain: string;
  name: string;
  asset_name: string;
  image: string;
  media_type: string;
  description: string;
  files: Array<IAssetFile>;
  attrs: object;
  amount: number;
  royalties?: string;
  royalties_rate?: string;
  transaction?: string | ITransaction;
}
export interface ITransaction {
  uuid: string;
  type: string;
  status: string;
  status_description: string;
  fraud_status: string;
  issuer_address: string | null;
  policy_id: string;
  invalid_slot: string;
  cost: string | number;
  surety_bond: string | number;
  convenience_fee: string | number;
  blockchain_fee: string | number;
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
  royalties: string | null;
  royalties_rate: string | number | null;
  royalties_minted: boolean;
  royalties_minted_on: string | null;
  royalties_burned: boolean;
  royalties_burned_on: string | null;
  royalties_estimated_cost: string | number | null;
  expires_on: string;
  name: string;
  image: string;
  description: string;
  amount: number;
}

export interface IFile {
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
