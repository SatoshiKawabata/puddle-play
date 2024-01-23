import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";

const VERTEX_SHADER = `
    attribute float scale;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      gl_PointSize = scale * ( 300.0 / - mvPosition.z );
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
const FRAGMENT_SHADER = `
    uniform vec3 color;
    void main() {
      if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;
      gl_FragColor = vec4( color, 1.0 );
    }
  `;
const GAP = 3;
const AMOUNTX = 300;
const AMOUNTY = 300;
const NUM_PARTICLES = AMOUNTX * AMOUNTY;

const dt = 0.1;
const c = 0.6;
const h = 0.1;
const A = ((c * dt) / h) * ((c * dt) / h);
const B = 2.0 - 4 * A;

export class PuddlePlay {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points;
  private material: THREE.ShaderMaterial;
  private stats: Stats = Stats();

  private positions = new Float32Array(NUM_PARTICLES * 3);
  private yPast = new Float32Array(NUM_PARTICLES);
  private yNext = new Float32Array(NUM_PARTICLES);
  private actualScales = new Float32Array(NUM_PARTICLES); // 実際にvertex shaderに渡す配列(負の値を取るとおかしくなるため用意した)
  private scales = new Float32Array(NUM_PARTICLES);
  private scalesPast = new Float32Array(NUM_PARTICLES);
  private scalesNext = new Float32Array(NUM_PARTICLES);
  private centerValue = 0;
  private centerX = Math.floor(AMOUNTX / 2);
  private centerY = Math.floor(AMOUNTY / 2);
  private damp = 0.999;

  private mouse = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();

  constructor(container: HTMLDivElement) {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    this.camera.position.y = 500;
    this.scene = new THREE.Scene();
    const {
      positions,
      yPast,
      yNext,
      actualScales,
      scales,
      scalesPast,
      scalesNext,
    } = this;

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const posIdx = iy * 3 + ix * 3 * AMOUNTY;
        positions[posIdx] = ix * GAP - (AMOUNTX * GAP) / 2; // x
        positions[posIdx + 1] = 0; // y
        positions[posIdx + 2] = iy * GAP - (AMOUNTY * GAP) / 2; // z
        const scaleIdx = iy + ix * AMOUNTY;
        yPast[scaleIdx] = 0;
        yNext[scaleIdx] = 0;
        scales[scaleIdx] = 1;
        scalesPast[scaleIdx] = 1;
        scalesNext[scaleIdx] = 1;
      }
    }

    // 一つ先の状態を計算する
    for (let ix = 1; ix < AMOUNTX - 1; ix++) {
      for (let iy = 1; iy < AMOUNTY - 1; iy++) {
        // scale
        const scaleIdx = iy + ix * AMOUNTY;
        scalesNext[scaleIdx] =
          A *
            (scales[iy - 1 + ix * AMOUNTY] +
              scales[iy + 1 + ix * AMOUNTY] +
              scales[iy + (ix - 1) * AMOUNTY] +
              scales[iy + (ix + 1) * AMOUNTY]) +
          B * scales[iy + ix * AMOUNTY] -
          scalesPast[iy + ix * AMOUNTY];
        scalesNext[scaleIdx] *= this.damp;

        // y position
        const getPosIdx = (diffX: number, diffY: number) => {
          const posIdx = (iy + diffY) * 3 + (ix + diffX) * 3 * AMOUNTY;
          return posIdx + 1;
        };
        yNext[scaleIdx] =
          A *
            (positions[getPosIdx(0, -1)] +
              positions[getPosIdx(0, 1)] +
              positions[getPosIdx(-1, 0)] +
              positions[getPosIdx(1, 0)]) +
          B * positions[getPosIdx(0, 0)] -
          yPast[scaleIdx];
        yNext[scaleIdx] *= this.damp;
      }
    }
    for (let ix = 1; ix < AMOUNTX - 1; ix++) {
      for (let iy = 1; iy < AMOUNTY - 1; iy++) {
        // scale
        const scaleIdx = iy + ix * AMOUNTY;
        scalesPast[scaleIdx] = scales[scaleIdx];
        // 負の値を取らないようにする
        actualScales[scaleIdx] = Math.max(0, scales[scaleIdx]);
        scales[scaleIdx] = scalesNext[scaleIdx];

        // z position
        const getPosIdx = (diffX: number, diffY: number) => {
          const posIdx = (iy + diffY) * 3 + (ix + diffX) * 3 * AMOUNTY;
          return posIdx + 1;
        };
        yPast[scaleIdx] = positions[getPosIdx(0, 0)];
        positions[getPosIdx(0, 0)] = yNext[scaleIdx];
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("scale", new THREE.BufferAttribute(actualScales, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });

    this.particles = new THREE.Points(geometry, this.material);
    this.scene.add(this.particles);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);
    new OrbitControls(this.camera, this.renderer.domElement);

    container.style.touchAction = "none";

    window.addEventListener("resize", this.onWindowResize);

    // container.appendChild(this.stats.dom);

    this.renderer.domElement.addEventListener("mousemove", (event) => {
      const element = event.currentTarget! as HTMLCanvasElement;
      // canvas要素上のXY座標
      const x = event.clientX - element.offsetLeft;
      const y = event.clientY - element.offsetTop;
      // canvas要素の幅・高さ
      const w = element.offsetWidth;
      const h = element.offsetHeight;

      // -1〜+1の範囲で現在のマウス座標を登録する
      this.mouse.x = (x / w) * 2 - 1;
      this.mouse.y = -(y / h) * 2 + 1;
    });

    const cx = localStorage.getItem("centerX");
    const cy = localStorage.getItem("centerY");
    this.centerX = cx ? parseInt(cx) : Math.floor(AMOUNTX / 2);
    this.centerY = cy ? parseInt(cy) : Math.floor(AMOUNTY / 2);

    requestAnimationFrame(this.render);
  }

  resetCenter() {
    this.centerX = Math.floor(AMOUNTX / 2);
    this.centerY = Math.floor(AMOUNTY / 2);
    localStorage.removeItem("centerX");
    localStorage.removeItem("centerY");
  }

  setCenter() {
    // レイキャスト = マウス位置からまっすぐに伸びる光線ベクトルを生成
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // その光線とぶつかったオブジェクトを得る
    const intersects = this.raycaster.intersectObjects([this.particles], false);

    if (intersects.length > 0) {
      const targetPoint = intersects[0].point;
      let minDist = Number.MAX_SAFE_INTEGER;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const posIdx = iy * 3 + ix * 3 * AMOUNTY;
          const x = this.positions[posIdx];
          const y = this.positions[posIdx + 1];
          const z = this.positions[posIdx + 2];
          const dist = targetPoint.distanceTo(new THREE.Vector3(x, y, z));
          if (dist <= minDist) {
            this.centerX = ix;
            this.centerY = iy;
            minDist = dist;
          }
        }
      }
      localStorage.setItem("centerX", this.centerX.toString());
      localStorage.setItem("centerY", this.centerY.toString());
    }
  }

  setColor(color: THREE.ColorRepresentation) {
    this.material.uniforms.color.value.set(new THREE.Color(color));
    this.material.needsUpdate = true;
    this.material.uniformsNeedUpdate = true;
  }

  setCenterValue(value: number) {
    this.centerValue = value;
  }

  setDamp(value: number) {
    this.damp = value;
  }

  private render = () => {
    requestAnimationFrame(this.render);

    const {
      particles,
      scalesNext,
      scalesPast,
      yNext,
      yPast,
      renderer,
      camera,
      scales,
      positions,
      actualScales,
    } = this;

    const value = this.centerValue;
    const epicenter = this.centerY + AMOUNTY * this.centerX;
    const epicenterY = this.centerY * 3 + this.centerX * (AMOUNTX * 3) + 1;
    scales[epicenter] = value * 20;
    positions[epicenterY] = value * 20;
    // 一つ先の状態を計算する
    for (let ix = 1; ix < AMOUNTX - 1; ix++) {
      for (let iy = 1; iy < AMOUNTY - 1; iy++) {
        // scale
        const scaleIdx = iy + ix * AMOUNTY;
        scalesNext[scaleIdx] =
          A *
            (scales[iy - 1 + ix * AMOUNTY] +
              scales[iy + 1 + ix * AMOUNTY] +
              scales[iy + (ix - 1) * AMOUNTY] +
              scales[iy + (ix + 1) * AMOUNTY]) +
          B * scales[scaleIdx] -
          scalesPast[scaleIdx];
        scalesNext[scaleIdx] *= this.damp;

        // y position
        const getPosIdx = (diffX: number, diffY: number) => {
          const posIdx = (iy + diffY) * 3 + (ix + diffX) * 3 * AMOUNTY;
          return posIdx + 1;
        };
        yNext[scaleIdx] =
          A *
            (positions[getPosIdx(0, -1)] +
              positions[getPosIdx(0, 1)] +
              positions[getPosIdx(-1, 0)] +
              positions[getPosIdx(1, 0)]) +
          B * positions[getPosIdx(0, 0)] -
          yPast[scaleIdx];
        yNext[scaleIdx] *= this.damp;
      }
    }
    for (let ix = 1; ix < AMOUNTX - 1; ix++) {
      for (let iy = 1; iy < AMOUNTY - 1; iy++) {
        // scale
        const scaleIdx = iy + ix * AMOUNTY;
        scalesPast[scaleIdx] = scales[scaleIdx];
        actualScales[scaleIdx] = Math.max(0, scales[scaleIdx]);
        scales[scaleIdx] = scalesNext[scaleIdx];

        // z position
        const getPosIdx = (diffX: number, diffY: number) => {
          const posIdx = (iy + diffY) * 3 + (ix + diffX) * 3 * AMOUNTY;
          return posIdx + 1;
        };
        yPast[scaleIdx] = positions[getPosIdx(0, 0)];
        positions[getPosIdx(0, 0)] = yNext[scaleIdx];
      }
    }

    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.scale.needsUpdate = true;

    renderer.render(this.scene, camera);

    this.stats.update();
  };

  private onWindowResize = () => {
    const { camera, renderer } = this;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
