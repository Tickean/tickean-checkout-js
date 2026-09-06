import type { MercadoPagoTransferOs } from "./mercadopago-transfer";

const BANK_LOGO_BASE = "https://www.tickean.com/images/banks";

export type BankingApp = {
  id: string;
  name: string;
  imageUrl: string;
  deepLinks: {
    ios: string | null;
    android: string;
  };
  webUrl?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
  transferFormat?: {
    cvu?: boolean;
    alias?: boolean;
    amount?: boolean;
    reference?: boolean;
  };
};

/** Curated AR banking apps for the headless transfer “open bank app” picker. */
export const BANKING_APPS: BankingApp[] = [
  {
    id: "mercadopago",
    name: "Mercado Pago",
    imageUrl: `${BANK_LOGO_BASE}/mercadopago.svg`,
    deepLinks: {
      ios: "mercadopago://send?amount={amount}&description={reference}",
      android:
        "https://852u.adj.st/home/?adj_t=mqo65e0&adj_label=nav_mp_login&adj_campaign=nav_mp_login&adj_fallback=https%3A%2F%2Fwww.mercadolibre.com%2Fjms%2Fmla%2Flgz%2Flogin%3Fplatform_id%3DMP%26go%3Dhttps%253A%252F%252Fwww.mercadopago.com.ar%252F%26loginType%3Dexplicit&adj_redirect_macos=https%3A%2F%2Fwww.mercadolibre.com%2Fjms%2Fmla%2Flgz%2Flogin%3Fplatform_id%3DMP%26go%3Dhttps%253A%252F%252Fwww.mercadopago.com.ar%252F%26loginType%3Dexplicit",
    },
    webUrl: "https://www.mercadopago.com.ar/",
    appStoreUrl: "https://apps.apple.com/ar/app/mercado-pago/id925436649",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.mercadopago.wallet",
    transferFormat: { amount: true, reference: true },
  },
  {
    id: "modo",
    name: "Modo",
    imageUrl: `${BANK_LOGO_BASE}/modo.svg`,
    deepLinks: {
      ios: "modo://send?amount={amount}&description={reference}",
      android: "intent://#Intent;package=com.playdigital.modo;end",
    },
    webUrl: "https://www.modo.com.ar/",
    appStoreUrl: "https://apps.apple.com/ar/app/modo/id1530606263",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.playdigital.modo&hl=es_AR",
    transferFormat: { amount: true, reference: true },
  },
  {
    id: "banco-nacion",
    name: "BNA+",
    imageUrl: `${BANK_LOGO_BASE}/banco-nacion.svg`,
    deepLinks: {
      ios: "bnamas://send?amount={amount}&description={reference}",
      android: "intent://#Intent;package=com.banconacion.bnamas;end",
    },
    webUrl: "https://hb.redlink.com.ar/bna/login.htm",
    appStoreUrl: "https://apps.apple.com/ar/app/bna/id1523383806",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.banconacion.bnamas&hl=es_AR",
    transferFormat: { amount: true, reference: true },
  },
  {
    id: "banco-santander",
    name: "Banco Santander",
    imageUrl: `${BANK_LOGO_BASE}/banco-santander.svg`,
    deepLinks: {
      ios: "srio://send?amount={amount}&description={reference}",
      android: "intent://#Intent;package=ar.com.santander.rio.mbanking;end",
    },
    webUrl: "https://www2.personas.santander.com.ar/obp-webapp/angular/#!/login",
    appStoreUrl:
      "https://apps.apple.com/ar/app/santander-argentina/id626971464",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=ar.com.santander.rio.mbanking&hl=es_AR",
    transferFormat: { amount: true, reference: true },
  },
  {
    id: "banco-galicia",
    name: "Banco Galicia",
    imageUrl: `${BANK_LOGO_BASE}/banco-galicia.svg`,
    deepLinks: {
      ios: "galicia://send?amount={amount}&description={reference}",
      android: "intent://#Intent;package=com.mosync.app_Banco_Galicia;end",
    },
    webUrl: "https://onlinebanking.bancogalicia.com.ar/login?",
    appStoreUrl:
      "https://apps.apple.com/ar/app/galicia-el-banco-en-tu-celu/id774860115",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.mosync.app_Banco_Galicia",
    transferFormat: { amount: true, reference: true },
  },
  {
    id: "uala",
    name: "Ualá",
    imageUrl: `${BANK_LOGO_BASE}/uala.svg`,
    deepLinks: {
      ios: "uala://send?amount={amount}&description={reference}",
      android: "intent://#Intent;package=ar.com.bancar.uala;end",
    },
    webUrl: "https://www.uala.com.ar/",
    appStoreUrl: "https://apps.apple.com/ar/app/ual%C3%A1/id1279808159",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=ar.com.bancar.uala&hl=es_US&gl=AR",
    transferFormat: { amount: true, reference: true },
  },
  {
    id: "banco-macro",
    name: "Banco Macro",
    imageUrl: `${BANK_LOGO_BASE}/banco-macro.svg`,
    deepLinks: {
      ios: "macroapp://send?amount={amount}&description={reference}",
      android: "intent://#Intent;package=ar.macro;end",
    },
    webUrl: "https://www.macro.com.ar/bancainternet/#",
    appStoreUrl: "https://apps.apple.com/ar/app/macro/id1173611617",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=ar.macro&hl=es_AR",
    transferFormat: { amount: true, reference: true },
  },
  {
    id: "naranja-x",
    name: "Naranja X",
    imageUrl: `${BANK_LOGO_BASE}/naranja-x.svg`,
    deepLinks: {
      ios: "nx://send?amount={amount}&description={reference}",
      android: "intent://#Intent;package=com.tarjetanaranja.ncuenta;end",
    },
    webUrl: "https://www.naranjax.com/cuenta",
    appStoreUrl:
      "https://apps.apple.com/ar/app/naranja-x-tu-plata-crece/id1452691757",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.tarjetanaranja.ncuenta&hl=es&gl=AR",
    transferFormat: { amount: true, reference: true },
  },
  {
    id: "brubank",
    name: "Brubank",
    imageUrl: `${BANK_LOGO_BASE}/brubank.svg`,
    deepLinks: {
      ios: "brubank://send?amount={amount}&description={reference}",
      android: "intent://#Intent;package=com.brubank;end",
    },
    webUrl: "https://www.brubank.com/",
    appStoreUrl:
      "https://apps.apple.com/es/app/brubank-banco-digital/id1295202448",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.brubank&hl=es_AR",
    transferFormat: { amount: true, reference: true },
  },
  {
    id: "banco-bbva",
    name: "BBVA",
    imageUrl: `${BANK_LOGO_BASE}/banco-bbva.svg`,
    deepLinks: {
      ios: "bbva://send?amount={amount}&description={reference}",
      android: "intent://#Intent;package=com.bbva.nxt_argentina;end",
    },
    webUrl: "https://www.bbva.com.ar/",
    appStoreUrl: "https://apps.apple.com/ar/app/bbva-argentina/id445953532",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.bbva.nxt_argentina&hl=es_AR",
    transferFormat: { amount: true, reference: true },
  },
];

