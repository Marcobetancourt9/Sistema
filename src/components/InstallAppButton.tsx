import { useState, useEffect, useRef } from 'react';
import { Download, Share } from 'lucide-react'; 

export function InstallAppButton({ className }: { className?: string }) {
  const [installable, setInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const deferredPrompt = useRef<any>(null);

  // 1. Detectar dispositivo y si la app ya está instalada
  useEffect(() => {
    // Detectar iOS (iPhone, iPad, iPod o Mac con touch)
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) || 
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
            
    // Detectar si ya se está ejecutando como app independiente (instalada)
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  // 2. Escuchar el evento del navegador que permite instalar
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault(); // Evita que Chrome muestre el prompt nativo de inmediato
      deferredPrompt.current = e; // Guarda el evento para usarlo al hacer clic
      setInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // 3. Función para Android / Chrome / Edge
  const handleInstallClick = async () => {
    if (!deferredPrompt.current) return;

    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    
    console.log(`El usuario ${outcome} la instalación`);
    deferredPrompt.current = null;
    setInstallable(false);
  };

  // 4. Función para iOS (Safari no soporta el prompt automático)
  const showIOSInstructions = () => {
    alert("Para instalar la app en iOS:\n\n1. Toca el ícono de Compartir (el cuadro con la flecha hacia arriba).\n2. Desliza hacia abajo y selecciona 'Añadir a inicio' ➕.");
  };

  // Si ya está instalada (Standalone), no mostramos los botones
  if (isStandalone) return null; 

  return (
    <div className={`flex flex-col gap-3 ${className || ''}`}>
      {installable && (
        <button 
          onClick={handleInstallClick} 
          className="flex items-center justify-center w-full rounded-xl gap-2 h-11 bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-105 font-medium text-sm"
        >
          <Download className="h-4 w-4" /> 
          Instalar App
        </button>
      )}
      
      {/* En iOS casi nunca se dispara 'beforeinstallprompt', por lo que mostramos las instrucciones manuales */}
      {isIOS && !installable && (
        <button 
          onClick={showIOSInstructions} 
          className="flex items-center justify-center w-full rounded-xl gap-2 h-11 border border-blue-500/30 text-blue-400 bg-transparent hover:bg-white/5 transition-all font-medium text-sm"
        >
          <Share className="h-4 w-4" /> 
          Instalar en iOS
        </button>
      )}
    </div>
  );
}
