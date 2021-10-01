import classNames from 'classnames';
import React, { useRef, useEffect, HTMLAttributes } from 'react';

export type VideoSize = 'mini' | 'large';

interface VideoProps extends VideoFromStreamProps {
  size: VideoSize;
  className?: string;
}

type VideoFromStreamProps = {
  srcObject: any;
} & HTMLAttributes<HTMLVideoElement>;

function VideoFromStream(attrs: VideoFromStreamProps) {
  const srcObject = attrs.srcObject;
  const videoRef = useRef<HTMLVideoElement>(null);
  debugger;
  const childAttrs = { ...attrs, ref: videoRef };
  delete childAttrs.srcObject;

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = srcObject;
    if( srcObject !== null ) {
      videoRef.current.play();
    }
  }, [videoRef, srcObject]);

  return React.createElement('video', childAttrs, null);
}

export const Video = ({ size, className, ...props }: VideoProps) => {

  return (
    <div className={
      classNames(
        'relative rounded-xl bg-gray-300', 
        size === 'mini' && 'w-64 shadow-md',
        size === 'large' && 'w-full',
        className
      )}
    >
      <VideoFromStream {...props} className={classNames('absolute w-full h-full transform')} style={{ transform: 'rotateY(180deg)' }} />
    </div>
  )
}