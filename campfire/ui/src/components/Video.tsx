import classNames from "classnames";
import React, { useRef, useEffect, HTMLAttributes } from "react";

export type VideoSize = "xs-mini" | "mini" | "large";

interface VideoProps extends VideoFromStreamProps {
  size: VideoSize;
  className?: string;
  isScreenshare?: boolean;
  isOur?: boolean;
  muted: boolean;
}

type VideoFromStreamProps = {
  srcObject: MediaStream;
  sinkId?: string;
  controls?: boolean;
} & HTMLAttributes<HTMLMediaElement>;

function VideoFromStream(attrs: VideoFromStreamProps) {
  const srcObject = attrs.srcObject;
  const videoRef = useRef<HTMLAudioElement & { setSinkId (deviceId: string): void }>(null); // add the setSinkId because typescript has an outdated type of MediaElement
  const childAttrs = { ...attrs, autoPlay: true, ref: videoRef };

  // delete the props we use so they don't get passed to the DOM element
  delete childAttrs.srcObject;
  delete childAttrs.sinkId;

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = srcObject;
    if (attrs.sinkId && ('sinkId' in HTMLMediaElement.prototype)) {
      videoRef.current.setSinkId(attrs.sinkId);
    }
  }, [videoRef, srcObject, attrs.sinkId]);

  return React.createElement("video", childAttrs, null);
}

export const Video = ({
  size,
  className,
  isScreenshare,
  isOur,
  ...props
}: VideoProps) => {
  const flipAmt = isOur ? "rotateY(180deg)" : "rotateY(0deg)";

  return (
    <div
      style={{ overflow: "hidden" }}
      className={classNames(
        size === "xs-mini" && "w-20 sm:w-28 shadow-md rounded-xl",
        size === "mini" && "w-32 sm:w-64 rounded-lg",
        size === "large" && "h-1",
        className
      )}
    >
      <VideoFromStream
        {...props}
        className={classNames("h-full w-full object-cover md:object-contain")}
        style={{ transform: flipAmt, objectFit: "cover" }}
      />
    </div>
  );
};
