import * as THREE from 'three';
let OrbitControls = require("three-orbit-controls")(THREE);
// import { GLTFLoader } from 'js/GLTFLoader.js';

import fragment from './shader/fragment.glsl';
import vertex from './shader/vertex.glsl';
import * as dat from 'dat.gui';
import gsap from 'gsap';
import load from 'load-asset';
import home from '../assets/1.jpg';


const gallery = [
  new THREE.TextureLoader().load('../assets/1.jpg'),
  new THREE.TextureLoader().load('../assets/2.jpg'),
  new THREE.TextureLoader().load('../assets/3.jpg'),
  new THREE.TextureLoader().load('../assets/4.jpg')
];

let assets = [
  '../assets/1.jpg',
  '../assets/2.jpg',
  '../assets/3.jpg',
  '../assets/4.jpg'
]

// let config = [
//   {
//     page: 'homepage',
//     img: home
//   },
//   {
//     page: 'about',
//     img: new THREE.TextureLoader().load('../assets/2.jpg')
//   },
//   {
//     page: 'contact',
//     img: new THREE.TextureLoader().load('../assets/3.jpg')
//   },
//   {
//     page: 'blog',
//     img: new THREE.TextureLoader().load('../assets/4.jpg')
//   },
// ];

export default class Sketch {
  constructor(images,start) {
    this.scene = new THREE.Scene();
    // this.container = options.dom;
    this.width = window.offsetWidth;
    this.height = window.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    
    // not sure if needed here
    this.container = document.getElementById("container");
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70, 
      window.innerWidth / window.innerHeight, 
      0.001, 
      1000
    );

    let frustumSize = 1;
    let aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      frustumSize / -2, frustumSize / 2, frustumSize / 2, frustumSize / -2, -1000, 1000
    );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    load.all(images).then((assets)=> {
      this.addObjects();
      for(let key in assets) {
          assets[key] = new THREE.Texture(assets[key])
      }

      this.material.uniforms.t1.value = assets[start] || assets["index"];
      this.material.uniforms.t1.value.needsUpdate = true
      this.assets = assets;

      this.addObjects();
      this.resize();
      this.render();
      this.setupResize();
      this.settings();
      this.click();
      this.play();
    });
  }

  goto(page) {
    if(sketch.assets) sketch.changeBG(page)
    let gotoPage = config.find(o => {
      return o.page == page;
    });
    console.log(gotoPage, 'Going to the page');
  }

  changeBG(newpage) {
    if(this.animating) {
      this.nextShow = newpage;
      return
    }
    this.animating = true;
    let nextTexture = this.assets[newpage] || this.assets["index"]
    this.material.uniforms.t2.value = nextTexture
    this.material.uniforms.t2.value.needsUpdate = true;

    gsap.to(this.material.uniforms.progress,{
        duration: 2,
        value: 1,
        onComplete:()=> {
            this.material.uniforms.progress.value = 0;
            this.material.uniforms.t1.value = nextTexture;
            this.animating = false;
            if(this.nextShow) {
              this.changeBG(this.nextShow)
              this.nextShow = null
              
            }
        }
    })
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'progress', 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    //image convert
    this.imageAspect = 2592/3872;
    let a1;
    let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }
    
    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    this.camera.fov =
      2 *
      Math.atan(this.width / this.camera.aspect / (2 * this.cameraDistance)) *
      (180 / Math.PI); // in degrees

    // calculate scene MIGHT NEED?
  // let dist  = camera.position.z - plane.position.z;
  // let height = 1;
  // camera.fov = 2*(180/Math.PI)*Math.atan(height/(2*dist));

  // // if(w/h>1) {
  // plane.scale.x = w/h;
  // // }

    this.camera.updateProjectionMatrix();
  }
  // NEEDED NOT SURE
  // resize();

  addObjects() {
    let that = this;
    
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0 },
        t1: { value: null },
        t2: { value: null },
        t3: { value: null },
        t4: { value: null },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  // let override = false;

  click() {
    document.querySelector('body').addEventListener('click', () => {
    let tl = gsap.timeline({});
      let pos = this.material.uniforms.progress.value;
      let next = 1+ (((Math.floor(pos) + 1)%gallery.length -1) + gallery.length)%gallery.length;
      tl.to(this.material.uniforms.progress, { duration: 0.7 }, {
        value: next,
        ease: 'power2.easeOut',
      });
    });  
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    // this.material.uniforms.progress.value = this.settings.progress;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}



