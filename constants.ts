import { Color, Vector3 } from 'three';

export const PARTICLE_COUNT = 8000;

export const THEMES = [
  {
    name: "Neon Nights",
    colorA: new Vector3(0.1, 0.5, 1.0), // Blue
    colorB: new Vector3(1.0, 0.1, 0.8), // Pink
  },
  {
    name: "Golden Hour",
    colorA: new Vector3(1.0, 0.6, 0.1), // Orange
    colorB: new Vector3(1.0, 0.9, 0.5), // Yellow
  },
  {
    name: "Matrix",
    colorA: new Vector3(0.0, 1.0, 0.4), // Green
    colorB: new Vector3(0.0, 0.3, 0.1), // Dark Green
  },
  {
    name: "Amethyst",
    colorA: new Vector3(0.4, 0.1, 0.9), // Purple
    colorB: new Vector3(0.95, 0.7, 0.85), // Mauve
  },
];

export const VERTEX_SHADER = `
  uniform float uTime;
  uniform vec3 uHandPos;
  uniform float uPinch;
  uniform float uMix;
  uniform float uPixelRatio;

  // Shockwave Uniforms
  uniform float uShockwaveTime;
  uniform vec3 uShockwavePos;

  attribute vec3 aPositionA;
  attribute vec3 aPositionB;
  attribute float aRandom;
  attribute float aSize;

  varying float vDist;
  varying float vShockwave;

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    float smoothMix = smoothstep(0.0, 1.0, uMix);
    vec3 targetPos = mix(aPositionA, aPositionB, smoothMix);

    float transIntensity = sin(uMix * 3.14159);

    vec3 noiseInput = vec3(aRandom * 13.0, aRandom * 47.0 + uTime * 2.0, aRandom * 71.0);
    vec3 scrambleDir = vec3(
        snoise(noiseInput),
        snoise(noiseInput + 100.0),
        snoise(noiseInput + 200.0)
    );
    targetPos += scrambleDir * transIntensity * 8.0;

    float noise = snoise(targetPos * 0.5 + uTime * 0.2);
    vec3 drift = vec3(
      sin(uTime * 0.5 + aRandom * 6.28),
      cos(uTime * 0.3 + aRandom * 6.28),
      sin(uTime * 0.7 + aRandom * 6.28)
    ) * 0.2;

    vec3 newPos = targetPos + drift;

    float d = distance(newPos, uHandPos);
    
    float attraction = smoothstep(5.0, 0.0, d) * uPinch * 6.0;
    float repulsion = smoothstep(1.5, 0.0, d) * (1.0 - uPinch) * 1.5;

    vec3 dir = normalize(uHandPos - newPos);
    newPos += dir * attraction;
    newPos -= dir * repulsion;

    float shockRadius = uShockwaveTime * 15.0; 
    float shockWidth = 2.0;
    
    float distToShock = distance(targetPos, uShockwavePos);
    
    float shockIntensity = smoothstep(shockRadius, shockRadius - shockWidth, distToShock) 
                         * smoothstep(shockRadius - shockWidth * 2.0, shockRadius - shockWidth, distToShock);
    
    shockIntensity *= (0.8 + 0.2 * snoise(newPos * 2.0));
    
    vec3 shockDir = normalize(targetPos - uShockwavePos);
    newPos += shockDir * shockIntensity * 3.0;
    
    vShockwave = shockIntensity;

    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // INCREASED SIZE MULTIPLIER FROM 60.0 to 150.0 for better visibility
    float sizePulse = 1.0 + transIntensity * 1.5 + shockIntensity * 2.0;
    gl_PointSize = (aSize * 150.0 * uPixelRatio * sizePulse) / -mvPosition.z;
    
    vDist = d;
  }
`;

export const FRAGMENT_SHADER = `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uPinch;
  uniform float uMix;

  varying float vDist;
  varying float vShockwave;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float r = length(coord);
    if (r > 0.5) discard;

    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.5);

    float mixFactor = smoothstep(4.0, 0.5, vDist);
    vec3 finalColor = mix(uColorA, uColorB, mixFactor);

    float brightness = 1.0 + uPinch * 2.0;

    float transIntensity = sin(uMix * 3.14159);
    vec3 flashColor = vec3(1.0, 1.0, 1.0);
    finalColor = mix(finalColor * brightness, flashColor, transIntensity * 0.6);
    
    finalColor += vShockwave * vec3(0.8, 0.9, 1.0) * 2.0;

    gl_FragColor = vec4(finalColor, glow * 0.8);
  }
`;