import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line, RoundedBox, Octahedron, Cylinder, Html } from '@react-three/drei'
import { useState, useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'

// --- 1. SAFE ATTACK COMPONENTS (CRASH PROOF) ---

function HackerNode({ position }) {
  const meshRef = useRef()
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 2
      meshRef.current.rotation.y = clock.getElapsedTime() * 1.5
    }
  })

  if (!position) return null; // Safety Guard

  return (
    <group position={position}>
      {/* Red Spike Ball */}
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color="red" wireframe emissive="red" emissiveIntensity={2} />
      </mesh>
      {/* Core */}
      <mesh>
        <octahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {/* Label */}
      <Text position={[0, -2, 0]} fontSize={0.4} color="red" anchorX="center" anchorY="middle">
        UNKNOWN SOURCE
      </Text>
      {/* Laser Line */}
      <Line points={[[0,0,0], [-position[0], -position[1], -position[2]]]} color="red" lineWidth={1} opacity={0.3} transparent />
    </group>
  )
}

function AttackSwarm({ startPos, endPos }) {
  const count = 40 
  const particles = useMemo(() => new Array(count).fill(0).map(() => ({ speed: 1 + Math.random(), offset: Math.random() * 10 })), [])

  // Safety Guard: Don't render if positions are missing
  if (!startPos || !endPos) return null;

  return (
    <group>
      {particles.map((data, i) => (
        <AttackParticle 
          key={i} 
          start={startPos} 
          end={endPos} 
          speed={data.speed} 
          offset={data.offset}
        />
      ))}
    </group>
  )
}

function AttackParticle({ start, end, speed, offset }) {
  const meshRef = useRef()
  
  useFrame(({ clock }) => {
    if (meshRef.current && start && end) {
      // Safe Interpolation
      const t = (clock.getElapsedTime() * speed + offset) % 1
      meshRef.current.position.x = start[0] + (end[0] - start[0]) * t
      meshRef.current.position.y = start[1] + (end[1] - start[1]) * t
      meshRef.current.position.z = start[2] + (end[2] - start[2]) * t
      
      // Jitter Effect
      meshRef.current.position.x += (Math.random() - 0.5) * 0.2
      meshRef.current.position.y += (Math.random() - 0.5) * 0.2
    }
  })

  if (!start || !end) return null; // Safety Guard

  return <mesh ref={meshRef}><sphereGeometry args={[0.06, 8, 8]} /><meshBasicMaterial color="#ff0000" /></mesh>
}

// --- 2. STANDARD COMPONENTS ---

function DataPacket({ targetPos, color, speed }) {
  const meshRef = useRef()
  const offset = useMemo(() => Math.random() * 10, [])
  useFrame(({ clock }) => {
    if (meshRef.current && targetPos) {
      const t = (clock.getElapsedTime() * speed + offset) % 1
      meshRef.current.position.set(targetPos[0] * t, targetPos[1] * t, targetPos[2] * t)
    }
  })
  return <mesh ref={meshRef}><sphereGeometry args={[0.08, 8, 8]} /><meshBasicMaterial color={color} /></mesh>
}

function Terminal({ logs, onClose }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, width: '100%', height: '200px',
      background: 'rgba(20, 0, 0, 0.95)', borderTop: '2px solid #ff0000',
      color: '#ff5555', fontFamily: 'monospace', fontSize: '14px',
      padding: '10px', overflowY: 'auto', zIndex: 9999, pointerEvents: 'auto'
    }}>
      <div style={{
          position: 'sticky', top:0, background: 'rgba(20,0,0,0.9)', 
          borderBottom: '1px solid #aa0000', marginBottom: '10px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span>&gt;_ TRAFFIC_MONITOR_V1.0 -- THREAT_DETECTED</span>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} style={{ background:'#300', border:'1px solid red', color:'red', cursor:'pointer', padding: '5px 10px', fontWeight: 'bold' }}>[CLOSE X]</button>
      </div>
      {logs.map((log, i) => <div key={i} style={{ marginBottom: '4px', opacity: 0.9 }}><span style={{color: '#aa0000'}}>[{new Date().toLocaleTimeString()}]</span> {log}</div>)}
      <div ref={bottomRef} />
    </div>
  )
}

