import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

// Import local video assets
import v1_1 from '../assets/1-1.mp4';
import v1_2 from '../assets/1-2.mp4';
import v2_1 from '../assets/2-1.mp4';
import v2_2 from '../assets/2-2.mp4';
import v3_1 from '../assets/3-1.mp4';
import v3_2 from '../assets/3-2.mp4';
import v4_1 from '../assets/4-1.mp4';
import v4_2 from '../assets/4-2.mp4';
import v5_1 from '../assets/5-1.mp4';
import v5_2 from '../assets/5-2.mp4';

interface VideoGalleryTabProps {
    isDarkMode: boolean;
}

export const VideoGalleryTab: React.FC<VideoGalleryTabProps> = ({ isDarkMode }) => {
    const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-900';
    const cardBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

    const videos = [
        { id: '1-1', title: 'Subject ID - 684', src: v1_1, filename: '1-1.mp4' },
        { id: '1-2', title: 'Subject ID - 684', src: v1_2, filename: '1-2.mp4' },
        { id: '2-1', title: 'Subject ID - 726', src: v2_1, filename: '2-1.mp4' },
        { id: '2-2', title: 'Subject ID - 726', src: v2_2, filename: '2-2.mp4' },
        { id: '3-1', title: 'Subject ID - 700', src: v3_1, filename: '3-1.mp4' },
        { id: '3-2', title: 'Subject ID - 700', src: v3_2, filename: '3-2.mp4' },
        { id: '4-1', title: 'Subject ID - 722', src: v4_1, filename: '4-1.mp4' },
        { id: '4-2', title: 'Subject ID - 722', src: v4_2, filename: '4-2.mp4' },
        { id: '5-1', title: 'Subject ID - 3', src: v5_1, filename: '5-1.mp4' },
        { id: '5-2', title: 'Subject ID - 3', src: v5_2, filename: '5-2.mp4' },
    ];

    return (
        <div className="space-y-6 p-1">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>Video Gallery</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Collection of recorded sessions and monitoring clips.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map((video, index) => (
                    <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`rounded-xl overflow-hidden shadow-lg border ${cardBg} flex flex-col`}
                    >
                        <div className="relative aspect-video bg-black group">
                            <video
                                controls
                                className="w-full h-full object-contain"
                                poster={undefined} // Could add poster images if available
                            >
                                <source src={video.src} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <Play className="w-4 h-4" fill="currentColor" />
                                </div>
                                <h3 className={`font-semibold text-lg ${textColor}`}>{video.title}</h3>
                            </div>
                            <p className="text-xs text-gray-500 font-mono">{video.filename}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
