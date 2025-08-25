import { CameraControls, Environment, OrbitControls, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Avatar } from "./Avatar";
import React, { useEffect, useState } from "react";
import { memo } from 'react';
export const Experience = memo(function Experience(Response )  {
  const texture = useTexture("textures/images.jpg");
  const viewport = useThree((state) => state.viewport);
  const [botResponse, setCurrentBotResponse] = useState("");
  useEffect(() => {
    if (Response) {
      setCurrentBotResponse(Response);
    }
  }, [Response]);

  return (
    <>
      <OrbitControls
        enableZoom={false} // Disable zooming
        enablePan={false}  // Disable panning
        enableRotate={false} // Disable rotation

      />
      <Avatar  botResponse={botResponse} />
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
});