function MatrixRain() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d')
    let width = canvas.width = window.innerWidth; let height = canvas.height = window.innerHeight
    const cols = Math.floor(width / 20); const ypos = Array(cols).fill(0)
    const matrix = () => {
      ctx.fillStyle = '#0001'; ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#0f0'; ctx.font = '15pt monospace'
      ypos.forEach((y, i) => {
        const text = String.fromCharCode(0x30A0 + Math.random() * 96); const x = i * 20
        ctx.fillText(text, x, y)
        if (y > 100 + Math.random() * 10000) ypos[i] = 0; else ypos[i] = y + 20
      })
    }
    const interval = setInterval(matrix, 50)
    const handleResize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight }
    window.addEventListener('resize', handleResize)
    return () => { clearInterval(interval); window.removeEventListener('resize', handleResize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, opacity: 0.2, pointerEvents: 'none' }} />
}

function CameraRig({ targetPosition }) {
  const { camera, controls } = useThree()
  useEffect(() => {
    if (targetPosition && controls) {
      const offset = new THREE.Vector3(0, 5, 10)
      const newCamPos = new THREE.Vector3().copy(targetPosition).add(offset)
      controls.target.set(targetPosition.x, targetPosition.y, targetPosition.z)
      camera.position.lerp(newCamPos, 0.1)
      controls.update()
    }
  }, [targetPosition, camera, controls])
  return null
}

function CentralHub({ matrixMode, underAttack }) {
  const meshRef = useRef(); 
  const themeColor = underAttack ? "#ff0000" : (matrixMode ? "#00ff00" : "#00aaff")
  useFrame(() => { if (meshRef.current) { meshRef.current.rotation.x += underAttack ? 0.05 : 0.002; meshRef.current.rotation.y += underAttack ? 0.05 : 0.005 } })
  return (
    <group>
      <mesh ref={meshRef}><icosahedronGeometry args={[1.5, 0]} /><meshBasicMaterial color={themeColor} wireframe /></mesh>
      <mesh><dodecahedronGeometry args={[0.5, 0]} /><meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={2} /></mesh>
      <Text position={[0, -2.2, 0]} fontSize={0.3} color={themeColor} anchorX="center" anchorY="middle">SECURE GATEWAY</Text>
    </group>
  )
}

