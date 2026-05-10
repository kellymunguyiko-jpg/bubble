import React from 'react';

/**
 * OfflineLoader component displayed when the user loses internet connection.
 * Based on Uiverse.io design by anand_4957.
 */
export const OfflineLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center flex-col">
      <div className="relative w-full h-full max-w-[300px] max-h-[300px] flex items-center justify-center">
        <div className="speeder-loader">
          <span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>
          <div className="speeder-base">
            <span></span>
            <div className="speeder-face"></div>
          </div>
        </div>
        <div className="longfazers">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div className="mt-12 text-center animate-pulse">
        <h2 className="text-2xl font-bold text-[#111b21] dark:text-[#e9edef] mb-2">Connection Lost</h2>
        <p className="text-[#667781] dark:text-[#8696a0]">Please check your internet connection...</p>
      </div>
    </div>
  );
};

export default OfflineLoader;
