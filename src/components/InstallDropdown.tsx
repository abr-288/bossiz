import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Smartphone, Apple, Download } from 'lucide-react';

interface InstallDropdownProps {
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const InstallDropdown: React.FC<InstallDropdownProps> = ({ className, size = 'default' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Détecter le type d'appareil
  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'unknown';
  };

  const deviceType = detectDevice();

  const handleInstall = (platform: 'android' | 'ios') => {
    if (platform === 'android') {
      window.open('/install/android', '_blank');
    } else if (platform === 'ios') {
      window.open('/install/ios', '_blank');
    }
  };

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          className={className}
          size={size}
          variant="default"
        >
          <Download className="w-4 h-4 mr-2" />
          Installer
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        ref={dropdownRef}
        className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg"
        align="end"
      >
        <DropdownMenuItem 
          onClick={() => handleInstall('android')}
          className="flex items-center px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Android</div>
            <div className="text-sm text-gray-500">Installation PWA ou Play Store</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleInstall('ios')}
          className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <Apple className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">iOS</div>
            <div className="text-sm text-gray-500">Installation PWA ou App Store</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InstallDropdown;
