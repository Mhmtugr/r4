<template>
  <div 
    class="model-preview"
    :class="{ 'model-preview--loading': isLoading, 'model-preview--error': hasError }"
  >
    <div v-if="isLoading" class="model-preview__loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Yükleniyor...</span>
      </div>
      <p class="mt-2">Model yükleniyor...</p>
    </div>
    
    <div v-else-if="hasError" class="model-preview__error">
      <i class="bi bi-exclamation-triangle"></i>
      <p class="mt-2">{{ errorMessage }}</p>
      <button class="btn btn-sm btn-outline-secondary mt-2" @click="retryLoading">
        <i class="bi bi-arrow-clockwise me-1"></i> Yeniden dene
      </button>
    </div>
    
    <div v-else>
      <div class="model-preview__header">
        <h6 class="model-preview__title">
          <i class="bi bi-box me-1"></i>
          {{ displayName }}
        </h6>
        <div class="model-preview__actions">
          <button 
            class="btn btn-sm btn-icon" 
            :class="{ 'btn-primary': autoRotate, 'btn-outline-secondary': !autoRotate }"
            @click="toggleAutoRotate"
            title="Otomatik döndür"
          >
            <i class="bi bi-arrow-repeat"></i>
          </button>
          <button 
            class="btn btn-sm btn-icon btn-outline-secondary ms-1"
            @click="resetCamera"
            title="Kamerayı sıfırla"
          >
            <i class="bi bi-aspect-ratio"></i>
          </button>
          <button 
            class="btn btn-sm btn-icon btn-outline-secondary ms-1"
            @click="zoomIn"
            title="Yakınlaştır"
          >
            <i class="bi bi-zoom-in"></i>
          </button>
          <button 
            class="btn btn-sm btn-icon btn-outline-secondary ms-1"
            @click="zoomOut"
            title="Uzaklaştır"
          >
            <i class="bi bi-zoom-out"></i>
          </button>
          <button 
            v-if="fullscreenEnabled"
            class="btn btn-sm btn-icon btn-outline-secondary ms-1"
            @click="openFullscreen"
            title="Tam ekran görüntüle"
          >
            <i class="bi bi-arrows-fullscreen"></i>
          </button>
        </div>
      </div>
      
      <div class="model-preview__container" ref="container" @mousedown="handleMouseDown"></div>
      
      <div class="model-preview__footer">
        <div class="model-preview__info">
          <span v-if="modelInfo.vertexCount" class="model-info-item">
            <i class="bi bi-diamond"></i>
            {{ formatNumber(modelInfo.vertexCount) }} nokta
          </span>
          <span v-if="modelInfo.faceCount" class="model-info-item">
            <i class="bi bi-triangle"></i>
            {{ formatNumber(modelInfo.faceCount) }} yüz
          </span>
          <span v-if="modelInfo.fileSize" class="model-info-item">
            <i class="bi bi-file-binary"></i>
            {{ formatFileSize(modelInfo.fileSize) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'

// Props
const props = defineProps({
  modelId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  format: {
    type: String,
    default: '' // Otomatik algılama için boş bırakılabilir
  },
  autoRotate: {
    type: Boolean,
    default: true
  },
  backgroundColor: {
    type: String,
    default: '#f8f9fa'
  }
})

// Emit events
const emit = defineEmits(['loaded', 'error', 'click'])

// Refs
const container = ref(null)
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const modelInfo = ref({
  vertexCount: 0,
  faceCount: 0,
  fileSize: 0
})

// Three.js variables
let scene, camera, renderer, controls, model
let isAnimating = false

// Computed
const displayName = computed(() => {
  return props.name || `Model ${props.modelId.substring(0, 8)}`
})

const fullscreenEnabled = computed(() => {
  return document.fullscreenEnabled || 
         document.webkitFullscreenEnabled || 
         document.mozFullScreenEnabled || 
         document.msFullscreenEnabled
})

// Methods
const initScene = () => {
  // Scene oluştur
  scene = new THREE.Scene()
  scene.background = new THREE.Color(props.backgroundColor)
  
  // Kamera oluştur
  camera = new THREE.PerspectiveCamera(
    60, 
    container.value.clientWidth / container.value.clientHeight, 
    0.1, 
    1000
  )
  camera.position.z = 5
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  container.value.appendChild(renderer.domElement)
  
  // Orbit controls ekle
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  controls.autoRotate = props.autoRotate
  controls.autoRotateSpeed = 2.0
  
  // Işıklandırma ekle
  addLighting()
  
  // Grid ekle
  addGrid()

  // Pencere boyutu değiştiğinde güncelle
  window.addEventListener('resize', updateSize)
  
  // Animasyon döngüsünü başlat
  startAnimationLoop()
}

const addLighting = () => {
  // Ana ışık
  const mainLight = new THREE.DirectionalLight(0xffffff, 1)
  mainLight.position.set(0, 5, 5)
  mainLight.castShadow = true
  scene.add(mainLight)
  
  // Dolgu ışıkları
  const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
  fillLight1.position.set(-5, 2, 2)
  scene.add(fillLight1)
  
  const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
  fillLight2.position.set(5, 2, 2)
  scene.add(fillLight2)
  
  // Alt ışık
  const bottomLight = new THREE.DirectionalLight(0xffffff, 0.5)
  bottomLight.position.set(0, -5, 0)
  scene.add(bottomLight)
  
  // Ortam ışığı
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)
}

const addGrid = () => {
  const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444)
  gridHelper.position.y = -1
  scene.add(gridHelper)
}

