import * as THREE from 'three';

/**
 * Cinematic HDR Industrial PBR Material (Ported from Unity URP)
 */
export function createCinematicPBRMaterial() {
  const vertexShader = `
    varying vec3 vPositionWS;
    varying vec3 vNormalWS;
    varying vec3 vTangentWS;
    varying vec3 vBitangentWS;
    varying vec2 vUv;

    attribute vec4 tangent;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vPositionWS = worldPos.xyz;
      vNormalWS = normalize(normalMatrix * normal);
      vTangentWS = normalize(modelMatrix * vec4(tangent.xyz, 0.0)).xyz;
      vBitangentWS = cross(vNormalWS, vTangentWS) * tangent.w;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D _MainTex;
    uniform sampler2D _BumpMap;
    uniform sampler2D _MetallicGlossMap;
    uniform sampler2D _WetnessMap;

    uniform float _Exposure;
    uniform float _Contrast;
    uniform float _Saturation;
    uniform float _WetnessIntensity;
    uniform float _AtmosphericDust;
    uniform vec3 _WarmHighlightTone;
    uniform vec3 _CoolShadowTone;

    uniform vec3 lightDirection;
    uniform vec3 lightColor;
    uniform vec3 cameraPosition;

    varying vec3 vPositionWS;
    varying vec3 vNormalWS;
    varying vec3 vTangentWS;
    varying vec3 vBitangentWS;
    varying vec2 vUv;

    // ACES Tonemapping
    vec3 ACESFilm(vec3 x) {
      float a = 2.51;
      float b = 0.03;
      float c = 2.43;
      float d = 0.59;
      float e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }

    void main() {
      // Unpack textures
      vec4 albedoMap = texture2D(_MainTex, vUv);
      vec3 normalSample = texture2D(_BumpMap, vUv).rgb * 2.0 - 1.0;
      vec4 pbrMask = texture2D(_MetallicGlossMap, vUv);
      float wetMask = texture2D(_WetnessMap, vUv).r * _WetnessIntensity;

      // Construct TBN
      mat3 TBN = mat3(normalize(vTangentWS), normalize(vBitangentWS), normalize(vNormalWS));
      vec3 N = normalize(TBN * normalSample);
      vec3 V = normalize(cameraPosition - vPositionWS);
      vec3 L = normalize(lightDirection);
      vec3 H = normalize(V + L);

      // Surface Modifiers
      vec3 baseAlbedo = mix(albedoMap.rgb, albedoMap.rgb * 0.35, wetMask);
      float metallic = pbrMask.r;
      float roughness = mix(1.0 - pbrMask.g, 0.02, wetMask);
      float occl = pbrMask.b;

      // Lighting
      float NdotL = max(dot(N, L), 0.0);
      float NdotH = max(dot(N, H), 0.0);
      
      float specPower = exp2(10.0 * (1.0 - roughness) + 1.0);
      float specular = pow(NdotH, specPower) * (1.0 - roughness);
      
      float shadowMask = 1.0 - NdotL;
      vec3 ambientTone = mix(_WarmHighlightTone, _CoolShadowTone, shadowMask);

      vec3 directDiffuse = baseAlbedo * lightColor * NdotL;
      vec3 directSpecular = lightColor * specular * mix(vec3(0.04), baseAlbedo, metallic);
      vec3 finalColor = (directDiffuse + directSpecular) * occl * ambientTone;

      // Dust haze
      float dist = length(vPositionWS - cameraPosition);
      float dustExtinction = clamp(1.0 - exp(-dist * _AtmosphericDust * 0.01), 0.0, 1.0);
      finalColor = mix(finalColor, ambientTone * 0.5, dustExtinction);

      // Post Processing
      finalColor *= _Exposure;
      finalColor = pow(finalColor, vec3(_Contrast));
      
      float luminance = dot(finalColor, vec3(0.2126, 0.7152, 0.0722));
      finalColor = mix(vec3(luminance), finalColor, _Saturation);

      gl_FragColor = vec4(ACESFilm(finalColor), 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {
      _MainTex: { value: null },
      _BumpMap: { value: null },
      _MetallicGlossMap: { value: null },
      _WetnessMap: { value: null },
      _Exposure: { value: 1.2 },
      _Contrast: { value: 1.15 },
      _Saturation: { value: 1.05 },
      _WetnessIntensity: { value: 0.85 },
      _AtmosphericDust: { value: 0.15 },
      _WarmHighlightTone: { value: new THREE.Color(1.0, 0.92, 0.82) },
      _CoolShadowTone: { value: new THREE.Color(0.45, 0.52, 0.65) },
      lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      lightColor: { value: new THREE.Color(1, 1, 1) },
      cameraPosition: { value: new THREE.Vector3() }
    },
    vertexShader,
    fragmentShader
  });
}
