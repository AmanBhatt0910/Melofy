'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

export default function CanvasBackground() {
  return (
    <div className="fixed inset-0 -z-10 opacity-20">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars />
      </Canvas>
    </div>
  );
}

function Stars() {
  const ref = useRef();
  const [sphere] = useState(() => 
    random.inSphere(new Float32Array(5000 * 3), { radius: 1.5 })
  );

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points 
        ref={ref} 
        positions={sphere} 
        stride={3} 
        frustumCulled={false}
        key={sphere.length}
      >
        <PointMaterial
          transparent
          color="#1DB954"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}