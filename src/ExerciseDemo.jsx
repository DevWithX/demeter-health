import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const EXERCISES = [
  {
    id: "squat",
    name: "Bodyweight Squat",
    category: "Lower Body",
    difficulty: "Beginner",
    muscles: {
      primary: ["Quadriceps", "Glutes"],
      secondary: ["Hamstrings", "Core", "Calves"],
    },
    muscleDetails: {
      "Quadriceps": "The quadriceps are four muscles at the front of your thigh. They are the primary driver of knee extension - straightening your leg as you stand up from the squat. Strong quads protect the knee joint and improve running speed.",
      "Glutes": "The gluteal muscles (gluteus maximus, medius, minimus) are the largest muscles in your body. In the squat they fire powerfully at the top of the movement to extend the hip. Weak glutes contribute to knee pain and lower back problems.",
      "Hamstrings": "Running along the back of your thigh, the hamstrings assist in hip extension and provide stability during the descent phase. They work eccentrically (lengthening under load) to control your speed going down.",
      "Core": "Your deep core muscles including the transverse abdominis act as a natural weight belt, stabilising your spine throughout the movement. Without core engagement, the lower back is vulnerable to injury.",
      "Calves": "The gastrocnemius and soleus provide ankle stability and assist with balance. They work isometrically to keep your heels grounded throughout the movement.",
    },
    steps: [
      "Stand with feet shoulder-width apart, toes slightly turned out",
      "Keep chest tall and core braced throughout the movement",
      "Push hips back and bend knees, lowering until thighs are parallel to floor",
      "Drive through heels to return to standing and squeeze glutes at the top",
    ],
    precautions: [
      "Never let knees cave inward - push them out over your toes",
      "Keep heels flat on the ground at all times",
      "Avoid rounding your lower back - maintain a neutral spine",
    ],
    reps: "3 x 12-15 reps",
    rest: "60 seconds",
    tags: ["No equipment", "Beginner-friendly", "Compound movement"],
    color: "#00c864",
    animType: "squat",
  },
  {
    id: "pushup",
    name: "Push-Up",
    category: "Upper Body",
    difficulty: "Beginner",
    muscles: {
      primary: ["Chest", "Triceps"],
      secondary: ["Front Shoulders", "Core", "Serratus Anterior"],
    },
    muscleDetails: {
      "Chest": "The pectoralis major is the large fan-shaped muscle across your chest. It is the prime mover in the push-up, responsible for horizontal adduction - bringing your arms together in front of your body as you push up.",
      "Triceps": "The triceps brachii runs along the back of your upper arm. It extends the elbow joint - straightening your arm at the top of each rep. The triceps take over from the chest as you push through the final range of motion.",
      "Front Shoulders": "The anterior deltoid assists the chest in the pressing motion. It is especially active at the start of each rep. Overdeveloping front shoulders relative to the rear can cause postural imbalances.",
      "Core": "The entire core must remain rigid during a push-up to prevent the hips from sagging. Think of your body as a plank - any weakness in the middle transfers unwanted stress to the lower back.",
      "Serratus Anterior": "Running along the ribcage under your armpit, the serratus anterior protracts the shoulder blade - pushing it forward around the ribcage at the top of each rep. It is often called the boxer's muscle.",
    },
    steps: [
      "Start in a high plank with hands slightly wider than shoulders",
      "Lower your chest toward the floor by bending elbows at 45 degrees",
      "Stop just before chest touches the ground and pause briefly",
      "Push through palms explosively back to starting position",
    ],
    precautions: [
      "Never let hips sag or pike up - maintain a rigid plank",
      "If full push-up is too hard, drop to knees - same form applies",
      "Wrist pain? Try fists or push-up handles to keep wrists neutral",
    ],
    reps: "3 x 8-12 reps",
    rest: "60 seconds",
    tags: ["No equipment", "Modifiable", "Upper body compound"],
    color: "#60a5fa",
    animType: "pushup",
  },
  {
    id: "plank",
    name: "Forearm Plank",
    category: "Core",
    difficulty: "Beginner",
    muscles: {
      primary: ["Transverse Abdominis", "Rectus Abdominis"],
      secondary: ["Obliques", "Lower Back", "Shoulders", "Glutes"],
    },
    muscleDetails: {
      "Transverse Abdominis": "The deepest abdominal muscle, it wraps around your torso like a corset. It is the primary stabiliser of the spine and pelvis. Weakness here is linked to lower back pain. The plank is one of the most effective exercises for activating it.",
      "Rectus Abdominis": "The rectus abdominis is the visible six-pack muscle running vertically down the abdomen. During the plank it works isometrically to resist spinal extension - preventing your hips from sagging.",
      "Obliques": "The internal and external obliques run diagonally along the sides of your abdomen. They resist rotation during the plank, keeping your body in a perfectly straight line. They are critical for athletic movements involving twisting.",
      "Lower Back": "The erector spinae muscles run along the spine and work in opposition to the abdominals to maintain neutral spinal alignment. A strong lower back reduces injury risk in all lifting movements.",
      "Shoulders": "The deltoids and rotator cuff muscles isometrically support your bodyweight through the forearms. The plank is a low-impact way to build shoulder stability.",
      "Glutes": "Squeezing your glutes during the plank helps maintain a posterior pelvic tilt, protecting the lower back and increasing core activation. Think about trying to bring your elbows and toes together.",
    },
    steps: [
      "Place forearms on the ground with elbows directly under shoulders",
      "Extend legs behind you with toes on the floor",
      "Squeeze your core, glutes, and thighs simultaneously",
      "Hold the position and breathe steadily - never hold your breath",
    ],
    precautions: [
      "Never let your lower back sag as this strains the lumbar spine",
      "Avoid holding your breath throughout the hold",
      "If lower back pain occurs, stop and try a modified version on knees",
    ],
    reps: "3 x 20-45 seconds",
    rest: "45 seconds",
    tags: ["No equipment", "Core stability", "Low impact"],
    color: "#f97316",
    animType: "plank",
  },
  {
    id: "lunge",
    name: "Forward Lunge",
    category: "Lower Body",
    difficulty: "Beginner",
    muscles: {
      primary: ["Quadriceps", "Glutes"],
      secondary: ["Hamstrings", "Calves", "Core"],
    },
    muscleDetails: {
      "Quadriceps": "In the lunge the front leg quads bear the majority of the load, working eccentrically to control descent and concentrically to drive back up. Because it is single-leg, each quad gets more direct stimulation than in a bilateral squat.",
      "Glutes": "The glutes of the front leg work powerfully at the top of each rep. The rear leg glute also activates to help stabilise the hip. Lunges reveal and correct strength imbalances between left and right sides.",
      "Hamstrings": "The front leg hamstrings work eccentrically during descent. The rear leg hamstrings assist in hip extension and help prevent excessive forward lean. Tight hamstrings often cause the torso to lean forward.",
      "Calves": "Both calves work to stabilise the ankles throughout the movement. The front leg calf controls dorsiflexion while the rear leg calf assists with balance and toe-off.",
      "Core": "The core prevents lateral trunk sway, which is the most common error in the lunge. Single leg movements challenge core stability far more than bilateral exercises.",
    },
    steps: [
      "Stand tall with feet hip-width apart and hands on hips",
      "Step forward with one leg far enough so your front shin stays vertical",
      "Lower your back knee toward the floor without touching it",
      "Push through your front heel to return to standing and alternate legs",
    ],
    precautions: [
      "Front knee must not go past your toes - step far enough forward",
      "Keep torso upright - avoid leaning forward at the hip",
      "Avoid this exercise with acute knee injuries without clearance",
    ],
    reps: "3 x 10 reps each leg",
    rest: "60 seconds",
    tags: ["No equipment", "Unilateral", "Balance and stability"],
    color: "#e879f9",
    animType: "lunge",
  },
];

