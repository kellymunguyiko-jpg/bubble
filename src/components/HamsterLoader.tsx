import React from 'react';

export default function HamsterLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster scale-50 sm:scale-75">
        <div className="wheel"></div>
        <div className="hamster">
          <div className="hamster__body">
            <div className="hamster__head">
              <div className="hamster__ear"></div>
              <div className="hamster__eye"></div>
              <div className="hamster__nose"></div>
            </div>
            <div className="hamster__limb hamster__limb--fr"></div>
            <div className="hamster__limb hamster__limb--fl"></div>
            <div className="hamster__limb hamster__limb--br"></div>
            <div className="hamster__limb hamster__limb--bl"></div>
            <div className="hamster__tail"></div>
          </div>
        </div>
        <div className="spoke"></div>
      </div>
      <p className="text-text-sub text-sm animate-pulse">Running to get your messages...</p>
    </div>
  );
}
