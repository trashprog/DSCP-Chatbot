import React from 'react';
import '../WormLoader.css'; // Make sure to import the CSS

export const WormLoader = () => {
    return (
        <div className="worm-loader">
            <span className="dot dot1" />
            <span className="dot dot2" />
            <span className="dot dot3" />
        </div>
    );
}
