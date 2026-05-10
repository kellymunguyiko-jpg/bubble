import React from 'react';

export default function CatLoader({ variant = 'main' }: { variant?: 'main' | 'mini' }) {
  return (
    <div className={`cat-${variant}`}>
      <div className="cat">
        <div className="cat__body">
          <div className="cat__tail"></div>
        </div>

        <div className="cat__paws">
          <div className="cat__paw cat__paw--left"></div>
          <div className="cat__paw cat__paw--right"></div>
        </div>
        <div className="cat__head">
          <div className="cat__ear cat__ear--left"></div>
          <div className="cat__ear cat__ear--right"></div>
          <div className="cat__eye cat__eye--left"></div>
          <div className="cat__eye cat__eye--right"></div>
          <div className="cat__nose"></div>

          <div className="cat__mouth"></div>
          <div className="cat__whiskers-l"></div>
          <div className="cat__whiskers-r"></div>
        </div>
      </div>
    </div>
  );
}