// Skin tones for anatomical mannequin
const SKIN = new THREE.MeshStandardMaterial({ color: 0xc8956c, roughness: 0.7, metalness: 0.0 });
const SKIN_DARK = new THREE.MeshStandardMaterial({ color: 0xa0714f, roughness: 0.7, metalness: 0.0 });

function buildAnatomicalFigure(scene) {
  const group = new THREE.Group();
  const parts = [];

  const addPart = (geo, mat, x, y, z, rx=0, ry=0, rz=0, zone=null) => {
    const m = new THREE.Mesh(geo, mat.clone());
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    if (zone) m.userData.zone = zone;
    group.add(m);
    parts.push(m);
    return m;
  };

  // HEAD
  const head = addPart(new THREE.SphereGeometry(0.19, 20, 20), SKIN, 0, 1.74, 0, 0, 0, 0, "head");
  // subtle face features
  addPart(new THREE.SphereGeometry(0.04, 8, 8), SKIN_DARK, -0.07, 1.78, 0.16, 0, 0, 0); // left eye socket
  addPart(new THREE.SphereGeometry(0.04, 8, 8), SKIN_DARK, 0.07, 1.78, 0.16, 0, 0, 0); // right eye socket

  // NECK
  addPart(new THREE.CylinderGeometry(0.075, 0.09, 0.16, 14), SKIN, 0, 1.57, 0, 0, 0, 0, "neck");

  // CHEST - wider, more realistic
  const chest = addPart(new THREE.BoxGeometry(0.56, 0.4, 0.24), SKIN, 0, 1.27, 0, 0, 0, 0, "chest");
  chest.geometry = new THREE.CylinderGeometry(0.28, 0.24, 0.4, 16);

  // ABDOMEN
  const abs = addPart(new THREE.CylinderGeometry(0.22, 0.2, 0.28, 14), SKIN, 0, 0.97, 0, 0, 0, 0, "abdomen");

  // PELVIS
  const pelvis = addPart(new THREE.CylinderGeometry(0.24, 0.2, 0.2, 14), SKIN, 0, 0.76, 0, 0, 0, 0, "rear-hip");

  // SHOULDERS
  const lShoulder = addPart(new THREE.SphereGeometry(0.115, 14, 14), SKIN, -0.33, 1.38, 0, 0, 0, 0, "shoulder");
  const rShoulder = addPart(new THREE.SphereGeometry(0.115, 14, 14), SKIN, 0.33, 1.38, 0, 0, 0, 0, "shoulder");

  // UPPER ARMS
  const lUpperArm = addPart(new THREE.CylinderGeometry(0.075, 0.065, 0.36, 12), SKIN, -0.44, 1.13, 0, 0, 0, 0.18, "rear-upper-arm");
  const rUpperArm = addPart(new THREE.CylinderGeometry(0.075, 0.065, 0.36, 12), SKIN, 0.44, 1.13, 0, 0, 0, -0.18, "rear-upper-arm");

  // ELBOWS
  addPart(new THREE.SphereGeometry(0.065, 12, 12), SKIN, -0.5, 0.93, 0);
  addPart(new THREE.SphereGeometry(0.065, 12, 12), SKIN, 0.5, 0.93, 0);

  // FOREARMS
  const lForearm = addPart(new THREE.CylinderGeometry(0.06, 0.05, 0.33, 12), SKIN, -0.52, 0.76, 0, 0, 0, 0.12);
  const rForearm = addPart(new THREE.CylinderGeometry(0.06, 0.05, 0.33, 12), SKIN, 0.52, 0.76, 0, 0, 0, -0.12);

  // HANDS
  addPart(new THREE.SphereGeometry(0.065, 10, 10), SKIN, -0.54, 0.58, 0);
  addPart(new THREE.SphereGeometry(0.065, 10, 10), SKIN, 0.54, 0.58, 0);

  // HIP JOINTS
  addPart(new THREE.SphereGeometry(0.1, 12, 12), SKIN, -0.18, 0.63, 0);
  addPart(new THREE.SphereGeometry(0.1, 12, 12), SKIN, 0.18, 0.63, 0);

  // THIGHS
  const lThigh = addPart(new THREE.CylinderGeometry(0.115, 0.095, 0.44, 14), SKIN, -0.19, 0.36, 0, 0, 0, 0, "front-thigh");
  const rThigh = addPart(new THREE.CylinderGeometry(0.115, 0.095, 0.44, 14), SKIN, 0.19, 0.36, 0, 0, 0, 0, "front-thigh");

  // KNEES
  addPart(new THREE.SphereGeometry(0.095, 12, 12), SKIN, -0.19, 0.12, 0);
  addPart(new THREE.SphereGeometry(0.095, 12, 12), SKIN, 0.19, 0.12, 0);

  // CALVES
  const lCalf = addPart(new THREE.CylinderGeometry(0.08, 0.065, 0.4, 14), SKIN, -0.19, -0.13, 0, 0, 0, 0, "lower-leg");
  const rCalf = addPart(new THREE.CylinderGeometry(0.08, 0.065, 0.4, 14), SKIN, 0.19, -0.13, 0, 0, 0, 0, "lower-leg");

  // ANKLES
  addPart(new THREE.SphereGeometry(0.065, 10, 10), SKIN, -0.19, -0.35, 0);
  addPart(new THREE.SphereGeometry(0.065, 10, 10), SKIN, 0.19, -0.35, 0);

  // FEET
  addPart(new THREE.BoxGeometry(0.11, 0.07, 0.22), SKIN, -0.19, -0.4, 0.05);
  addPart(new THREE.BoxGeometry(0.11, 0.07, 0.22), SKIN, 0.19, -0.4, 0.05);

  group.position.y = 0.4;
  scene.add(group);
  return { group, parts, lThigh, rThigh, lCalf, rCalf, lUpperArm, rUpperArm, lForearm, rForearm, chest, abs, pelvis };
}

