import React, { useCallback } from "react";
import { Dialog, DialogContent } from "./Dialog";

export const SecureWarning = () => {
  const disableDefault = useCallback((e) => e.preventDefault(), []);

  return (
    <Dialog defaultOpen>
      <DialogContent
        onPointerDownOutside={disableDefault}
        onFocusOutside={disableDefault}
        onInteractOutside={disableDefault}
        showCloseIcon={false}
        className="max-w-lg p-8 text-gray-700"
      >
        <p>
          Campfire is built on top of WebRTC which requires HTTPS to function.
          You may need to provision a certificate for your Urbit, or you just
          need to visit the HTTPS version of your site.
        </p>
        <div className="flex items-center mt-4 space-x-4">
          {/* <button className="button bg-gray-400 default-ring" onClick={() => window.close()}>Close urChatFM</button> */}
          <a
            className="button text-pink-900 bg-pink-500 default-ring"
            href={`https://${location.hostname}${location.port && ":" + location.port
              }${location.pathname}`}
          >
            Try HTTPS version of this page
          </a>
          <a
            className="button text-pink-900 bg-pink-500 default-ring"
            href="https://urbit.org/using/os/basics#configuring-ssl"
          >
            Configure SSL certificate
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};
