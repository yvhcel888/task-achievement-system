import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Props {
  src: string;
  height?: number;
  /** 模型名(用于取景后重置视角) */
  resetKey?: string;
  /** 隐藏位置调节控件(桌宠模式) */
  hideControls?: boolean;
}

/**
 * 3D 模型查看器(three.js 自渲染,参考官方 MMD 查看器设置):
 * - frustumCulled=false:小 mesh(眼睛/饰品)缩小不消失
 * - 材质 DoubleSide + 透明深度处理:单面/半透明不缺失
 * - OrbitControls:拖拽旋转 / 滚轮缩放 / 右键平移
 * - 位置调节:Y 轴滑块上下移动模型
 */
export default function ThreeModelViewer({ src, height = 520, resetKey, hideControls = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const yPosRef = useRef(0);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1d23);

    // 灯光(环境 + 主光 + 补光,避免模型太暗)
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.7);
    fill.position.set(-4, 2, -3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(0, -3, 5);
    scene.add(rim);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / height, 0.1, 1000);
    camera.position.set(2.5, 1.5, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1, 0);
    controls.minDistance = 0.5;
    controls.maxDistance = 20;

    let cancelled = false;
    let model: THREE.Group | null = null;
    const loader = new GLTFLoader();

    const fitCamera = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.01);
      const dist = maxDim * 1.8;
      camera.position.set(center.x + dist * 0.8, center.y + dist * 0.5, center.z + dist);
      controls.target.set(center.x, center.y, center.z);
      controls.update();
    };

    loader.load(
      src,
      (gltf) => {
        if (cancelled) return;
        model = gltf.scene;
        modelRef.current = model;
        // 关键:关闭剔除,小 mesh 不消失;材质双面 + 透明深度写入(角度缺块根因)
        model.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.frustumCulled = false;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              m.side = THREE.DoubleSide;
              if (m.transparent) {
                // 透明材质也写深度:避免角度变化时头发/衣物整块消失(MMD 官方做法)
                m.depthWrite = true;
                m.alphaTest = 0.05;
              }
            });
          }
        });
        scene.add(model);
        fitCamera(model);
      },
      undefined,
      () => {
        if (!cancelled) {
          const el = container.querySelector('.mv-error');
          if (el) el.textContent = '⚠️ 模型加载失败';
        }
      },
    );

    const animate = () => {
      if (cancelled) return;
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      renderer.setSize(container.clientWidth, height);
      camera.aspect = container.clientWidth / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // 位置调节:滑块 → 模型 Y 轴
    const onSlider = (e: Event) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      if (modelRef.current) {
        modelRef.current.position.y = v;
      }
    };
    sliderRef.current?.addEventListener('input', onSlider);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      sliderRef.current?.removeEventListener('input', onSlider);
      controls.dispose();
      renderer.dispose();
      if (model) {
        model.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              const mm = m as THREE.MeshStandardMaterial;
              mm.map?.dispose();
              mm.dispose();
            });
          }
        });
      }
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [src, height, resetKey]);

  return (
    <div>
      <div ref={containerRef} className="relative w-full overflow-hidden" style={{ height }} />
      <div className="mv-error text-[11px] text-red-400 mt-1" style={{ display: 'none' }} />
      {!hideControls && (
        <div className="flex items-center gap-3 mt-3 px-1">
          <span className="text-[10px] font-black text-slate-400 shrink-0">⬆ 位置</span>
          <input
            ref={sliderRef}
            type="range"
            min={-3}
            max={3}
            step={0.05}
            defaultValue={0}
            className="flex-1 accent-[#0033a0]"
            title="上下调整模型位置"
          />
          <span className="text-[10px] font-black text-slate-400 shrink-0">⬇</span>
          <span className="text-[9px] text-slate-400 ml-2 hidden sm:inline">拖拽旋转 · 滚轮缩放 · 右键平移</span>
        </div>
      )}
    </div>
  );
}
