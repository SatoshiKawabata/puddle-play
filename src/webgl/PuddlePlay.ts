import * as THREE from "three";
import { ColorRepresentation } from "three";
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
const SEPARATION = 3;
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
  private scales = new Float32Array(NUM_PARTICLES);
  private scalesPast = new Float32Array(NUM_PARTICLES);
  private scalesNext = new Float32Array(NUM_PARTICLES);
  private count = 0;
  private centerValue = 0;
  private damp = 0.999;

  constructor(private container: HTMLDivElement) {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    this.camera.position.y = 500;
    this.scene = new THREE.Scene();
    const { positions, yPast, yNext, scales, scalesPast, scalesNext } = this;

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const posIdx = iy * 3 + ix * 3 * AMOUNTY;
        positions[posIdx] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2; // x
        positions[posIdx + 1] = 0; // y
        positions[posIdx + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2; // z
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
    geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

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

    container.appendChild(this.stats.dom);

    requestAnimationFrame(this.render);
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
    } = this;

    const positions = particles.geometry.attributes.position
      .array as Array<number>;
    const scales = particles.geometry.attributes.scale.array as Array<number>;

    // const value =
    //   Math.sin(this.count * 0.3) + 1 + (Math.sin(this.count * 0.5) + 1);
    const value = this.centerValue;
    const epicenter = Math.floor(AMOUNTY / 2 + (AMOUNTY * AMOUNTX) / 2);
    const epicenterY =
      Math.floor((AMOUNTY * 3) / 2 + (AMOUNTY * (AMOUNTX * 3)) / 2) + 1;
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

    this.count += 0.1;

    this.stats.update();
  };

  private onWindowResize = () => {
    const { camera, renderer } = this;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
