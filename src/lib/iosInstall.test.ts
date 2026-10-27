import { afterEach, describe, expect, it, vi } from "vitest";
import { getIOSInstallSituation, isIOSDevice } from "./iosInstall";

const UA = {
  safari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  chrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
  oldChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/112.0.5615.46 Mobile/15E148 Safari/604.1",
  facebook:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.40.94]",
  webview:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  ipadDesktop:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
};

const setNavigator = (userAgent: string, maxTouchPoints = 5) => {
  vi.stubGlobal("navigator", { userAgent, maxTouchPoints });
};

afterEach(() => vi.unstubAllGlobals());

describe("isIOSDevice", () => {
  it("recognises iPhone and iPadOS presenting itself as a Mac", () => {
    setNavigator(UA.safari);
    expect(isIOSDevice()).toBe(true);
    setNavigator(UA.ipadDesktop, 5);
    expect(isIOSDevice()).toBe(true);
    setNavigator(UA.ipadDesktop, 0);
    expect(isIOSDevice()).toBe(false);
  });
});

describe("getIOSInstallSituation", () => {
  it("tells Safari from other browsers and in-app browsers", () => {
    setNavigator(UA.safari);
    expect(getIOSInstallSituation()).toBe("safari");
    setNavigator(UA.chrome);
    expect(getIOSInstallSituation()).toBe("other-browser");
    setNavigator(UA.oldChrome);
    expect(getIOSInstallSituation()).toBe("old-other-browser");
    setNavigator(UA.facebook);
    expect(getIOSInstallSituation()).toBe("in-app");
    setNavigator(UA.webview);
    expect(getIOSInstallSituation()).toBe("in-app");
  });
});
