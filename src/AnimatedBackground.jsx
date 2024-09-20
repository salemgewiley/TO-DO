import Lottie from "lottie-react";
import animationData from "./Animation.json"; // تأكد من وضع المسار الصحيح

const AnimatedBackground = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        // zIndex: -122,
      }}
    >
      <Lottie animationData={animationData} loop={true} />
    </div>
  );
};

export default AnimatedBackground;
