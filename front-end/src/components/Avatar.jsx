import * as THREE from "three";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";


const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

export function Avatar({ botResponse }) {
  const [audioSrc, setAudioSrc] = useState(null);
  const [lipsync, setLipsync] = useState(null);
  const audioRef = useRef(null);
  const group = useRef();
  const smoothMorphTarget=true;
  const morphTargetSmoothing = 0.7; // Smooth factor for morph target blending
  const intervalRef = useRef(null); // Store the interval reference for cleanup
  const [currentAnimation, setCurrentAnimation] = useState("Idle");
  const headFollow=true;
  const { nodes, materials } = useGLTF("models/67b8b162f9aa33fca2cce455 (2).glb");
  const idleAnimation = useFBX("/animations/Idle.fbx");
  const angryAnimation = useFBX("/animations/Talking.fbx");
  const greetingAnimation=useFBX("/animations/Thinking.fbx")

  idleAnimation.animations[0].name = "Idle";
  angryAnimation.animations[0].name = "Talking";
  greetingAnimation.animations[0].name = "Thinking";
  const animations = [idleAnimation.animations[0], angryAnimation.animations[0],greetingAnimation.animations[0]];
  const { actions } = useAnimations(animations, group);

  // Handle animation changes
  useEffect(() => {
    if (actions && actions[currentAnimation]) {
      actions[currentAnimation].reset().fadeIn(0.5).play();

      return () => {
        actions[currentAnimation]?.fadeOut(0.5);
      };
    }
  }, [actions, currentAnimation]);

 useEffect(() => {
  if (!botResponse) return;

  let objectUrl;
  const fetchAudioAndLipsync = async () => {
    try {
      // Stop current audio and clear intervals if they exist
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0; // Reset playback position
        audioRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Fetch new audio
      const audioResponse = await fetch("http://localhost:8000/get_audio/");
      if (audioResponse.ok) {
        const blob = await audioResponse.blob();
        objectUrl = URL.createObjectURL(blob);
        console.log("Audio URL:", objectUrl);
        setAudioSrc(objectUrl);
      } else {
        console.error("Failed to fetch audio");
      }

      // Fetch new lipsync data
      const lipsyncResponse = await fetch("http://localhost:8000/get_lypsync/");
      if (lipsyncResponse.ok) {
        const lipsyncData = await lipsyncResponse.json();
        console.log("Lipsync Data:", lipsyncData);
        setLipsync(lipsyncData);
      } else {
        console.error("Failed to fetch lipsync JSON");
      }
    } catch (error) {
      console.error("Error fetching audio and lipsync:", error);
    }
  };

  fetchAudioAndLipsync();

  return () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}, [botResponse]);



useEffect(() => {
  if (!audioSrc || !lipsync) return;

  const audio = new Audio(audioSrc);
  audioRef.current = audio;
  console.log("Audio object:", audio);

  // Wait until the audio can play before starting playback
  const playAudio = async () => {
    try {
      await audio.play();
      setCurrentAnimation("Talking"); // Example animation during playback
      
      // Update lipsync at regular intervals
      intervalRef.current = setInterval(() => {
        const currentAudioTime = audio.currentTime;

        if (audio.paused || audio.ended) {
          setCurrentAnimation("Idle");
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return;
        }

        // Reset all morph target influences
        Object.values(corresponding).forEach((value) => {
          if (!smoothMorphTarget) {
            nodes.Wolf3D_Head.morphTargetInfluences[
              nodes.Wolf3D_Head.morphTargetDictionary[value]
            ] = 0;
            nodes.Wolf3D_Teeth.morphTargetInfluences[
              nodes.Wolf3D_Teeth.morphTargetDictionary[value]
            ] = 0;
          } else {
            nodes.Wolf3D_Head.morphTargetInfluences[
              nodes.Wolf3D_Head.morphTargetDictionary[value]
            ] = THREE.MathUtils.lerp(
              nodes.Wolf3D_Head.morphTargetInfluences[
                nodes.Wolf3D_Head.morphTargetDictionary[value]
              ],
              0,
              morphTargetSmoothing
            );
    
            nodes.Wolf3D_Teeth.morphTargetInfluences[
              nodes.Wolf3D_Teeth.morphTargetDictionary[value]
            ] = THREE.MathUtils.lerp(
              nodes.Wolf3D_Teeth.morphTargetInfluences[
                nodes.Wolf3D_Teeth.morphTargetDictionary[value]
              ],
              0,
              morphTargetSmoothing
              
            );
          }
        });
        

        // Apply the current morph targets based on lipsync data
        for (const mouthCue of lipsync.mouthCues) {
          if (
            currentAudioTime >= mouthCue.start &&
            currentAudioTime <= mouthCue.end
          ) {
            if (!smoothMorphTarget) {
              nodes.Wolf3D_Head.morphTargetInfluences[
                nodes.Wolf3D_Head.morphTargetDictionary[
                  corresponding[mouthCue.value]
                ]
              ] = 1;
              nodes.Wolf3D_Teeth.morphTargetInfluences[
                nodes.Wolf3D_Teeth.morphTargetDictionary[
                  corresponding[mouthCue.value]
                ]
              ] = 1;
            } else {
              nodes.Wolf3D_Head.morphTargetInfluences[
                nodes.Wolf3D_Head.morphTargetDictionary[
                  corresponding[mouthCue.value]
                ]
              ] = THREE.MathUtils.lerp(
                nodes.Wolf3D_Head.morphTargetInfluences[
                  nodes.Wolf3D_Head.morphTargetDictionary[
                    corresponding[mouthCue.value]
                  ]
                ],
                1,
                morphTargetSmoothing
              );
              nodes.Wolf3D_Teeth.morphTargetInfluences[
                nodes.Wolf3D_Teeth.morphTargetDictionary[
                  corresponding[mouthCue.value]
                ]
              ] = THREE.MathUtils.lerp(
                nodes.Wolf3D_Teeth.morphTargetInfluences[
                  nodes.Wolf3D_Teeth.morphTargetDictionary[
                    corresponding[mouthCue.value]
                  ]
                ],
                1,
                morphTargetSmoothing
              );
            }
            console.log(mouthCue.value)
            break;
          }
        }
      }, 100); // Run at 100ms intervals for smooth updates
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  playAudio();

  return () => {
    audio.pause();
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };
}, [audioSrc, lipsync]);

useFrame((state) => {
  if (headFollow) {
    group.current.getObjectByName("Head").lookAt(state.camera.position);
  }
});


  return (
    <group position={[0, -4.5, 5.5]} scale={3} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Glasses"
        geometry={nodes.Wolf3D_Glasses.geometry}
        material={materials.Wolf3D_Glasses}
        skeleton={nodes.Wolf3D_Glasses.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Glasses.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Glasses.morphTargetInfluences}
      />
    </group>
  );
}

useGLTF.preload("models/67b8b162f9aa33fca2cce455 (2).glb");