const MUSCLE_ZONE_MAP = {
  "Quadriceps": "front-thigh",
  "Glutes": "rear-hip",
  "Hamstrings": "front-thigh",
  "Core": "abdomen",
  "Calves": "lower-leg",
  "Chest": "chest",
  "Triceps": "rear-upper-arm",
  "Front Shoulders": "shoulder",
  "Serratus Anterior": "chest",
  "Transverse Abdominis": "abdomen",
  "Rectus Abdominis": "abdomen",
  "Obliques": "abdomen",
  "Lower Back": "rear-hip",
  "Shoulders": "shoulder",
};

function BodyDiagram({ exercise }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 400;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0.9, 3.4);
    camera.lookAt(0, 0.9, 0);

    // Warm lighting for skin tone
    const ambient = new THREE.AmbientLight(0xfff5e6, 0.7);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(2, 4, 3);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe0b0, 0.5);
    fill.position.set(-2, 2, 1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xaaddff, 0.3);
    rim.position.set(0, 3, -3);
    scene.add(rim);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 48),
      new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const figure = buildAnatomicalFigure(scene);

    // Highlight muscles
    const allMuscles = [...exercise.muscles.primary, ...exercise.muscles.secondary];
    figure.parts.forEach(part => {
      const zone = part.userData.zone;
      if (!zone) return;
      const matchedMuscle = allMuscles.find(m => MUSCLE_ZONE_MAP[m] === zone);
      if (matchedMuscle) {
        const isPrimary = exercise.muscles.primary.includes(matchedMuscle);
        part.material.color.set(isPrimary ? exercise.color : "#cc8833");
        part.material.emissive = new THREE.Color(isPrimary ? exercise.color : "#884400");
        part.material.emissiveIntensity = isPrimary ? 0.4 : 0.15;
        part.material.roughness = 0.3;
      }
    });

    let rotY = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016;
      const t = timeRef.current;
      rotY += 0.005;
      figure.group.rotation.y = rotY;

      // Exercise animations
      if (exercise.animType === "squat") {
        const depth = (Math.sin(t * 0.9) * 0.5 + 0.5) * 0.45;
        figure.lThigh.rotation.x = -depth * 1.3;
        figure.rThigh.rotation.x = -depth * 1.3;
        figure.lCalf.rotation.x = depth * 1.5;
        figure.rCalf.rotation.x = depth * 1.5;
        figure.group.position.y = 0.4 - depth * 0.3;
      } else if (exercise.animType === "pushup") {
        const depth = (Math.sin(t * 0.9) * 0.5 + 0.5) * 0.35;
        figure.lUpperArm.rotation.z = 0.18 + depth * 0.55;
        figure.rUpperArm.rotation.z = -(0.18 + depth * 0.55);
        figure.lForearm.rotation.z = 0.12 + depth * 0.3;
        figure.rForearm.rotation.z = -(0.12 + depth * 0.3);
        figure.group.position.y = 0.4 - depth * 0.2;
      } else if (exercise.animType === "lunge") {
        const depth = Math.max(0, Math.sin(t * 0.8)) * 0.55;
        figure.lThigh.rotation.x = -depth * 1.1;
        figure.rThigh.rotation.x = depth * 0.9;
        figure.lCalf.rotation.x = depth * 1.0;
        figure.rCalf.rotation.x = -depth * 0.45;
        figure.group.position.y = 0.4 - depth * 0.22;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
    };
  }, [exercise]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