const loadModel = async () => {
  isLoading.value = true
  hasError.value = false
  
  try {
    // Model yolu oluştur (Gerçek uygulamada API'dan gelebilir)
    let modelUrl
    let modelFormat = props.format
    
    // Test için örnek modeller
    if (props.modelId === 'sample') {
      modelUrl = '/models/sample.glb'
      modelFormat = 'glb'
    } else {
      // Gerçek API kullanımı
      const response = await fetch(`/api/models/${props.modelId}`)
      const data = await response.json()
      
      if (!data || !data.url) {
        throw new Error('Model bulunamadı')
      }
      
      modelUrl = data.url
      modelFormat = data.format || inferFormatFromUrl(data.url)
      
      modelInfo.value = {
        vertexCount: data.vertexCount || 0,
        faceCount: data.faceCount || 0,
        fileSize: data.fileSize || 0
      }
    }
    
    // Model yükleyiciyi seç
    let loader
    
    switch (modelFormat.toLowerCase()) {
      case 'gltf':
      case 'glb':
        loader = new GLTFLoader()
        break
      case 'obj':
        loader = new OBJLoader()
        break
      case 'stl':
        loader = new STLLoader()
        break
      default:
        // Format algılanamadıysa varsayılan olarak GLTF kullan
        loader = new GLTFLoader()
        break
    }
    
    // Modeli yükle
    if (modelFormat.toLowerCase() === 'gltf' || modelFormat.toLowerCase() === 'glb') {
      loader.load(
        modelUrl,
        (gltf) => {
          model = gltf.scene
          setupModel(model)
        },
        (progress) => {
          // İlerleme durumu
          console.log(`Yükleniyor: ${Math.round((progress.loaded / progress.total) * 100)}%`)
        },
        (error) => {
          hasError.value = true
          errorMessage.value = 'Model yüklenemedi'
          console.error('Model yükleme hatası:', error)
        }
      )
    } else if (modelFormat.toLowerCase() === 'obj') {
      loader.load(
        modelUrl,
        (obj) => {
          model = obj
          setupModel(model)
        },
        (progress) => {
          console.log(`Yükleniyor: ${Math.round((progress.loaded / progress.total) * 100)}%`)
        },
        (error) => {
          hasError.value = true
          errorMessage.value = 'Model yüklenemedi'
          console.error('Model yükleme hatası:', error)
        }
      )
    } else if (modelFormat.toLowerCase() === 'stl') {
      loader.load(
        modelUrl,
        (geometry) => {
          const material = new THREE.MeshStandardMaterial({
            color: 0x7E7E7E,
            metalness: 0.2,
            roughness: 0.6,
          })
          model = new THREE.Mesh(geometry, material)
          setupModel(model)
        },
        (progress) => {
          console.log(`Yükleniyor: ${Math.round((progress.loaded / progress.total) * 100)}%`)
        },
        (error) => {
          hasError.value = true
          errorMessage.value = 'Model yüklenemedi'
          console.error('Model yükleme hatası:', error)
        }
      )
    }
  } catch (error) {
    hasError.value = true
    errorMessage.value = 'Model yüklenemedi: ' + error.message
    console.error('Model yükleme hatası:', error)
  }
}

