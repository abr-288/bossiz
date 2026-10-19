import { useEffect } from 'react';

const TravelPayoutsScript = () => {
  useEffect(() => {
    // Inject TravelPayouts tracking script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://tpembars.com/NTM2NzY1.js?t=536765';
    script.setAttribute('data-noptimize', '1');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-wpfc-render', 'false');
    script.setAttribute('seraph-accel-crit', '1');
    script.setAttribute('data-no-defer', '1');
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount if needed
      const existingScript = document.querySelector(`script[src="https://tpembars.com/NTM2NzY1.js?t=536765"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return null;
};

export default TravelPayoutsScript;
