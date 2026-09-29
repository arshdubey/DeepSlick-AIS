"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function EarthBackground({ isActive = true }: { isActive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isActiveRef = useRef(isActive);
  const animateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    isActiveRef.current = isActive;
    if (isActive && animateRef.current) {
      animateRef.current();
    }
  }, [isActive]);

  useEffect(() => {
    if (!canvasRef.current) return;

    let animationId: number;
    const canvas = canvasRef.current;
    
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.005);
    
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 28;
    camera.position.y = 0; 
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // 1.5 avoids 4K GPU choke

    // --- LIGHTING (Added front-fill so Earth is never completely black) ---
    const sunLight = new THREE.DirectionalLight(0xffffff, 4.0);
    sunLight.position.set(15, 5, -20);
    scene.add(sunLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 1.5);
    frontLight.position.set(0, 5, 25); // Illuminates the side facing the camera
    scene.add(frontLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const systemGroup = new THREE.Group();
    scene.add(systemGroup);

    // --- TEXTURES WITH UPDATE TRIGGERS ---
    const textureLoader = new THREE.TextureLoader();
    
    const earthGeo = new THREE.SphereGeometry(8, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.1,
    });

    const earthTexture = textureLoader.load(
      '/earth.jpg', // Local fallback to bypass Brave blockers
      () => { earthMat.needsUpdate = true; }
    );
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthMat.map = earthTexture;
    
    const earthNightTexture = textureLoader.load(
      '/earth-night.jpg', // Local fallback to bypass Brave blockers
      () => { earthMat.needsUpdate = true; }
    );
    earthNightTexture.colorSpace = THREE.SRGBColorSpace;
    earthMat.emissiveMap = earthNightTexture;
    earthMat.emissive = new THREE.Color(0xffffff);
    earthMat.emissiveIntensity = 0.8;

    const moonTexture = textureLoader.load('/moon.jpg'); // Local fallback
    moonTexture.colorSpace = THREE.SRGBColorSpace;

    const earthGroup = new THREE.Group();
    systemGroup.add(earthGroup);

    // --- 1. EARTH MESH ---
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.rotation.x = 0.1;
    earth.rotation.y = -1.2; 
    earthGroup.add(earth);

    // --- 2. ATMOSPHERIC GLOW ---
    const atmosGeo = new THREE.SphereGeometry(8 * 1.03, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
          gl_FragColor = vec4(0.0, 0.6, 1.0, 1.0) * intensity * 2.5;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide, 
      transparent: true,
      depthWrite: false,
    });
    earthGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // --- 3. MOON ---
    const moonGroup = new THREE.Group();
    systemGroup.add(moonGroup);
    
    const moonGeo = new THREE.SphereGeometry(2.0, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 1.0,
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(13, 2, -10);
    moon.rotation.y = Math.PI / 4;
    moonGroup.add(moon);

    // --- 3.5 SATELLITE (SAR Surveillance) ---
    const satelliteOrbitGroup = new THREE.Group();
    // Tilt the satellite's orbit
    satelliteOrbitGroup.rotation.x = Math.PI / 6;
    satelliteOrbitGroup.rotation.z = Math.PI / 8;
    systemGroup.add(satelliteOrbitGroup);

    const satellite = new THREE.Group();
    // Position satellite in low earth orbit
    satellite.position.set(9.2, 0, 0);
    // Align so that -X is pointing towards Earth (0,0,0)
    // We don't need to rotate it initially, just build it with SAR antenna on -X
    satelliteOrbitGroup.add(satellite);

    // Materials
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.3 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.4 });
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1a457b, metalness: 0.5, roughness: 0.2 });
    const goldFoilMat = new THREE.MeshStandardMaterial({ color: 0xdaa520, metalness: 0.6, roughness: 0.5 });

    // 1. Central Bus
    const satBusGeo = new THREE.BoxGeometry(0.3, 0.3, 0.4);
    const satBus = new THREE.Mesh(satBusGeo, silverMat);
    satellite.add(satBus);

    // 2. SAR Radar Antenna (Large flat rectangle facing Earth on -X)
    const sarPanelGeo = new THREE.BoxGeometry(0.02, 0.6, 1.2);
    const sarPanel = new THREE.Mesh(sarPanelGeo, darkMetalMat);
    sarPanel.position.set(-0.16, 0, 0); // Offset to be on the Earth-facing side
    satellite.add(sarPanel);

    // 3. Solar Panels (Symmetrical wings along Y axis)
    const solarPanelGeo = new THREE.BoxGeometry(0.4, 1.5, 0.02);
    
    const solarLeft = new THREE.Mesh(solarPanelGeo, solarMat);
    solarLeft.position.set(0, 0.9, 0);
    solarLeft.rotation.y = -Math.PI / 6; // Angle slightly to catch sun
    satellite.add(solarLeft);

    const solarRight = new THREE.Mesh(solarPanelGeo, solarMat);
    solarRight.position.set(0, -0.9, 0);
    solarRight.rotation.y = -Math.PI / 6;
    satellite.add(solarRight);

    // 4. AIS / Comm Antenna (Small rod pointing outward +X)
    const antennaGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.4);
    const antenna = new THREE.Mesh(antennaGeo, silverMat);
    antenna.position.set(0.15, 0, 0.2);
    antenna.rotation.z = Math.PI / 2;
    satellite.add(antenna);

    // 5. Instrument payload box (Gold foil)
    const payloadGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const payload = new THREE.Mesh(payloadGeo, goldFoilMat);
    payload.position.set(0.1, 0, -0.2);
    satellite.add(payload);

    // --- 4. SUN GLARE ---
    const sunGlowGeo = new THREE.PlaneGeometry(60, 60);
    const sunGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: (() => {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext('2d');
        if (ctx) {
          const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
          g.addColorStop(0, 'rgba(255,255,255,1)');
          g.addColorStop(0.2, 'rgba(0, 200, 255, 0.7)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 256, 256);
        }
        return new THREE.CanvasTexture(c);
      })()
    });
    const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
    sunGlow.position.set(15, 5, -25); 
    systemGroup.add(sunGlow);

    // --- 5. STARS ---
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      starPositions[i*3] = (Math.random() - 0.5) * 300;
      starPositions[i*3+1] = (Math.random() - 0.5) * 300;
      starPositions[i*3+2] = -50 - Math.random() * 100;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(starGeometry, starMaterial));

    // --- ANIMATION LOOP (Runs smooth continuously) ---

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      if (!isActiveRef.current) return; // CPU Saver

      animationId = requestAnimationFrame(animate);
      
      const time = performance.now() * 0.001; // Convert to seconds
      
      earth.rotation.y = -1.2 + (time * 0.03); // Continues realistic rotation
      moonGroup.rotation.y = time * 0.1; // Moon revolves around the Earth
      satelliteOrbitGroup.rotation.y = time * 0.4; // Satellite revolves faster
      
      sunGlow.quaternion.copy(camera.quaternion);

      renderer.render(scene, camera);
    };
    
    animateRef.current = animate;
    if (isActiveRef.current) {
      animate();
    }

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      
      // Memory cleanup
      earthGeo.dispose();
      earthMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      goldFoilMat.dispose();
      silverMat.dispose();
      solarMat.dispose();
      darkMetalMat.dispose();
      satBusGeo.dispose();
      sarPanelGeo.dispose();
      solarPanelGeo.dispose();
      antennaGeo.dispose();
      payloadGeo.dispose();
      sunGlowGeo.dispose();
      sunGlowMat.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      
      if (earthTexture) earthTexture.dispose();
      if (earthNightTexture) earthNightTexture.dispose();
      if (moonTexture) moonTexture.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-black -z-10 pointer-events-none">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}
