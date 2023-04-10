import * as THREE from "three";

import { Canvas, useFrame } from "@react-three/fiber";
import { createRef, forwardRef, useEffect, useRef, useState } from "react";

import { InfuraProvider } from "@ethersproject/providers";
import { OrbitControls } from "@react-three/drei";
import { Text } from "troika-three-text";
import { extend } from "@react-three/fiber";
import { useDrag } from "react-use-gesture";

extend({ Text });

// eslint-disable-next-line react/display-name
const Block = forwardRef(({ position, text, color, index, chainRefs }, ref) => {
  const [wrappedText, setWrappedText] = useState("");

  useEffect(() => {
    const wrapText = (text, maxLength) => {
      let wrapped = "";
      const words = text.split(" ");
      let line = "";

      for (const word of words) {
        if (line.length + word.length + 1 > maxLength) {
          wrapped += line.trim() + "\n";
          line = "";
        }
        line += word + " ";
      }

      wrapped += line.trim();
      return wrapped;
    };

    setWrappedText(wrapText(text, 15));
  }, [text]);

  const bind = useDrag(
    ({ event, active, movement: [x, y], memo = position }) => {
      event.stopPropagation();
      if (ref.current) {
        ref.current.position.set(memo[0] + x / 100, memo[1] - y / 100, 0);
      }
      return memo;
    }
  );

  return (
    <group ref={ref} {...bind()} position={position}>
      <mesh>
        <boxGeometry args={[2, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0, 0.51]}>
        <text
          anchorX="center"
          anchorY="middle"
          fontSize={0.18}
          color="#000"
          lineHeight={1}
          text={wrappedText}
        >
          <meshStandardMaterial />
        </text>
      </mesh>
    </group>
  );
});

const Chain = ({ start, end }) => {
  const chain = useRef();

  useFrame(() => {
    if (chain.current && start.current && end.current) {
      const points = [start.current.position, end.current.position];
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 64, 0.05, 8, false);
      chain.current.geometry.dispose();
      chain.current.geometry = geometry;
    }
  });

  return (
    <mesh ref={chain}>
      <tubeGeometry
        args={[
          new THREE.CatmullRomCurve3([
            start.current?.position || new THREE.Vector3(),
            end.current?.position || new THREE.Vector3(),
          ]),
          64,
          0.05,
          8,
          false,
        ]}
      />
      <meshStandardMaterial color="#999" />
    </mesh>
  );
};

const INFURA_PROJECT_ID = "4ba5ffb74fc748d6a618bfd246425e74"; // Replace with your Infura Project ID
const provider = new InfuraProvider("mainnet", INFURA_PROJECT_ID);

async function getLatest20Blocks() {
  try {
    const latestBlockNumber = await provider.getBlockNumber();

    const blockPromises = [];
    for (let i = 0; i < 20; i++) {
      const blockNumber = latestBlockNumber - i;
      blockPromises.push(provider.getBlock(blockNumber));
    }

    const blocks = await Promise.all(blockPromises);
    return blocks;
  } catch (error) {
    console.error("Error fetching latest 20 Ethereum blocks:", error);
    return [];
  }
}

const Blockchain = () => {
  const [blockData, setBlockData] = useState([]);
  console.log({ blockData });
  const blockRefs = useRef([]);

  useEffect(() => {
    (async () => {
      const blocks = await getLatest20Blocks();
      const mappedBlocks = blocks.map((block, index) => ({
        text: `Hash: ${block.hash.substring(0, 3)}...${block.hash.substring(
          block.hash.length - 3
        )} Block #: ${block.number}`,
        color: index === 0 ? "purple" : `hsl(${(index * 10) % 360}, 60%, 50%)`,
      }));
      setBlockData(mappedBlocks);
    })();
  }, []);

  useEffect(() => {
    blockRefs.current = blockData.map(() => createRef());
    console.log({ blockRefs });
  }, [blockData.length, blockData, blockRefs]);

  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      {blockData.length > 0 ? (
        blockData.map((block, index) => (
          <Block
            key={`${index}block`}
            position={[-5 + (index % 5) * 3, -Math.floor(index / 5) * 3, 0]}
            text={block.text}
            color={block.color}
            index={index}
            ref={blockRefs.current[index]}
          />
        ))
      ) : (
        <Block key="loading" text="Loading blocks" color="purple" index={0} />
      )}
      {blockData.length > 0 ? (
        blockData
          .slice(0, -1)
          .map((block, index) => (
            <Chain
              key={`${index}chain`}
              start={blockRefs.current[index]}
              end={blockRefs.current[index + 1]}
            />
          ))
      ) : (
        <Chain key="loadingchain" start={0} end={1} />
      )}
      <OrbitControls enablePan={false} enableRotate={false} />
    </Canvas>
  );
};

export default Blockchain;
