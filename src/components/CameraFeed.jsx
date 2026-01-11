import React from 'react';

const CameraFeed = () => {
    return (
        <div className="flex justify-center items-center w-full h-full">
            <img
                src="http://localhost:8080/video_feed"
                alt="Live Stream"
                className="max-w-full max-h-full rounded-lg shadow-lg"
            />
        </div>
    );
};

export default CameraFeed;