export type TransferDeeplinkData = {
  amount: string | number;
  cvu?: string;
  alias?: string;
  reference?: string;
};

export function generateDeepLink(
  app: BankingApp,
  deviceOs: MercadoPagoTransferOs,
  transferData: TransferDeeplinkData,
): string {
  if (deviceOs === "unknown") {
    return app.playStoreUrl || app.appStoreUrl || app.webUrl || "#";
  }

  let deepLink =
    deviceOs === "ios" ? app.deepLinks.ios : app.deepLinks.android;
  if (!deepLink) {
    return (
      (deviceOs === "ios" ? app.appStoreUrl : app.playStoreUrl) ||
      app.webUrl ||
      "#"
    );
  }

  if (app.transferFormat?.cvu && transferData.cvu) {
    deepLink = deepLink.replace(
      "{cvu}",
      encodeURIComponent(transferData.cvu),
    );
  }
  if (app.transferFormat?.alias && transferData.alias) {
    deepLink = deepLink.replace(
      "{alias}",
      encodeURIComponent(transferData.alias),
    );
  }
  if (app.transferFormat?.amount && transferData.amount != null) {
    deepLink = deepLink.replace(
      "{amount}",
      encodeURIComponent(String(transferData.amount)),
    );
  }
  if (app.transferFormat?.reference && transferData.reference) {
    deepLink = deepLink.replace(
      "{reference}",
      encodeURIComponent(transferData.reference),
    );
  }

  return deepLink;
}

export function getWebBankingUrl(app: BankingApp): string {
  return (
    app.webUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(app.name + " homebanking")}`
  );
}