const setupModel = (loadedModel) => {
  if (!loadedModel) return
  
  // Modeli sahneye ekle
  scene.add(loadedModel)
  
  // Modeli merkeze yerleştir
  const box = new THREE.Box3().setFromObject(loadedModel)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  
  loadedModel.position.x = -center.x
  loadedModel.position.y = -center.y
  loadedModel.position.z = -center.z
  
  // Kamera mesafesini ayarla
  const maxDimension = Math.max(size.x, size.y, size.z)
  const fov = camera.fov * (Math.PI / 180)
  const cameraDistance = (maxDimension / 2) / Math.tan(fov / 2)
  
  camera.position.z = cameraDistance * 1.5
  camera.updateProjectionMatrix()
  
  // Kontrolleri sıfırla
  controls.reset()
  
  // Yükleme tamamlandı
  isLoading.value = false
  
  // Vertex ve face sayılarını hesapla (eğer API'dan alınmadıysa)
  if (modelInfo.value.vertexCount === 0 || modelInfo.value.faceCount === 0) {
    calculateModelInfo(loadedModel)
  }
  
  // Başarılı yükleme eventi
  emit('loaded', {
    id: props.modelId,
    name: props.name,
    info: modelInfo.value
  })
}

const calculateModelInfo = (model) => {
  let vertexCount = 0
  let faceCount = 0
  
  model.traverse((child) => {
    if (child.isMesh) {
      const geometry = child.geometry
      
      if (geometry.isBufferGeometry) {
        const position = geometry.getAttribute('position')
        if (position) {
          vertexCount += position.count
        }
        
        if (geometry.index) {
          faceCount += geometry.index.count / 3
        } else {
          faceCount += position.count / 3
        }
      }
    }
  })
  
  modelInfo.value.vertexCount = vertexCount
  modelInfo.value.faceCount = Math.round(faceCount)
}

const inferFormatFromUrl = (url) => {
  if (!url) return ''
  
  const extension = url.split('.').pop().toLowerCase()
  
  switch (extension) {
    case 'gltf':
    case 'glb':
    case 'obj':
    case 'stl':
      return extension
    default:
      return ''
  }
}

const updateSize = () => {
  if (!container.value || !camera || !renderer) return
  
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  
  renderer.setSize(width, height)
}

const startAnimationLoop = () => {
  if (isAnimating) return
  
  isAnimating = true
  animate()
}