export default function ExerciseDemo() {
  const [selectedEx, setSelectedEx] = useState(EXERCISES[0]);
  const [activeTab, setActiveTab] = useState("steps");
  const [activeMuscle, setActiveMuscle] = useState(null);
  const accent = selectedEx.color;

  const allMuscles = [...selectedEx.muscles.primary, ...selectedEx.muscles.secondary];

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap');
    * { font-family: 'DM Sans', sans-serif; }
    .title { font-family: 'Cormorant Garamond', serif; }
    .ex-scrollable { overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.06) transparent; }
    .ex-card { transition: all .2s ease; border: 1px solid rgba(255,255,255,.06); }
    .ex-card:hover { transform:translateY(-2px); border-color: rgba(255,255,255,.18); }
    .ex-card.active { border-color: var(--accent) !important; background: rgba(var(--accent-rgb),.08) !important; }
    .tab-btn { transition: all .2s; border-bottom: 2px solid transparent; }
    .tab-btn.active { border-color: var(--accent); }
    .muscle-chip { transition: all .15s; cursor: pointer; border: 1px solid transparent; }
    .muscle-chip:hover { transform: scale(1.03); }
    .muscle-chip.selected { border-color: currentColor; }
    @keyframes fade-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .fi { animation: fade-in .3s ease forwards; }
    @keyframes slidedown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    .slidedown { animation: slidedown .25s ease forwards; }
  `;

  return (
    <div className="bg-black" style={{minHeight:"600px", fontFamily:"'DM Sans', sans-serif"}}>
      <style>{styles}</style>

      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-900">
        <p className="text-xs tracking-widest text-gray-600 uppercase mb-1">Demeter Health - Exercise Library</p>
        <h2 className="title text-4xl font-light text-white">3D <span style={{color:"#00c864"}}>Exercise</span> Demos</h2>
        <p className="text-gray-600 text-xs mt-1">Interactive muscle maps, motion previews and form guidance</p>
      </div>

      <div className="flex flex-col lg:flex-row" style={{minHeight:"560px"}}>

        {/* Exercise list */}
        <div className="lg:w-48 border-r border-gray-900 p-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible ex-scrollable">
          {EXERCISES.map(ex => (
            <button
              key={ex.id}
              onClick={() => { setSelectedEx(ex); setActiveTab("steps"); setActiveMuscle(null); }}
              className={`ex-card rounded-xl p-3 text-left flex-shrink-0 lg:flex-shrink ${selectedEx.id===ex.id?"active":""}`}
              style={{"--accent":ex.color,"--accent-rgb":"0,200,100", background: selectedEx.id===ex.id ? `${ex.color}10` : "rgba(255,255,255,.02)"}}
            >
              <p className="text-white text-xs font-medium">{ex.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{ex.category}</p>
              <span className="text-xs mt-2 inline-block px-2 py-0.5 rounded-full" style={{background:`${ex.color}20`,color:ex.color}}>{ex.difficulty}</span>
            </button>
          ))}
        </div>

        {/* 3D Viewport */}
        <div className="lg:flex-1 relative" style={{background:"radial-gradient(ellipse at 50% 30%, #0d1a12 0%, #000000 100%)", minHeight:"360px"}}>
          <BodyDiagram key={selectedEx.id} exercise={selectedEx} />

          {/* Top overlay */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <div>
              <h3 className="title text-2xl text-white font-light">{selectedEx.name}</h3>
              <p className="text-gray-500 text-xs">{selectedEx.reps} - Rest {selectedEx.rest}</p>
            </div>
          </div>

          {/* Muscle chips overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-gray-600 text-xs mb-2 uppercase tracking-widest">Tap a muscle to learn more</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedEx.muscles.primary.map(m => (
                <button key={m} onClick={() => setActiveMuscle(activeMuscle===m?null:m)} className={`muscle-chip text-xs px-3 py-1 rounded-full font-medium ${activeMuscle===m?"selected":""}`} style={{background:`${accent}25`,color:accent,borderColor:activeMuscle===m?accent:"transparent"}}>
                  {m}
                </button>
              ))}
              {selectedEx.muscles.secondary.map(m => (
                <button key={m} onClick={() => setActiveMuscle(activeMuscle===m?null:m)} className={`muscle-chip text-xs px-3 py-1 rounded-full ${activeMuscle===m?"selected":""}`} style={{background:"rgba(255,255,255,.07)",color:"#888",borderColor:activeMuscle===m?"#888":"transparent"}}>
                  {m}
                </button>
              ))}
            </div>

            {/* Muscle detail popup */}
            {activeMuscle && selectedEx.muscleDetails[activeMuscle] && (
              <div className="slidedown mt-3 p-3 rounded-xl border" style={{background:"rgba(0,0,0,.85)",borderColor:"rgba(255,255,255,.1)",backdropFilter:"blur(8px)"}}>
                <p className="font-semibold text-sm mb-1" style={{color: selectedEx.muscles.primary.includes(activeMuscle) ? accent : "#aaa"}}>{activeMuscle}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{selectedEx.muscleDetails[activeMuscle]}</p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 pointer-events-none">
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-full" style={{background:accent}}/> Primary</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-yellow-700"/> Secondary</span>
          </div>
        </div>

        {/* Info Panel */}
        <div className="lg:w-72 border-l border-gray-900 flex flex-col ex-scrollable">
          <div className="flex border-b border-gray-900 px-3" style={{"--accent":accent}}>
            {["steps","precautions","details"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn px-3 py-3 text-xs uppercase tracking-wider ${activeTab===tab?"active text-white":"text-gray-600"}`} style={{"--accent":accent}}>
                {tab==="steps"?"Form":tab==="precautions"?"Safety":"Details"}
              </button>
            ))}
          </div>

          <div className="p-5 fi flex-1" key={selectedEx.id+activeTab}>
            {activeTab === "steps" && (
              <div className="space-y-4">
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Step-by-step form</p>
                {selectedEx.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-black mt-0.5" style={{background:accent}}>{i+1}</span>
                    <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "precautions" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Safety notes</p>
                {selectedEx.precautions.map((p, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl" style={{background:"rgba(249,115,22,.06)",border:"1px solid rgba(249,115,22,.15)"}}>
                    <span className="text-orange-500 flex-shrink-0 mt-0.5 text-sm">!</span>
                    <p className="text-gray-300 text-sm leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "details" && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">Exercise details</p>
                <div className="space-y-3">
                  {[["Category",selectedEx.category],["Difficulty",selectedEx.difficulty],["Sets and Reps",selectedEx.reps],["Rest Period",selectedEx.rest]].map(([k,v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-gray-900">
                      <span className="text-gray-500 text-sm">{k}</span>
                      <span className="text-white text-sm" style={k==="Difficulty"?{color:accent}:{}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <p className="text-gray-600 text-xs uppercase tracking-widest mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEx.tags.map(t => (
                      <span key={t} className="text-xs px-3 py-1 rounded-full" style={{background:`${accent}12`,color:accent,border:`1px solid ${accent}25`}}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}