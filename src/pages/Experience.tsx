// @ts-expect-error
import WebGLApp from '../webgl/App.jsx';

export default function Experience() {
  return (
    <div 
      className="w-full h-screen overflow-hidden" 
      style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#0a0a0f' }}
    >
      <WebGLApp />
    </div>
  );
}
