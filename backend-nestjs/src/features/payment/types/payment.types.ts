export interface IVnpayParams {
  vnp_Version: string;
  vnp_Command: string;
  vnp_TmnCode: string;
  vnp_Amount: number;
  vnp_BankCode?: string;
  vnp_CreateDate: string;
  vnp_CurrCode: string;
  vnp_IpAddr: string;
  vnp_Locale: string;
  vnp_OrderInfo: string;
  vnp_OrderType: string;
  vnp_ReturnUrl: string;
  vnp_TxnRef: string;
  vnp_SecureHash?: string;
  [key: string]: string | number | undefined;
}

export interface IVnpayIpnResponse {
  RspCode: string;
  Message: string;
}

export interface IMomoCreateRequest {
  partnerCode: string;
  accessKey: string;
  requestId: string;
  amount: number;
  orderId: string;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData: string;
  requestType: string;
  signature: string;
  lang: string;
}

export interface IMomoCreateResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  shortLink: string;
}

export interface IMomoIpnPayload {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}
