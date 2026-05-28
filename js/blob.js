/* js/blob.js — Three.js orb animation. No microphone. Simulated audio only. */

(function () {
  if (typeof THREE === 'undefined') return;
  var container = document.getElementById('orbThree');
  if (!container) return;

  var W = 400, H = 400;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 4.8;

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  var vertexShader = `
    uniform float uTime;
    uniform float uAudioIntensity;
    varying vec3 vNormal;
    varying vec3 vPosition;

    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - D.yyy;
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 1.0/7.0;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vNormal = normal;
      vPosition = position;
      float noise = snoise(position * 1.5 + vec3(0.0, uTime * 0.8, 0.0));
      float displacement = (noise * 0.15) + (noise * uAudioIntensity * 0.45);
      vec3 newPosition = position + normal * displacement;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;

  var fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uAudioIntensity;

    void main() {
      float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      vec3 colorBlue = vec3(0.0, 0.4, 1.0);
      vec3 colorPink = vec3(1.0, 0.0, 0.6);
      float mixFactor = (vPosition.x + 1.0) / 2.0;
      vec3 baseGradient = mix(colorBlue, colorPink, mixFactor);
      vec3 finalGlow = baseGradient * intensity * (0.65 + uAudioIntensity * 0.9);
      gl_FragColor = vec4(finalGlow, 1.0);
    }
  `;

  var uniforms = {
    uTime: { value: 0.0 },
    uAudioIntensity: { value: 0.0 }
  };

  var geometry = new THREE.SphereGeometry(0.8, 64, 64);
  var material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var orb = new THREE.Mesh(geometry, material);
  scene.add(orb);

  // Particles
  var particleCount = 400;
  var pGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(particleCount * 3);
  for (var i = 0; i < particleCount * 3; i += 3) {
    var u2 = Math.random(), v2 = Math.random();
    var theta2 = u2 * 2.0 * Math.PI;
    var phi2 = Math.acos(2.0 * v2 - 1.0);
    var r2 = 1.0 + Math.random() * 0.3;
    positions[i]   = r2 * Math.sin(phi2) * Math.cos(theta2);
    positions[i+1] = r2 * Math.sin(phi2) * Math.sin(theta2);
    positions[i+2] = r2 * Math.cos(phi2);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var pMat = new THREE.PointsMaterial({ color: 0xbd00ff, size: 0.02, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending });
  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // Mouse tracking
  var mouseTargetX = 0, mouseTargetY = 0;
  var currentRotX = 0, currentRotY = 0;
  var MAX_TILT = 0.25;

  function onMouseMove(e) {
    var rect = container.getBoundingClientRect();
    var orbCenterX = rect.left + rect.width / 2;
    var orbCenterY = rect.top + rect.height / 2;
    var nx = (e.clientX - orbCenterX) / window.innerWidth;
    var ny = (e.clientY - orbCenterY) / window.innerHeight;
    mouseTargetX = Math.max(-1, Math.min(1, ny)) * MAX_TILT;
    mouseTargetY = Math.max(-1, Math.min(1, nx)) * MAX_TILT;
  }
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // ── SIMULATED AUDIO ONLY — no microphone permission requested ──
  var elapsed = 0, last = performance.now();

  function animate() {
    requestAnimationFrame(animate);
    var now = performance.now();
    elapsed += (now - last) * 0.001;
    last = now;

    uniforms.uTime.value = elapsed;

    // Simulated audio pulse — looks great, zero permissions
    var vol = Math.max(0, Math.sin(elapsed * 3) * Math.cos(elapsed * 1.5) * 0.7);
    uniforms.uAudioIntensity.value += (vol - uniforms.uAudioIntensity.value) * 0.2;

    var lerpSpeed = 0.04;
    currentRotX += (mouseTargetX - currentRotX) * lerpSpeed;
    currentRotY += (mouseTargetY - currentRotY) * lerpSpeed;

    orb.rotation.y = elapsed * 0.1 + currentRotY;
    orb.rotation.x = currentRotX;
    particles.rotation.y = -elapsed * 0.05 + currentRotY * 0.5;
    particles.rotation.x = elapsed * 0.02 + currentRotX * 0.5;

    renderer.render(scene, camera);
  }
  animate();
})();
