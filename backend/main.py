from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socket
import concurrent.futures

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ADVANCED CONFIGURATION ---
FORCE_IP_PREFIX = ""  

PORT_MAP = {
    53: "router", 80: "web", 443: "web",
    445: "windows", 135: "windows", 139: "windows",
    62078: "mobile", 22: "linux", 21: "server", 3389: "windows",
    554: "camera", 8554: "camera", 8000: "camera", # RTSP Streaming ports for IP Cameras
    8080: "iot", 1883: "iot" # Common IoT and MQTT ports
}

def get_real_local_ip_base():
    # If the user hardcoded a prefix, use it!
    if FORCE_IP_PREFIX:
        print(f"DEBUG: Using Hardcoded Network: {FORCE_IP_PREFIX}0/24")
        return FORCE_IP_PREFIX

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
        s.close()
        return ".".join(local_ip.split('.')[:-1]) + "."
    except:
        return "127.0.0."

def get_hostname(ip):
    try:
        name, _, _ = socket.gethostbyaddr(ip)
        return name
    except:
        return "Unknown Device"

def scan_host(ip):
    try:
        # Added Port 139 (NetBIOS) to help detect Windows even if SMB is off
        for port in [135, 445, 139, 80, 53, 62078, 22, 3389]: 
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.2)
            result = s.connect_ex((ip, port))
            s.close()
            
            if result == 0:
                dev_type = PORT_MAP.get(port, "unknown")
                hostname = get_hostname(ip)
                return {
                    "ip": ip,
                    "name": hostname,
                    "type": dev_type,
                    "open_ports": [port]
                }
    except:
        pass
    return None

@app.get("/discover")
def discover_network():
    base_ip = get_real_local_ip_base()
    active_devices = []
    
    # 1. ALWAYS ADD "YOU" (Manually, so it never disappears)
    my_hostname = socket.gethostname()
    my_ip = socket.gethostbyname(my_hostname)
    active_devices.append({
        "ip": my_ip,
        "name": f"{my_hostname} (YOU)",
        "type": "windows", # Force 'windows' so it shows as BLUE, not WHITE
        "open_ports": [135] 
    })

    print(f"--- STARTING SCAN on {base_ip}1 to {base_ip}254 ---")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
        futures = []
        for i in range(1, 255):
            ip = f"{base_ip}{i}"
            # Skip ourselves so we don't duplicate
            if ip != my_ip:
                futures.append(executor.submit(scan_host, ip))
        
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                print(f"FOUND: {result['ip']} ({result['name']})")
                active_devices.append(result)

    return {"base_ip": base_ip, "devices": active_devices}

@app.get("/deep_scan/{target}")
def deep_scan_target(target: str):
    # (Keep your existing deep scan code here if you want)
    return {"deep_results": []}