export interface IEmqxBannedResponseData {
  data: IEmqxBannedParams[];
  meta: {
    count: number;
    limit: number;
    page: number;
    hasnext: boolean;
  };
}

export interface IEmqxBannedParams {
  as:
    | 'clientid'
    | 'username'
    | 'peerhost'
    | 'clientid_re'
    | 'username_re'
    | 'peerhost_net';
  who: string;
  by?: string;
  reason?: string;
  at?: number | string;
  until?: number | string;
}
