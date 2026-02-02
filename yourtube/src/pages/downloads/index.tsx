import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from '../lib/axiosinstance';
import { useAuth } from '../lib/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Download, Trash2, Play, Calendar } from 'lucide-react';

const DownloadsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    fetchDownloads();
    checkPremiumStatus();
  }, [user]);

  const fetchDownloads = async () => {
    try {
      const response = await axios.get(`/download/history/${user._id}`);
      setDownloads(response.data.downloads);
    } catch (error) {
      console.error('Error fetching downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      const response = await axios.get(`/premium/status/${user._id}`);
      setIsPremium(response.data.isPremium);
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const handleDelete = async (downloadId) => {
    try {
      await axios.delete(`/download/delete/${downloadId}`);
      setDownloads(downloads.filter(d => d._id !== downloadId));
    } catch (error) {
      console.error('Error deleting download:', error);
    }
  };

  const handleDownloadFile = async (videoId, videoTitle) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/${videoId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${videoTitle}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Your Downloads</h1>
                <p className="text-gray-400">
                  {isPremium 
                    ? 'Premium Member - Unlimited Downloads' 
                    : 'Free Plan - 1 download per day'}
                </p>
              </div>
              {!isPremium && (
                <button
                  onClick={() => router.push('/premium')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Upgrade to Premium
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : downloads.length === 0 ? (
              <div className="text-center py-16">
                <Download size={64} className="mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-semibold mb-2">No downloads yet</h2>
                <p className="text-gray-400 mb-6">
                  Videos you download will appear here
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Browse Videos
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {downloads.map((download) => (
                  <div
                    key={download._id}
                    className="bg-gray-900 rounded-lg p-4 flex gap-4 hover:bg-gray-800 transition"
                  >
                    {download.videoId && (
                      <>
                        <div 
                          className="relative w-64 h-36 flex-shrink-0 cursor-pointer group"
                          onClick={() => router.push(`/watch/${download.videoId._id}`)}
                        >
                          <img
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/${download.videoId.videothumbnail}`}
                            alt={download.videoId.videotitle}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
                            <Play size={48} className="text-white opacity-0 group-hover:opacity-100 transition" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 
                            className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-400"
                            onClick={() => router.push(`/watch/${download.videoId._id}`)}
                          >
                            {download.videoId.videotitle}
                          </h3>
                          <p className="text-gray-400 text-sm mb-3">
                            {download.videoId.videochanel?.channelname || 'Unknown Channel'}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar size={16} />
                            <span>Downloaded on {formatDate(download.downloadedAt)}</span>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleDownloadFile(download.videoId.videolink, download.videoId.videotitle)}
                              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                              <Download size={16} />
                              Download Again
                            </button>
                            <button
                              onClick={() => handleDelete(download._id)}
                              className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Remove
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadsPage;
