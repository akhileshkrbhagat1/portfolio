/*
 * ============================================================
 *  SITE CONTENT — edit this file to update the portfolio.
 *  No build step: save, then drag the folder onto Netlify.
 *
 *  YouTube "id" = the part after  watch?v=  or  /shorts/
 *  Add  short: true  for Shorts (vertical videos).
 *
 *  featured: { color, ink, file, say }
 *     -> shown as a full-screen story slide at the top of the page
 *        color = slide background, ink = text colour on it,
 *        file  = label in the video window,
 *        outfit = what the 3D mascot wears: polo, tee, music, polo-music, phone, vr
 *        say   = the two lines the character says while you scroll through it
 *  segment  -> which group the project is listed under (see "segments")
 *  label    -> small text on the right of the tile (patent, paper, main chip)
 * ============================================================
 */
window.SITE = {
  github: "akhileshkrbhagat1",

  segments: [
    { key: "music", title: "Musical interfaces", blurb: "Instruments you play with your fingers, rings and gravity.", say: "These are the instruments. Two of them are patented." },
    { key: "assistive", title: "Assistive & HCI", blurb: "Hardware for people the default interface forgets.", say: "This group is about access — eyes, mouths and distracted walkers." },
    { key: "robotics", title: "Robotics", blurb: "Bots that roll, follow lines you draw, and fight in arenas.", say: "Robots! The arena one had 150+ people driving at once." },
    { key: "embedded", title: "Embedded & Linux", blurb: "Close to the metal: kernel modules, bare-metal C, UART.", say: "Kernel drivers and bare-metal C. My favourite kind of debugging." },
    { key: "vision", title: "AI & Vision", blurb: "Depth cameras, tracking and language models driving hardware.", say: "Cameras and models — mostly to make hardware smarter." }
  ],

  projects: [
    /* ---------------- Musical interfaces ---------------- */
    {
      slug: "layika",
      segment: "music",
      title: "Layika — Tabla Glove",
      label: "Patent · NIME ’26",
      summary: "Musicians count taal by tapping finger creases. This glove listens to those taps and plays real tabla sounds, so you can practise without an accompanist.",
      tags: ["ESP32", "ESP-NOW", "FreeRTOS", "MIDI"],
      video: { id: "SofK-4aszQ4" },
      featured: { color: "#8a2c17", ink: "#fff6ec", file: "tabla_glove.mp4", outfit: "music", say: ["Musicians keep rhythm by tapping their fingers. This glove turns those taps into *real tabla sounds*.", "ESP32 and ESP-NOW keep it fast enough to play live. It's patented — *No. 588076*."] },
      details: [
        "Conductive yarn on the finger creases detects taps; the microcontroller triggers MIDI tabla notes in real time.",
        "ESP32 firmware on FreeRTOS samples the glove and sends hits over a low-latency ESP-NOW link.",
        "Granted Indian patent No. 588076. Published at NIME 2026 as “Layika”.",
        "I worked on the v1 design & engineering and the v2 redesign."
      ],
      links: [{ label: "Paper", url: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=IMn1kfAAAAAJ&citation_for_view=IMn1kfAAAAAJ:qjMakFHDy7sC" }]
    },
    {
      slug: "swarings",
      segment: "music",
      title: "Swarings",
      label: "Patent · UIST ’25",
      summary: "Rings on a pipe make an instrument: touch a ring to play a note, slide it to bend pitch, rotate it for modulation.",
      tags: ["MIDI controller", "Touch & rotation sensing"],
      video: { id: "Udih5roTKNM" },
      featured: { color: "#14284a", ink: "#f4f6ff", file: "swarings.mp4", outfit: "polo-music", say: ["Next, *Swarings*. Rings on a pipe — touch for a note, slide to bend, rotate to modulate.", "We showed it at *UIST 2025*, and it's patented too — No. 587794."] },
      details: [
        "Three gestures — touch, slide, rotate — give digital music the continuous control of an acoustic instrument.",
        "Granted Indian patent No. 587794.",
        "Published in the Adjunct Proceedings of ACM UIST 2025; played live in NIME concerts."
      ],
      links: [{ label: "Paper", url: "https://dl.acm.org/doi/abs/10.1145/3746058.3758455" }]
    },
    {
      slug: "gravitone",
      segment: "music",
      title: "GraviTone",
      label: "NIME ’25",
      summary: "A tangible instrument built around a gravity well — orbiting balls become melody.",
      tags: ["Sensors", "Sonification"],
      video: { id: "ZXFu8Hwz9fA" },
      details: [
        "Inspired by the space-time mesh model of gravity; data sonification turns motion into sound.",
        "Published at NIME 2025 and shown at India HCI 2025."
      ],
      links: [{ label: "Paper", url: "https://nime.org/proc/nime2025_95/index.html" }]
    },
    {
      slug: "theremin",
      segment: "music",
      title: "Digital Theremin",
      label: "ESP8266",
      summary: "Pitch from hand distance via capacitive sensing — no touch.",
      tags: ["ESP8266", "Capacitive sensing"],
      video: { id: "bDaz183k65o" },
      details: ["ESP8266 reads hand distance through capacitive sensing and maps it to pitch."]
    },

    /* ---------------- Assistive & HCI ---------------- */
    {
      slug: "pathbuddy",
      segment: "assistive",
      title: "PathBuddy",
      label: "Best Paper · INDIS ’26",
      summary: "People walk into things while looking at their phones. PathBuddy watches the path with a depth sensor and shows time-to-impact warnings on the screen they're already looking at.",
      tags: ["Depth sensing", "Android", "Computer vision"],
      video: { id: "aQCHRbr6DfE" },
      featured: { color: "#b8a7f0", ink: "#15121f", file: "pathbuddy.mp4", outfit: "phone", say: ["Ever walked into something while texting? *PathBuddy* sees it first, with a depth sensor.", "It warns you on the screen you're already staring at. *Best Paper* at INDIS 2026."] },
      details: [
        "External depth sensor + real-time on-screen overlays and time-to-impact estimates; no changes to the phone's hardware.",
        "User study: more obstacles detected, lower cognitive load, better situational awareness.",
        "First-author paper — Best Paper Award at INDIS 2026, IIT Guwahati.",
        "Patent application 202511070920; listed for industry licensing by IIT Kanpur."
      ]
    },
    {
      slug: "mouth-tracker",
      segment: "assistive",
      title: "Mouth Tracker for XR",
      label: "CHI ’26",
      summary: "XR assumes everyone has hands. This tracker reads tongue, cheek and jaw movement instead — built with disabled artists.",
      tags: ["ESP32-CAM", "IR camera", "UART", "XR"],
      video: { id: "4WwQTNpG0hs" },
      featured: { color: "#f5d547", ink: "#17150a", file: "mouth_tracker.mp4", outfit: "vr", say: ["Last one. XR assumes everyone has hands — this tracker reads your *mouth* instead.", "ESP32-CAM and an IR camera, built with disabled artists. We took it to *CHI 2026*."] },
      details: [
        "Custom hardware: ESP32-CAM firmware driving an IR camera, built on the open-source Babble project.",
        "Streams camera data to the tracking software for hands-free control in XR.",
        "Published at ACM CHI 2026: “When Assistive Technologies become Provocations”."
      ],
      links: [{ label: "Paper", url: "https://dl.acm.org/doi/abs/10.1145/3772318.3791535" }]
    },
    {
      slug: "gaze-icu",
      segment: "assistive",
      title: "Gaze Control for ICU Patients",
      label: "ESP32",
      summary: "Bedridden patients pick options and raise alerts with their eyes alone.",
      tags: ["ESP32", "Embedded C", "Eye-gaze"],
      video: { id: "ZBW_Mjhi-4Q" },
      details: [
        "Eye-gaze interface with a tile menu; ESP32 drives the alert actuators.",
        "Input validation avoids false triggers from natural blinking."
      ]
    },
    {
      slug: "air-remote",
      segment: "assistive",
      title: "Air Remote",
      label: "BMX160 · ESP-NOW",
      summary: "Move your hand to move the pointer; buttons change slides.",
      tags: ["ESP32", "BMX160 IMU", "ESP-NOW", "I²C"],
      signal: "IMU → ESP32 ⇢ ESP32 → PC",
      details: [
        "BMX160 IMU over I²C; the handheld ESP32 sends motion over ESP-NOW to a receiver ESP32.",
        "The receiver forwards to a Python app over serial, which moves the pointer and flips slides."
      ],
      links: [{ label: "GitHub", url: "https://github.com/akhileshkrbhagat1/air_mouse_for_presentations" }]
    },

    /* ---------------- Robotics ---------------- */
    {
      slug: "robo-rumble",
      segment: "robotics",
      title: "Robo Rumble Teleop Bots",
      label: "MQTT",
      summary: "Wi-Fi robots driven from a web page over MQTT; run live with 150+ users.",
      tags: ["ESP8266", "MQTT", "WebSocket"],
      video: { id: "Y03LePD6zvE" },
      details: [
        "Web UI publishes forward / back / left / right / stop over MQTT (WebSocket) to a Mosquitto broker.",
        "ESP8266 / ESP32 firmware subscribes to the robot's topic and drives the motors.",
        "Run live at a robotics event with 150+ users."
      ],
      links: [
        { label: "TeleOP_Bot", url: "https://github.com/akhileshkrbhagat1/TeleOP_Bot" },
        { label: "RobobumbleCC", url: "https://github.com/akhileshkrbhagat1/RobobumbleCC" }
      ]
    },
    {
      slug: "sphere-bot",
      segment: "robotics",
      title: "Mini Sphere Bot",
      label: "Gas sensing",
      summary: "A small rolling robot with gas sensors for places people shouldn't go.",
      tags: ["ESP32", "MQ sensors", "Motor control"],
      video: { id: "owTTS3fFRSM" },
      details: ["Gas-sensor interfacing, motor control and navigation in a compact spherical body."]
    },
    {
      slug: "shape-follow",
      segment: "robotics",
      title: "Shape-Following Robot",
      label: "Path planning",
      summary: "Draw a path on a touchscreen; the robot drives it.",
      tags: ["Contour detection", "JavaScript"],
      video: { id: "XuM-Vf0w7Zs", short: true },
      details: ["User-drawn contours become a sequence of drive commands, followed in real time."]
    },
    {
      slug: "robodominion",
      segment: "robotics",
      title: "Robo Dominion Control Room",
      label: "Web Serial",
      summary: "Live broadcast page and admin control room for a robot battle.",
      tags: ["JavaScript", "Web Serial", "ESP-NOW"],
      signal: "Admin UI ⇄ USB ⇄ ESP-NOW",
      details: [
        "Public page with camera feeds, scores, bot health and tower state.",
        "Admin page runs the match and talks to an ESP32 ESP-NOW master over Web Serial."
      ],
      links: [{ label: "GitHub", url: "https://github.com/akhileshkrbhagat1/RoboDominion" }]
    },

    /* ---------------- Embedded & Linux ---------------- */
    {
      slug: "linux-driver",
      segment: "embedded",
      title: "Linux Kernel Drivers",
      label: "C · ProcFS",
      summary: "Loadable modules, ProcFS drivers and a Raspberry Pi GPIO LED driver.",
      tags: ["C", "Linux", "ProcFS / sysfs"],
      video: { id: "kCe2IH1ZpLQ" },
      details: [
        "Hello-world LKM, a ProcFS driver creating /proc/Kr_driver, and kernel → user-space data read by Python.",
        "LED driver on Raspberry Pi Zero 2 W: on at insmod, off at rmmod, then controlled via procfs/sysfs."
      ],
      links: [{ label: "GitHub", url: "https://github.com/akhileshkrbhagat1/linux_driver_devlopment" }]
    },
    {
      slug: "pico",
      segment: "embedded",
      title: "Raspberry Pi Pico, Bare-Metal",
      label: "Pico SDK",
      summary: "RP2040 in C with the Pico SDK and CMake — no OS.",
      tags: ["C", "Pico SDK", "CMake"],
      video: { id: "dJYTV-usOQY", short: true },
      details: ["GPIO control, timing and low-level hardware interfacing without an operating system."]
    },
    {
      slug: "face-lock",
      segment: "embedded",
      title: "Facial Recognition Lock",
      label: "Pi + ESP32",
      summary: "Raspberry Pi recognises the face; an ESP32 drives the lock over UART.",
      tags: ["Raspberry Pi", "ESP32", "UART"],
      video: { id: "mzu6PfCb3Aw" },
      details: ["OpenCV recognition on the Pi; GPIO actuation of the lock from ESP32 firmware."]
    },

    /* ---------------- AI & Vision ---------------- */
    {
      slug: "rgbd",
      segment: "vision",
      title: "RGB-D 3D Object Detection",
      label: "RealSense",
      summary: "Detections placed in real 3D space using an Intel RealSense.",
      tags: ["Python", "RealSense", "OpenCV"],
      video: { id: "Z1wGa7aI8Yo" },
      details: ["Synchronised colour + depth capture; detections combined with depth to estimate real-world positions."]
    },
    {
      slug: "motion-tracker",
      segment: "vision",
      title: "Speed & Displacement Tracker",
      label: "OpenCV",
      summary: "Tracks fast-moving balls and measures their speed and displacement.",
      tags: ["Python", "OpenCV"],
      video: { id: "dgAwJUS-uGE" },
      details: ["Frame-by-frame tracking; speed and displacement derived from the trajectory and plotted live."]
    },
    {
      slug: "neuro",
      segment: "vision",
      title: "Neuro — LLM Assistant",
      label: "LLMs · MQTT",
      summary: "Plain-language commands that run on your PC or on ESP32 devices.",
      tags: ["Python", "LLMs", "MQTT", "ESP32"],
      video: { id: "0bmbddCC9Mw", short: true },
      details: [
        "Classifies each query and routes it to the right model or automation script.",
        "Real-time lookup, task automation, image generation, and IoT control over MQTT."
      ],
      links: [{ label: "GitHub", url: "https://github.com/akhileshkrbhagat1/Nuero_LLM" }]
    }
  ],

  /*
   * GitHub repos load live from the GitHub API.
   * This list is the fallback and supplies descriptions for repos that have none.
   */
  repos: [
    { name: "pdf-from-yt-link", language: "Python", stars: 5, updated: "2026-09-26", description: "YouTube video → unique frames + synced transcript, as two PDFs." },
    { name: "cdc2026", language: "PHP", stars: 0, updated: "2026-08-21", description: "Circuit Design Challenge: secure online exam platform (PHP + MySQL)." },
    { name: "RoboDominion", language: "C++", stars: 0, updated: "2026-08-21", description: "Robot-battle dashboard with a Web Serial link to an ESP-NOW master." },
    { name: "cdc_portal", language: null, stars: 0, updated: "2026-05-31", description: "Portal for the Circuit Design Challenge." },
    { name: "linux_driver_devlopment", language: "C", stars: 0, updated: "2026-03-16", description: "Kernel modules and ProcFS drivers, kernel ↔ user space." },
    { name: "air_mouse_for_presentations", language: "Python", stars: 0, updated: "2026-01-05", description: "IMU air remote and virtual pointer (ESP32 + ESP-NOW + Python)." },
    { name: "RRCC_2.0", language: null, stars: 0, updated: "2025-10-04", description: "Work in progress." },
    { name: "TeleOP_Bot", language: "C++", stars: 0, updated: "2025-04-29", description: "Drive a Wi-Fi robot from a web page over MQTT." },
    { name: "GyroTrack", language: "MATLAB", stars: 0, updated: "2025-04-29", description: "Phone gyro + accelerometer streamed to a PC over UDP; Python and MATLAB viewers." },
    { name: "TeA-Terminal_Assistant", language: "Python", stars: 0, updated: "2025-04-29", description: "Writes, runs and debugs shell scripts from plain English (Gemini API)." },
    { name: "Nuero_LLM", language: "Python", stars: 0, updated: "2025-04-29", description: "LLM assistant that controls IoT devices and your PC." },
    { name: "RobobumbleCC", language: "PHP", stars: 0, updated: "2025-04-29", description: "Robo Rumble controller: web UI → MQTT/WebSocket → ESP8266." }
  ]
};
