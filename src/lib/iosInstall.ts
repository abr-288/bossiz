// Où en est le visiteur pour installer le site sur iPhone / iPad ?
// iOS n'a pas de bouton « Installer » : on passe par Partager > Sur l'écran
// d'accueil, possible dans Safari, et depuis iOS 16.4 dans Chrome, Edge et
// Firefox. Les navigateurs intégrés aux applications (Facebook, Instagram,
// TikTok…) ne le permettent jamais : il faut d'abord ouvrir la page dans Safari.

export type IOSInstallSituation = "safari" | "other-browser" | "old-other-browser" | "in-app";

const IN_APP =
  /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|BytedanceWebview|Twitter|LinkedInApp|Pinterest|GSA\//;
const OTHER_BROWSER = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo/;

export const isIOSDevice = () => {
  const ua = navigator.userAgent;
  // iPadOS 13+ se présente comme un Mac : on le reconnaît à l'écran tactile.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
};

const iosVersion = () => {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  return match ? Number(match[1]) + Number(match[2]) / 100 : 0;
};

export const getIOSInstallSituation = (): IOSInstallSituation => {
  const ua = navigator.userAgent;
  if (IN_APP.test(ua)) return "in-app";
  if (OTHER_BROWSER.test(ua)) return iosVersion() >= 16.04 ? "other-browser" : "old-other-browser";
  // Sans « Safari » dans l'agent, c'est la vue web d'une application.
  return /Safari/.test(ua) ? "safari" : "in-app";
};
