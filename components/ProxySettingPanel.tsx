import React from 'react';
import { ProxySettingPanelProps } from '@/types/proxy';

export const ProxySettingPanel: React.FC<ProxySettingPanelProps> = ({
  isOpen,
  onClose,
  proxyLoading,
  setProxyLoading,
  proxyTimeout,
  setProxyTimeout,
  useProxy,
  setUseProxy,
}) => {
  if (!isOpen) return null;

  const handleProxyReset = () => {
    setProxyLoading({});
    setProxyTimeout({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl p-5 w-5/6 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-bold">動画読み込み設定</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-white">プロキシを使用</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={useProxy} 
                onChange={() => setUseProxy(!useProxy)} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <p className="text-gray-400 text-sm mt-2">
            {useProxy ? 
              "プロキシを使用すると動画視聴制限を回避できますが、読み込みが遅くなる場合があります。" :
              "直接読み込みは高速ですが、一部の動画が表示されない場合があります。"}
          </p>
          
          <div className="mt-4">
            <h4 className="text-white text-sm mb-1">現在の動画読み込み速度:</h4>
            <div className={`py-1 px-2 rounded text-sm ${
              useProxy ? "bg-yellow-600 text-white" : "bg-green-600 text-white"
            }`}>
              {useProxy ? "標準 (プロキシ使用中)" : "高速 (直接読み込み)"}
            </div>
          </div>
          
          <div className="mt-4 border-t border-gray-800 pt-4">
            <h4 className="text-white text-sm mb-2">プロキシが遅い場合:</h4>
            <button
              onClick={handleProxyReset}
              className="w-full py-2 mb-3 bg-blue-800 hover:bg-blue-700 text-white rounded-md text-sm"
            >
              プロキシ接続をリセット
            </button>
            
            <button
              onClick={() => {
                setUseProxy(false);
                onClose();
              }}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm"
            >
              直接モードに切り替え（推奨）
            </button>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};