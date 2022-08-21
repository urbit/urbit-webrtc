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
  controls?: boolean;
} & HTMLAttributes<HTMLVideoElement>;

function VideoFromStream(attrs: VideoFromStreamProps) {
  const srcObject = attrs.srcObject;
  const videoRef = useRef<HTMLVideoElement>(null);
  const childAttrs = { ...attrs, autoPlay: true, ref: videoRef };
  delete childAttrs.srcObject;

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = srcObject;
  }, [videoRef, srcObject]);

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
