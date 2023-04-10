import Blockchain from "../Blockchain";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Blockchain />
    </div>
  );
}
