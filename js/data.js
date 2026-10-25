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
  segments: [
    { key: "music", title: "Musical interfaces", blurb: "Instruments you play with your fingers, rings and gravity.", say: "These are the instruments. Two of them are patented." },
    { key: "assistive", title: "HCI & Assistive", blurb: "Control with your eyes or mouth, safer walking with a phone, and a guide for new dance audiences.", say: "This group is about access — eyes, mouths, dance and safer walking." },
    { key: "robotics", title: "Robotics", blurb: "Bots that roll, follow lines you draw, and fight in arenas.", say: "Robots! The arena one had 150+ people driving at once." },
    { key: "embedded", title: "Embedded & Linux", blurb: "Close to the metal: kernel modules, bare-metal C, UART.", say: "Kernel drivers and bare-metal C. My favourite kind of debugging." },
    { key: "vision", title: "AI & Vision", blurb: "Wearable cameras, depth sensing and language models driving hardware.", say: "Cameras and models — mostly to make hardware smarter." }
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
      summary: "Coloured balls orbit a gravity well on a stretchy space-time fabric; an overhead camera tracks them and turns their motion into music and live visuals.",
      tags: ["OpenCV", "Max/MSP", "TouchDesigner", "OSC / MIDI"],
      video: { id: "ZXFu8Hwz9fA" },
      details: [
        "Balls launched from the rim orbit a central mass on the fabric; an overhead camera tracks each one (OpenCV).",
        "Speed, position and orbit are mapped to synth parameters, VSTs and DAWs over OSC and MIDI.",
        "Plays Indian classical ragas or Western scales, with real-time visuals that follow the balls.",
        "Published at NIME 2025 and shown at India HCI 2025. I worked on the design and engineering, including the ball-tracking prototype."
      ],
      links: [
        { label: "Paper", url: "https://nime.org/proc/nime2025_95/index.html" },
        { label: "Ball-tracking prototype", url: "https://www.youtube.com/watch?v=dgAwJUS-uGE" }
      ]
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
      summary: "Hands-free control for XR: this tracker reads tongue, cheek and jaw movement. Co-designed with artists who use it.",
      tags: ["ESP32-CAM", "IR camera", "UART", "XR"],
      video: { id: "4WwQTNpG0hs" },
      featured: { color: "#f5d547", ink: "#17150a", file: "mouth_tracker.mp4", outfit: "vr", say: ["Last one. Control XR *hands-free* — this tracker reads your *mouth* movements.", "ESP32-CAM and an IR camera, co-designed with artists. We took it to *CHI 2026*."] },
      details: [
        "Custom hardware: ESP32-CAM firmware driving an IR camera, built on the open-source Babble project.",
        "Streams camera data to the tracking software for hands-free control in XR.",
        "Published at ACM CHI 2026: “When Assistive Technologies become Provocations”."
      ],
      links: [{ label: "Paper", url: "https://dl.acm.org/doi/abs/10.1145/3772318.3791535" }]
    },
    {
      slug: "dance-scaffold",
      segment: "assistive",
      title: "Reading Indian Classical Dance",
      label: "C&C ’26",
      summary: "A system that recognises a dancer's hand gestures (mudras) and expressions (rasa) and narrates their meaning, so new audiences can follow the story.",
      tags: ["Computer vision", "Multimodal AI", "Eye tracking", "HCI"],
      video: { id: "ZX85xmg42VQ" },
      details: [
        "Extracts mudras, facial expressions and audio from a performance and produces text or spoken narration.",
        "Study with 10 viewers using interviews and gaze tracking: audio narration kept eyes on the dancer, text overlays pulled them away.",
        "Published at ACM Creativity & Cognition 2026."
      ],
      links: [{ label: "Paper", url: "https://dl.acm.org/doi/10.1145/3803784.3816837" }]
    },
    {
      slug: "gaze-icu",
      segment: "assistive",
      title: "Eye-Gaze Control for the ICU",
      label: "ESP32",
      summary: "Lets people in intensive care choose options and call for help using just their eyes.",
      tags: ["ESP32", "Embedded C", "Eye-gaze"],
      video: { id: "ZBW_Mjhi-4Q" },
      details: [
        "Eye-gaze interface with a tile menu; ESP32 drives the alert actuators.",
        "Input validation avoids false triggers from natural blinking."
      ]
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
      label: "Live event",
      summary: "The live broadcast and control room for Robo Dominion, the robot battle run by Yantra at IIT Madras.",
      tags: ["JavaScript", "Web Serial", "ESP-NOW", "ESP32"],
      video: { id: "A_dG05AvUfc" },
      details: [
        "Public live page with camera feeds, scores, bot health and tower state, shown on the big screen.",
        "Admin control room starts and pauses the match and talks to an ESP32 ESP-NOW master over Web Serial.",
        "Ran the full live event and run-through in June 2026."
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
      slug: "hux-ai",
      segment: "vision",
      title: "HUX AI 2.0",
      label: "HIVE Lab",
      summary: "A cap-mounted camera sees what the wearer sees while a second camera watches their face — a live AI rig for understanding human experience.",
      tags: ["Wearable camera", "Computer vision", "AI", "HCI"],
      video: { id: "EnDfHaJ_veg" },
      details: [
        "First-person camera on a cap streams the wearer's view; a face camera captures their reactions at the same time.",
        "Built at HIVE Lab, IIT Kanpur, where I was a designer, researcher and engineer on the project."
      ]
    },
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
  ]
};