const animate = () => {
  if (!isAnimating) return
  
  requestAnimationFrame(animate)
  
  if (controls) {
    controls.update()
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

const stopAnimationLoop = () => {
  isAnimating = false
}

const resetCamera = () => {
  if (!controls) return
  
  controls.reset()
}

const zoomIn = () => {
  if (!camera) return
  
  camera.position.multiplyScalar(0.9)
}

const zoomOut = () => {
  if (!camera) return
  
  camera.position.multiplyScalar(1.1)
}

const toggleAutoRotate = () => {
  if (!controls) return
  
  controls.autoRotate = !controls.autoRotate
}

const retryLoading = () => {
  loadModel()
}

const openFullscreen = () => {
  if (!fullscreenEnabled.value || !container.value) return
  
  emit('click')
}

const handleMouseDown = (event) => {
  // Sol tıklama
  if (event.button === 0) {
    emit('click')
  }
}

const formatNumber = (num) => {
  if (typeof num !== 'number') return '0'
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  
  return num.toString()
}

const formatFileSize = (bytes) => {
  if (!bytes || typeof bytes !== 'number') return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  
  return bytes.toFixed(1) + ' ' + units[i]
}

// Lifecycle hooks
onMounted(() => {
  if (container.value) {
    initScene()
    loadModel()
  }
})

onBeforeUnmount(() => {
  stopAnimationLoop()
  
  window.removeEventListener('resize', updateSize)
  
  // Three.js kaynaklarını temizle
  if (renderer) {
    renderer.dispose()
    
    if (container.value && renderer.domElement) {
      container.value.removeChild(renderer.domElement)
    }
  }
  
  if (controls) {
    controls.dispose()
  }
  
  if (model) {
    scene.remove(model)
    
    model.traverse((object) => {
      if (object.isMesh) {
        if (object.geometry) {
          object.geometry.dispose()
        }
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      }
    })
  }
  
  // Scene'i temizle
  if (scene) {
    scene.clear()
  }
})

// Prop değişikliklerini izle
watch(() => props.modelId, () => {
  loadModel()
})

watch(() => props.autoRotate, (newValue) => {
  if (controls) {
    controls.autoRotate = newValue
  }
})

watch(() => props.backgroundColor, (newValue) => {
  if (scene) {
    scene.background = new THREE.Color(newValue)
  }
})
</script>

<style scoped>
.model-preview {
  width: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-color, #f8f9fa);
  border: 1px solid var(--border-color, #dee2e6);
}

.model-preview__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  background-color: rgba(255, 255, 255, 0.8);
}

.model-preview__title {
  margin: 0;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.model-preview__actions {
  display: flex;
  align-items: center;
}

.btn-icon {
  padding: 0.25rem;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.model-preview__container {
  height: 300px;
  position: relative;
  cursor: grab;
}

.model-preview__container:active {
  cursor: grabbing;
}

.model-preview__footer {
  padding: 6px 12px;
  border-top: 1px solid var(--border-color, #dee2e6);
  background-color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-preview__info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted, #6c757d);
}

.model-info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.model-preview__loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(248, 249, 250, 0.7);
  z-index: 1;
  color: var(--text-muted, #6c757d);
}

.model-preview__error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(248, 249, 250, 0.9);
  z-index: 1;
  color: var(--text-muted, #6c757d);
  text-align: center;
  padding: 20px;
}

.model-preview__error i {
  font-size: 32px;
  color: var(--danger-color, #dc3545);
}

/* Koyu tema desteği */
@media (prefers-color-scheme: dark) {
  .model-preview {
    background-color: var(--dark-bg, #212529);
    border-color: var(--dark-border-color, #495057);
  }
  
  .model-preview__header,
  .model-preview__footer {
    background-color: rgba(52, 58, 64, 0.9);
    border-color: var(--dark-border-color, #495057);
  }
  
  .model-preview__loading,
  .model-preview__error {
    background-color: rgba(33, 37, 41, 0.8);
    color: var(--dark-text-muted, #adb5bd);
  }
  
  .model-preview__info {
    color: var(--dark-text-muted, #adb5bd);
  }
}

/* Responsive */
@media (max-width: 576px) {
  .model-preview__container {
    height: 250px;
  }
  
  .model-preview__header {
    padding: 6px 8px;
  }
  
  .model-preview__actions .btn:not(:first-child) {
    display: none;
  }
}
</style>