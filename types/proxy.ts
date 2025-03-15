export interface ProxySettingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  proxyLoading: Record<string, boolean>;
  setProxyLoading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  proxyTimeout: Record<string, boolean>;
  setProxyTimeout: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  useProxy: boolean;
  setUseProxy: React.Dispatch<React.SetStateAction<boolean>>;
}
