import { Helmet } from 'react-helmet-async';
import { HologramViewer } from '@/components/hologram/HologramViewer';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>3D Pepper's Ghost Hologram Viewer</title>
        <meta name="description" content="Interactive 3D hologram viewer optimized for Pepper's Ghost pyramid displays. Control with keyboard, upload 3D models, and create stunning holographic illusions." />
      </Helmet>
      <HologramViewer />
    </>
  );
};

export default Index;