function DeviceIcon({ type, position, ip, name, onClick, isSelected, details, matrixMode, onDeepScan, onAttack }) {
  let effectiveType = type;
  if (!['router', 'windows', 'linux', 'mobile', 'web', 'unknown'].includes(type)) effectiveType = 'unknown';
  
  const palette = { router: '#ff3333', windows: '#00bbff', linux: '#ff9900', mobile: '#00ffaa', web: '#aa00ff', unknown: '#ffff00', risk: '#ff0000' };
  const riskyPorts = [21, 23, 445, 3389];
  const hasRisk = details && details.some(p => riskyPorts.includes(p));
  
  let baseColor = palette[effectiveType] || palette.unknown;
  if (matrixMode) baseColor = "#00ff00"; 
  const finalColor = hasRisk ? palette.risk : baseColor;
  
  const meshRef = useRef()
  useFrame(({ clock }) => { if (hasRisk && meshRef.current) { const scale = 1 + Math.sin(clock.getElapsedTime() * 5) * 0.1; meshRef.current.scale.set(scale, scale, scale) } })

  return (
    <group position={position}>
      <Line points={[[0, 0, 0], [-position[0], -position[1], -position[2]]]} color={finalColor} opacity={0.3} transparent lineWidth={1} />
      <Line points={[[0, 0, 0], [0, -position[1], 0]]} color={finalColor} opacity={0.5} transparent lineWidth={1} />
      <DataPacket targetPos={[-position[0], -position[1], -position[2]]} color={finalColor} speed={1} />

      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(position, ip, effectiveType, details); }}>
        {effectiveType === 'windows' && <RoundedBox args={[1, 1, 1]} radius={0.1} />}
        {effectiveType === 'mobile' && <RoundedBox args={[0.6, 1.2, 0.2]} radius={0.1} />}
        {effectiveType === 'router' && <Octahedron args={[0.9]} />}
        {effectiveType === 'linux' && <Cylinder args={[0.7, 0.7, 0.25]} />}
        {effectiveType === 'web' && <tetrahedronGeometry args={[0.8]} />}
        {effectiveType === 'unknown' && <sphereGeometry args={[0.6]} />}
        <meshStandardMaterial color={finalColor} emissive={finalColor} emissiveIntensity={isSelected ? 3 : (matrixMode ? 2 : 0.8)} roughness={0.2} metalness={0.1} wireframe={matrixMode} />
      </mesh>

      <Text position={[0, 1.8, 0]} fontSize={0.35} color={matrixMode ? "#0f0" : "white"} anchorX="center" anchorY="middle" fontWeight="bold">
        {name !== "Unknown Device" ? name.split('.')[0] : ip}
      </Text>
      {hasRisk && <Text position={[0, 2.3, 0]} fontSize={0.2} color="#ff0000" anchorX="center" anchorY="middle" fontWeight="bold">⚠ VULNERABLE</Text>}

      {isSelected && (
        <Html position={[1.5, 0, 0]} center>
          <div style={{ background: 'rgba(0, 0, 0, 0.95)', border: `2px solid ${finalColor}`, borderRadius: '6px', padding: '15px', color: matrixMode ? '#0f0' : 'white', width: '240px', fontFamily: 'monospace', boxShadow: `0 0 20px ${finalColor}60`, backdropFilter: 'blur(5px)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: finalColor, borderBottom: `1px solid ${finalColor}` }}>{effectiveType.toUpperCase()}</h3>
            <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '10px' }}><strong>IP:</strong> {ip}<br/><strong>Ports:</strong> {details ? details.join(', ') : "None"}</div>
            <button onClick={(e) => { e.stopPropagation(); onDeepScan(ip); }} style={{ width: '100%', padding: '8px', marginBottom: '5px', background: 'transparent', border: `1px solid ${finalColor}`, color: finalColor, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' }}>[ INITIATE DEEP SCAN ]</button>
            <button onClick={(e) => { e.stopPropagation(); onAttack(ip); }} style={{ width: '100%', padding: '8px', background: '#300', border: `1px solid red`, color: 'red', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' }}>[ SIMULATE ATTACK ]</button>
          </div>
        </Html>
      )}
    </group>
  )
}

// --- 3. MAIN APP ---

export default function App() {
  const [devices, setDevices] = useState([])
  const [scanning, setScanning] = useState(false)
  const [targetFocus, setTargetFocus] = useState(null)
  const [selectedIP, setSelectedIP] = useState(null)
  const [matrixMode, setMatrixMode] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [logs, setLogs] = useState([])
  
  // Attack States
  const [underAttack, setUnderAttack] = useState(false)
  const [victimPos, setVictimPos] = useState(null)
  
  // The Hacker Location
  const HACKER_POS = [15, 8, -15] 

  const addLog = (msg) => setLogs(prev => [...prev, msg])

  const scanNetwork = () => {
    setScanning(true)
    addLog("Initializing Network Discovery Protocol...")
    fetch('http://127.0.0.1:8000/discover')
      .then(res => res.json())
      .then(data => { 
        setDevices(data.devices)
        setScanning(false)
        addLog(`Discovery Complete. Found ${data.devices.length} active nodes.`)
      })
      .catch(() => { setScanning(false); addLog("ERROR: Network Discovery Failed.") })
  }

  const runDeepScan = (ip) => {
      setShowTerminal(true)
      addLog(`[TARGET LOCKED] Deep Scan on ${ip}...`)
      addLog(`> Probing services...`)
      fetch(`http://127.0.0.1:8000/deep_scan/${ip}`)
        .then(res => res.json())
        .then(data => {
            if(!data.deep_results || data.deep_results.length === 0) addLog(`> No open services found on ${ip}.`)
            else data.deep_results.forEach(res => addLog(`[+] PORT ${res.port} OPEN (${res.service})`))
            addLog(`[COMPLETE] Scan finished for ${ip}.`)
        })
        .catch(err => addLog(`[ERROR] Deep scan failed: ${err}`))
  }

  const simulateAttack = (ip) => {
      setShowTerminal(true)
      
      // 1. Find the target position first
      const index = devices.findIndex(d => d.ip === ip)
      if(index !== -1) {
          const angle = index * 0.8; const radius = 6 + (index * 0.8) 
          const x = radius * Math.cos(angle); const z = radius * Math.sin(angle); const y = Math.sin(index) * 1.5 
          
          // 2. Set position BEFORE enabling attack mode to prevent crash
          setVictimPos([x, y, z])
          setUnderAttack(true)

          addLog(`[!!!] INTRUSION DETECTED ON ${ip} [!!!]`)
          addLog(`> Source: UNKNOWN (${HACKER_POS.join(',')})`)
          addLog(`> Type: DATA EXFILTRATION DETECTED`)
          
          setTimeout(() => { addLog(`[!!!] TRAFFIC SPIKE: 50GB/s`) }, 2000)
          setTimeout(() => { setUnderAttack(false); addLog(`[STOP] Attack Mitigated. Connection Severed.`) }, 6000)
      } else {
          addLog(`[ERROR] Target lost. Cannot initiate simulation.`)
      }
  }

  const handleDeviceClick = (pos, ip, type, details) => {
    setTargetFocus(new THREE.Vector3(pos[0], pos[1], pos[2]))
    setSelectedIP(ip)
  }
  const handleReset = () => { setTargetFocus(new THREE.Vector3(0, 0, 0)); setSelectedIP(null) }

  const mainColor = matrixMode ? '#00ff00' : '#00aaff'
  const bgColor = matrixMode ? '#000000' : '#020202'
  const threatCount = devices.filter(d => d.open_ports && d.open_ports.some(p => [21, 23, 445].includes(p))).length

  return (
    <div style={{ width: '100vw', height: '100vh', background: bgColor }}>
      {matrixMode && <MatrixRain />}

      <div style={{ position: 'absolute', top: 30, left: 40, zIndex: 10, color: 'white' }}>
        <h1 style={{ margin: 0, letterSpacing: '4px', fontSize: '24px', fontFamily: 'monospace', color: matrixMode ? '#0f0' : '#fff' }}>
          GLASS WALL <span style={{color: underAttack ? 'red' : mainColor}}>{underAttack ? '// ALERT' : (matrixMode ? '// MATRIX' : '// SENTINEL')}</span>
        </h1>
        {underAttack && <h2 style={{color: 'red', margin: '5px 0', animation: 'blink 1s infinite'}}>⚠ EXTERNAL INTRUSION DETECTED ⚠</h2>}
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', marginTop: '10px', color: '#888', fontFamily: 'monospace' }}>
          <span>DEVICES: <b style={{color: 'white'}}>{devices.length}</b></span>
          <span>THREATS: <b style={{color: threatCount > 0 ? 'red' : '#0f0'}}>{threatCount}</b></span>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={scanNetwork} disabled={scanning} style={{ padding: '10px 30px', background: scanning ? '#333' : 'transparent', border: `1px solid ${mainColor}`, color: mainColor, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', boxShadow: scanning ? 'none' : `0 0 10px ${mainColor}` }}>{scanning ? "[ SCANNING... ]" : "[ REFRESH NETWORK ]"}</button>
          <button onClick={() => setMatrixMode(!matrixMode)} style={{ padding: '10px 20px', background: matrixMode ? '#003300' : 'transparent', border: '1px solid #555', color: matrixMode ? '#0f0' : '#888', cursor: 'pointer', fontFamily: 'monospace' }}>{matrixMode ? "EXIT MATRIX" : "MATRIX MODE"}</button>
        </div>
        {selectedIP && (
          <button onClick={handleReset} style={{ display: 'block', marginTop: '10px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontFamily: 'monospace', textDecoration: 'underline' }}>&lt; RETURN TO CENTER</button>
        )}
      </div>

      <Canvas camera={{ position: [0, 15, 20], fov: 45 }} onPointerMissed={handleReset}>
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
        <CameraRig targetPosition={targetFocus} />
        <ambientLight intensity={matrixMode ? 0.0 : 0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color={underAttack ? "#ff0000" : (matrixMode ? "#0f0" : "#fff")} />
        <gridHelper args={[60, 40, underAttack ? '#550000' : (matrixMode ? '#003300' : '#0044aa'), matrixMode ? '#001100' : '#111111']} position={[0, -2, 0]} />
        
        <CentralHub matrixMode={matrixMode} underAttack={underAttack} />

        {/* --- SAFE ATTACK RENDERING --- */}
        {underAttack && victimPos && (
            <>
                <HackerNode position={HACKER_POS} />
                <AttackSwarm startPos={HACKER_POS} endPos={victimPos} />
            </>
        )}

        {devices.map((device, index) => {
          const angle = index * 0.8; const radius = 6 + (index * 0.8) 
          const x = radius * Math.cos(angle); const z = radius * Math.sin(angle); const y = Math.sin(index) * 1.5 
          return (
            <DeviceIcon 
              key={device.ip} type={device.type} ip={device.ip} name={device.name} details={device.open_ports}
              position={[x, y, z]} isSelected={selectedIP === device.ip} onClick={handleDeviceClick} matrixMode={matrixMode}
              onDeepScan={runDeepScan} onAttack={simulateAttack}
            />
          )
        })}
      </Canvas>

      {showTerminal && <Terminal logs={logs} onClose={() => setShowTerminal(false)} />}
    </div>
  )
}