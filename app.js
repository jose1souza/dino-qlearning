// =========================================================================
// 1. ASSETS DO DINOSSAURO (Arks Dino Characters: 24 frames de 24x24)
//    - 0..3: Idle | 4..9: Correr | 10..12: Saltar | 14: Hurt (colisão)
// =========================================================================
const DINO_META = {
    vita: {
        name: "Vita (Verde)",
        aliases: ["DinoSprites - vita.png", "vita.png", "green.png", "dino-green.png"],
        palette: { body: "#94b54a", dark: "#5f7a29", belly: "#f2d3ab", spike: "#c93b3b", outline: "#1b2410" }
    },
    mort: {
        name: "Mort (Vermelho)",
        aliases: ["DinoSprites - mort.png", "mort.png", "red.png", "dino-red.png"],
        palette: { body: "#a33c3c", dark: "#6b2323", belly: "#f2d3ab", spike: "#479c3b", outline: "#241212" }
    },
    tard: {
        name: "Tard (Amarelo)",
        aliases: ["DinoSprites - tard.png", "tard.png", "yellow.png", "dino-yellow.png"],
        palette: { body: "#f0bd59", dark: "#b58226", belly: "#f7e2be", spike: "#2d6ec4", outline: "#261f10" }
    },
    doux: {
        name: "Doux (Azul)",
        aliases: ["DinoSprites - doux.png", "doux.png", "blue.png", "dino-blue.png"],
        palette: { body: "#487db3", dark: "#2c537a", belly: "#f2d3ab", spike: "#9c3b8e", outline: "#121b26" }
    }
};

const spritesheets = { vita: null, mort: null, tard: null, doux: null };
const loadedExternal = { vita: false, mort: false, tard: false, doux: false };
let activeDinoKey = "vita";

// Detecta se a imagem é um spritesheet horizontal (24 frames) ou apenas 1 frame
function getSheetMetrics(sheet) {
    const isStrip = sheet.width >= sheet.height * 10;
    return {
        isStrip,
        fw: isStrip ? sheet.width / 24 : sheet.width,
        fh: sheet.height
    };
}

// Fallback em pixel-art 24x24 (24 frames = 576x24) caso as imagens ainda não estejam na pasta
function createFallbackSpritesheet(palette) {
    const c = document.createElement("canvas");
    c.width = 24 * 24;
    c.height = 24;
    const g = c.getContext("2d");

    function px(frame, x, y, color) {
        g.fillStyle = color;
        g.fillRect(frame * 24 + x, y, 1, 1);
    }

    function rect(frame, x, y, w, h, color) {
        g.fillStyle = color;
        g.fillRect(frame * 24 + x, y, w, h);
    }

    for (let f = 0; f < 24; f++) {
        const isIdle = f <= 3;
        const isRun = f >= 4 && f <= 9;
        const isJump = f >= 10 && f <= 12;
        const isHurt = f === 14 || f === 16;
        const bob = (isIdle && (f === 1 || f === 2)) || (isRun && f % 2 === 1) ? 1 : 0;
        const yOff = (isJump ? -1 : 0) + bob;

        rect(f, 7, 4 + yOff, 11, 1, palette.outline);
        rect(f, 6, 5 + yOff, 1, 7, palette.outline);
        rect(f, 18, 5 + yOff, 1, 5, palette.outline);
        rect(f, 13, 10 + yOff, 5, 1, palette.outline);
        rect(f, 13, 11 + yOff, 1, 7, palette.outline);
        rect(f, 7, 12 + yOff, 1, 6, palette.outline);

        rect(f, 7, 5 + yOff, 11, 5, palette.body);
        rect(f, 8, 10 + yOff, 5, 8, palette.body);
        rect(f, 7, 12 + yOff, 1, 5, palette.dark);
        rect(f, 10, 12 + yOff, 3, 4, palette.belly);

        rect(f, 5, 6 + yOff, 1, 2, palette.spike);
        rect(f, 5, 9 + yOff, 1, 2, palette.spike);

        const tailY = isRun && f % 2 === 0 ? 14 : 15;
        rect(f, 4, tailY + yOff, 3, 2, palette.body);
        rect(f, 3, tailY + yOff, 1, 1, palette.outline);
        rect(f, 4, tailY + 2 + yOff, 3, 1, palette.outline);

        if (isHurt) {
            rect(f, 9, 6 + yOff, 3, 4, "#ffffff");
            px(f, 10, 7 + yOff, "#111111");
        } else {
            rect(f, 9, 6 + yOff, 2, 3, "#ffffff");
            px(f, 10, 7 + yOff, "#111111");
        }

        px(f, 15, 7 + yOff, palette.outline);
        px(f, 17, 8 + yOff, palette.outline);

        if (isJump) {
            rect(f, 8, 18 + yOff, 2, 2, palette.dark);
            rect(f, 12, 16 + yOff, 2, 2, palette.body);
            rect(f, 8, 20 + yOff, 2, 1, palette.outline);
        } else if (isRun) {
            const phase = f - 4;
            const leg1 = phase % 3 === 0 ? 17 : 18;
            const leg2 = phase % 3 === 1 ? 17 : 18;
            rect(f, 8, leg1 + yOff, 2, 2, palette.dark);
            rect(f, 11, leg2 + yOff, 2, 2, palette.body);
            rect(f, 8, leg1 + 2 + yOff, 2, 1, palette.outline);
            rect(f, 11, leg2 + 2 + yOff, 2, 1, palette.outline);
        } else {
            rect(f, 8, 18 + yOff, 2, 2, palette.dark);
            rect(f, 11, 18 + yOff, 2, 2, palette.body);
            rect(f, 8, 20 + yOff, 2, 1, palette.outline);
            rect(f, 11, 20 + yOff, 2, 1, palette.outline);
        }
    }
    return c;
}

for (const key of Object.keys(DINO_META)) {
    spritesheets[key] = createFallbackSpritesheet(DINO_META[key].palette);
}

function drawPreviews() {
    for (const key of Object.keys(DINO_META)) {
        const pc = document.getElementById(`prev-${key}`);
        if (!pc) continue;
        const pctx = pc.getContext("2d");
        pctx.imageSmoothingEnabled = false;
        pctx.clearRect(0, 0, 24, 24);
        const sheet = spritesheets[key];
        const { fw, fh } = getSheetMetrics(sheet);
        pctx.drawImage(sheet, 0, 0, fw, fh, 0, 0, 24, 24);
    }
}

function updateAssetStatusBadge() {
    const el = document.getElementById("assetStatus");
    const count = Object.values(loadedExternal).filter(Boolean).length;
    if (count > 0) {
        el.textContent = `✓ ${count}/4 spritesheets carregados de images/`;
        el.classList.add("loaded");
    } else {
        el.textContent = "Fallback ativo — coloque os PNGs em images/ ou carregue acima";
        el.classList.remove("loaded");
    }
}

// Prioriza ./images/ e também verifica caminhos comuns
function probeLocalAssets() {
    const prefixes = ["./images/", "./", "./sheets/", "./assets/", "./sprites/"];
    for (const key of Object.keys(DINO_META)) {
        const candidates = [];
        for (const prefix of prefixes) {
            for (const alias of DINO_META[key].aliases) {
                candidates.push(`${prefix}${alias}`);
            }
        }

        let idx = 0;
        function tryNext() {
            if (idx >= candidates.length) return;
            const img = new Image();
            img.onload = () => {
                spritesheets[key] = img;
                loadedExternal[key] = true;
                drawPreviews();
                updateAssetStatusBadge();
            };
            img.onerror = () => {
                idx++;
                tryNext();
            };
            img.src = candidates[idx];
        }
        tryNext();
    }
}

document.getElementById("assetInput").addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
        const lower = file.name.toLowerCase();
        let targetKey = activeDinoKey;
        if (lower.includes("vita") || lower.includes("verde") || lower.includes("green")) targetKey = "vita";
        else if (lower.includes("mort") || lower.includes("vermelho") || lower.includes("red")) targetKey = "mort";
        else if (lower.includes("tard") || lower.includes("amarelo") || lower.includes("yellow")) targetKey = "tard";
        else if (lower.includes("doux") || lower.includes("azul") || lower.includes("blue")) targetKey = "doux";

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            spritesheets[targetKey] = img;
            loadedExternal[targetKey] = true;
            drawPreviews();
            updateAssetStatusBadge();
        };
        img.src = url;
    });
});

document.querySelectorAll(".dino-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".dino-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeDinoKey = btn.dataset.dino;
    });
});

// =========================================================================
// 2. ESPAÇO DE ESTADOS & TABELA Q
// =========================================================================
const DIST_LABELS = ["MUITO PERTO", "PERTO", "MÉDIA", "LONGE", "LIVRE"];
const OBS_LABELS = ["BAIXO", "ALTO"];
const VEL_LABELS = ["NORMAL", "RÁPIDA"];
const ACTIONS = ["CORRER", "SALTAR"];

const STATES = [];
const stateIndexMap = {};

for (let v = 0; v < 2; v++) {
    for (let o = 0; o < 2; o++) {
        for (let d = 0; d < 5; d++) {
            const id = `${d}-${o}-${v}`;
            stateIndexMap[id] = STATES.length;
            STATES.push({ idx: STATES.length, id, d, o, v });
        }
    }
}

let qTable = [];
let visitCounts = [];

function resetQTable() {
    qTable = STATES.map(() => [0, 0]);
    visitCounts = STATES.map(() => 0);
    lastUpdatedCell = null;
    document.getElementById("liveEquation").textContent =
        "Memória zerada! Todos os valores Q(s, a) voltaram para 0.00.";
    renderQTable(true);
    renderPolicyGrid();
}

function getDistanceBucket(dist) {
    if (dist >= 255) return 4;
    if (dist >= 168) return 3;
    if (dist >= 100) return 2;
    if (dist >= 36) return 1;
    return 0;
}

function getStateFromWorld() {
    let nextObs = null;
    for (const obs of world.obstacles) {
        if (obs.x + obs.w > dino.x) {
            nextObs = obs;
            break;
        }
    }

    const distPx = nextObs ? Math.round(nextObs.x - (dino.x + dino.hitboxW)) : 999;
    const d = getDistanceBucket(distPx);
    const o = nextObs ? nextObs.type : 0;
    const v = world.speed >= 7.0 ? 1 : 0;
    const sIdx = stateIndexMap[`${d}-${o}-${v}`];
    return { sIdx, d, o, v, distPx, nextObs };
}

// =========================================================================
// 3. FÍSICA DO JOGO & SIMULADOR Q-LEARNING
// =========================================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GROUND_Y = 206;
const GRAVITY = 0.68;
const JUMP_VEL = -12.0;

const dino = {
    x: 78,
    y: GROUND_Y - 48,
    renderSize: 48,
    hitboxOffsetX: 10,
    hitboxW: 30,
    hitboxH: 38,
    vy: 0,
    grounded: true,
    animTick: 0,
    hurtTimer: 0
};

const world = {
    speed: 5.4,
    obstacles: [],
    spawnTimer: 45,
    groundScroll: 0,
    clouds: [
        { x: 140, y: 42, s: 1 },
        { x: 420, y: 28, s: 0.8 },
        { x: 670, y: 54, s: 1.1 }
    ],
    popups: [],
    score: 0,
    obstaclesCleared: 0
};

let isRunning = true;
let simSpeed = 1;
let manualMode = false;
let showSensors = true;

let episode = 1;
let bestObstacles = 0;
let episodeHistory = [];

let alpha = 0.25;
let gamma = 0.90;
let epsilon = 0.40;
let autoDecay = true;
let envSpeedMode = "progressive";

let pendingTransition = null;
let lastGroundedStateIdx = null;
let currentStateInfo = { sIdx: 4, d: 4, o: 0, v: 0, distPx: 999, nextObs: null };
let lastDecisionReason = "—";
let lastUpdatedCell = null;

function resetEpisode(isTrainingBatch = false) {
    dino.y = GROUND_Y - dino.renderSize;
    dino.vy = 0;
    dino.grounded = true;
    dino.hurtTimer = 0;

    world.obstacles = [];
    world.spawnTimer = 18;
    world.score = 0;
    world.obstaclesCleared = 0;

    if (envSpeedMode === "normal") {
        world.speed = 5.4;
    } else if (envSpeedMode === "mixed") {
        world.speed = episode % 2 === 1 ? 5.4 : 7.6;
    } else {
        world.speed = 5.4;
    }

    pendingTransition = null;
    lastGroundedStateIdx = null;
    if (!isTrainingBatch) world.popups = [];
}

function addPopup(text, color, yOffset = 0) {
    if (simSpeed > 5) return;
    world.popups.push({
        text,
        color,
        x: dino.x + 24,
        y: dino.y - 6 + yOffset,
        life: 38
    });
}

function spawnObstacle() {
    const type = Math.random() < 0.52 ? 0 : 1;
    const w = type === 0 ? 24 : 34;
    const h = type === 0 ? 30 : 48;
    world.obstacles.push({
        x: canvas.width + 20,
        y: GROUND_Y - h,
        w,
        h,
        type,
        passed: false
    });
    const minGap = world.speed >= 7.0 ? 52 : 58;
    const maxGap = world.speed >= 7.0 ? 84 : 92;
    world.spawnTimer = Math.floor(minGap + Math.random() * (maxGap - minGap));
}

function chooseAction(sIdx) {
    if (Math.random() < epsilon) {
        lastDecisionReason = "🎲 Exploração (Aleatória)";
        return Math.random() < 0.5 ? 0 : 1;
    }
    const q0 = qTable[sIdx][0];
    const q1 = qTable[sIdx][1];
    lastDecisionReason = "🧠 Política (Melhor Q)";
    if (q0 === q1) return Math.random() < 0.5 ? 0 : 1;
    return q1 > q0 ? 1 : 0;
}

function performQUpdate(sIdx, action, reward, nextSIdx, isTerminal, silent = false) {
    const oldQ = qTable[sIdx][action];
    const maxNextQ = isTerminal ? 0 : Math.max(qTable[nextSIdx][0], qTable[nextSIdx][1]);
    const target = reward + gamma * maxNextQ;
    const newQ = oldQ + alpha * (target - oldQ);
    const delta = newQ - oldQ;

    qTable[sIdx][action] = newQ;
    lastUpdatedCell = { sIdx, action, delta };

    if (!silent) {
        const sObj = STATES[sIdx];
        const sLabel = `[${DIST_LABELS[sObj.d]} | ${OBS_LABELS[sObj.o]} | ${VEL_LABELS[sObj.v]}]`;
        const nextLabel = isTerminal
            ? "TERMINAL (Colisão)"
            : `[${DIST_LABELS[STATES[nextSIdx].d]} | ${OBS_LABELS[STATES[nextSIdx].o]} | ${VEL_LABELS[STATES[nextSIdx].v]}]`;

        const sign = delta >= 0 ? "+" : "";
        document.getElementById("liveEquation").innerHTML =
            `<strong>s:</strong> ${sLabel} · <strong>a:</strong> ${ACTIONS[action]} → <strong>s':</strong> ${nextLabel}<br>` +
            `Q = ${oldQ.toFixed(2)} + ${alpha.toFixed(2)} · [ (${reward >= 0 ? "+" : ""}${reward}) + ${gamma.toFixed(2)}·(${maxNextQ.toFixed(2)}) − (${oldQ.toFixed(2)}) ] = ` +
            `<strong style="color:${delta >= 0 ? "#4ade80" : "#f87171"}">${newQ.toFixed(2)}</strong> (${sign}${delta.toFixed(2)})`;
    }
}

function checkCollision() {
    const dx = dino.x + dino.hitboxOffsetX;
    const dy = dino.y + (dino.renderSize - dino.hitboxH);
    const dw = dino.hitboxW;
    const dh = dino.hitboxH;

    for (const obs of world.obstacles) {
        if (
            dx < obs.x + obs.w &&
            dx + dw > obs.x &&
            dy < obs.y + obs.h &&
            dy + dh > obs.y
        ) {
            return true;
        }
    }
    return false;
}

function stepSimulation(silent = false) {
    if (dino.hurtTimer > 0) {
        dino.hurtTimer--;
        if (dino.hurtTimer === 0) resetEpisode(silent);
        return;
    }

    world.groundScroll = (world.groundScroll + world.speed) % 32;
    for (const cl of world.clouds) {
        cl.x -= world.speed * 0.18 * cl.s;
        if (cl.x < -60) cl.x = canvas.width + 40;
    }

    world.spawnTimer--;
    if (world.spawnTimer <= 0) spawnObstacle();

    for (let i = world.obstacles.length - 1; i >= 0; i--) {
        const obs = world.obstacles[i];
        obs.x -= world.speed;

        if (!obs.passed && obs.x + obs.w < dino.x + dino.hitboxOffsetX) {
            obs.passed = true;
            world.obstaclesCleared++;
            world.score += 10;

            if (pendingTransition) pendingTransition.rewardAccum += 15;
            if (!silent) addPopup("+15 Obstáculo!", "#4ade80", -10);

            if (envSpeedMode === "progressive") {
                world.speed = Math.min(8.4, 5.4 + world.obstaclesCleared * 0.35);
            }
        }

        if (obs.x + obs.w < -40) world.obstacles.splice(i, 1);
    }

    let justLanded = false;
    if (!dino.grounded) {
        dino.y += dino.vy;
        dino.vy += GRAVITY;
        if (dino.y >= GROUND_Y - dino.renderSize) {
            dino.y = GROUND_Y - dino.renderSize;
            dino.vy = 0;
            dino.grounded = true;
            justLanded = true;
        }
    }

    dino.animTick++;

    if (!silent) {
        for (let i = world.popups.length - 1; i >= 0; i--) {
            world.popups[i].y -= 0.7;
            world.popups[i].life--;
            if (world.popups[i].life <= 0) world.popups.splice(i, 1);
        }
    }

    if (checkCollision()) {
        if (!manualMode && pendingTransition) {
            const totalReward = pendingTransition.rewardAccum - 100;
            performQUpdate(pendingTransition.sIdx, pendingTransition.action, totalReward, 0, true, silent);
            pendingTransition = null;
        }

        episodeHistory.push(world.obstaclesCleared);
        if (world.obstaclesCleared > bestObstacles) bestObstacles = world.obstaclesCleared;
        episode++;

        if (!manualMode && autoDecay) {
            epsilon = Math.max(0.02, epsilon * 0.96);
            if (!silent) syncHyperparameterUI();
        }

        if (!silent && simSpeed <= 2) {
            addPopup("-100 Colisão!", "#f87171", 0);
            dino.hurtTimer = 18;
        } else {
            resetEpisode(silent);
        }
        return;
    }

    const sInfo = getStateFromWorld();
    currentStateInfo = sInfo;

    if (manualMode) return;

    if (dino.grounded) {
        const stateChanged = sInfo.sIdx !== lastGroundedStateIdx;
        if (justLanded || pendingTransition === null || stateChanged) {
            if (pendingTransition !== null) {
                const actionCost = pendingTransition.action === 1 ? -2 : 0;
                const stepReward = 1 + actionCost + pendingTransition.rewardAccum;
                performQUpdate(pendingTransition.sIdx, pendingTransition.action, stepReward, sInfo.sIdx, false, silent);
                if (!silent && pendingTransition.rewardAccum === 0) {
                    addPopup(
                        pendingTransition.action === 1 ? "-1 Salto" : "+1",
                        pendingTransition.action === 1 ? "#fbbf24" : "#38bdf8"
                    );
                }
            }

            visitCounts[sInfo.sIdx]++;
            const action = chooseAction(sInfo.sIdx);
            pendingTransition = { sIdx: sInfo.sIdx, action, rewardAccum: 0 };
            lastGroundedStateIdx = sInfo.sIdx;

            if (action === 1) {
                dino.vy = JUMP_VEL;
                dino.grounded = false;
            }
        }
    }
}

// =========================================================================
// 4. RENDERIZAÇÃO DO JOGO E SENSORES
// =========================================================================
function drawObstacle(obs) {
    const x = Math.round(obs.x);
    const y = Math.round(obs.y);
    const w = obs.w;
    const h = obs.h;

    if (obs.type === 0) {
        ctx.fillStyle = "#14532d";
        ctx.fillRect(x, y + 4, w, h - 4);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(x + 4, y, w - 8, 6);
        ctx.fillStyle = "#bbf7d0";
        ctx.fillRect(x + 5, y + 8, 3, 3);
        ctx.fillRect(x + w - 8, y + 14, 3, 3);
    } else {
        ctx.fillStyle = "#7c2d12";
        ctx.fillRect(x + 8, y, w - 16, h);
        ctx.fillRect(x, y + 12, 10, 18);
        ctx.fillRect(x + w - 10, y + 8, 10, 18);

        ctx.fillStyle = "#ea580c";
        ctx.fillRect(x + 10, y + 2, w - 20, h - 2);
        ctx.fillRect(x + 2, y + 14, 8, 12);
        ctx.fillRect(x + w - 10, y + 10, 8, 12);

        ctx.fillStyle = "#fdba74";
        ctx.fillRect(x + 12, y + 6, 3, h - 12);
    }
}

function drawGame() {
    ctx.imageSmoothingEnabled = false;

    const isFast = world.speed >= 7.0;
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, isFast ? "#1e1b4b" : "#0f172a");
    grad.addColorStop(1, isFast ? "#312e81" : "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    for (const cl of world.clouds) {
        const w = 44 * cl.s;
        const h = 14 * cl.s;
        ctx.fillRect(Math.round(cl.x), Math.round(cl.y), w, h);
        ctx.fillRect(Math.round(cl.x + 8), Math.round(cl.y - 6), w - 16, 8);
    }

    if (showSensors) {
        const frontX = dino.x + dino.hitboxOffsetX + dino.hitboxW;
        const zones = [
            { min: 0, max: 36, label: "MUITO PERTO", color: "rgba(239, 68, 68, 0.16)" },
            { min: 36, max: 100, label: "PERTO", color: "rgba(245, 158, 11, 0.14)" },
            { min: 100, max: 168, label: "MÉDIA", color: "rgba(56, 189, 248, 0.12)" },
            { min: 168, max: 255, label: "LONGE", color: "rgba(148, 163, 184, 0.08)" }
        ];
        for (const z of zones) {
            ctx.fillStyle = z.color;
            ctx.fillRect(frontX + z.min, GROUND_Y - 12, z.max - z.min, 12);
            ctx.fillStyle = "rgba(255,255,255,0.42)";
            ctx.font = "bold 9px monospace";
            ctx.fillText(z.label, frontX + z.min + 3, GROUND_Y - 3);
        }
    }

    ctx.fillStyle = "#334155";
    ctx.fillRect(0, GROUND_Y, canvas.width, 3);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, GROUND_Y + 3, canvas.width, canvas.height - GROUND_Y - 3);

    ctx.fillStyle = "#475569";
    for (let gx = -Math.floor(world.groundScroll); gx < canvas.width; gx += 32) {
        ctx.fillRect(gx, GROUND_Y + 10, 12, 3);
        ctx.fillRect(gx + 18, GROUND_Y + 20, 6, 2);
    }

    for (const obs of world.obstacles) drawObstacle(obs);

    if (showSensors && currentStateInfo.nextObs) {
        const obs = currentStateInfo.nextObs;
        const x1 = dino.x + dino.hitboxOffsetX + dino.hitboxW;
        const x2 = obs.x;
        const lineY = GROUND_Y - 26;

        ctx.strokeStyle = currentStateInfo.d <= 1 ? "#f59e0b" : "#38bdf8";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x1, lineY);
        ctx.lineTo(Math.max(x1, x2), lineY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px monospace";
        const midX = (x1 + Math.max(x1, x2)) / 2 - 18;
        ctx.fillText(`${currentStateInfo.distPx}px`, Math.max(x1 + 4, midX), lineY - 5);
    }

    let frameIdx = 4;
    if (dino.hurtTimer > 0) {
        frameIdx = 14;
    } else if (!dino.grounded) {
        frameIdx = dino.vy < 0 ? 12 : 11;
    } else {
        const runCycle = [4, 5, 6, 7, 8, 9];
        frameIdx = runCycle[Math.floor(dino.animTick / 4) % runCycle.length];
    }

    const sheet = spritesheets[activeDinoKey];
    const { isStrip, fw, fh } = getSheetMetrics(sheet);
    const srcX = isStrip ? frameIdx * fw : 0;

    ctx.drawImage(
        sheet,
        srcX, 0, fw, fh,
        Math.round(dino.x), Math.round(dino.y), dino.renderSize, dino.renderSize
    );

    if (showSensors) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(
            dino.x + dino.hitboxOffsetX,
            dino.y + (dino.renderSize - dino.hitboxH),
            dino.hitboxW,
            dino.hitboxH
        );
    }

    if (showSensors && !manualMode && pendingTransition) {
        const actText = pendingTransition.action === 1 ? "🦘 SALTAR" : "🏃 CORRER";
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(dino.x - 4, dino.y - 24, 78, 18);
        ctx.strokeStyle = pendingTransition.action === 1 ? "#22c55e" : "#38bdf8";
        ctx.strokeRect(dino.x - 4, dino.y - 24, 78, 18);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(actText, dino.x + 2, dino.y - 11);
    }

    for (const p of world.popups) {
        ctx.globalAlpha = Math.min(1, p.life / 18);
        ctx.fillStyle = p.color;
        ctx.font = "bold 12px monospace";
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
    }

    ctx.fillStyle = isFast ? "#fbbf24" : "#94a3b8";
    ctx.font = "bold 12px monospace";
    ctx.fillText(
        `VEL: ${world.speed.toFixed(1)} (${isFast ? "RÁPIDA" : "NORMAL"})`,
        canvas.width - 175,
        22
    );
}

// =========================================================================
// 5. ATUALIZAÇÃO DA INTERFACE DIDÁTICA (TABELA Q, MAPA E GRÁFICO)
// =========================================================================
function buildQTableDOM() {
    const tbody = document.getElementById("qTableBody");
    tbody.innerHTML = "";
    for (const st of STATES) {
        const tr = document.createElement("tr");
        tr.id = `qrow-${st.idx}`;
        tr.innerHTML = `
      <td style="color:var(--muted);">S${st.idx + 1}</td>
      <td><strong>${DIST_LABELS[st.d]}</strong></td>
      <td>${OBS_LABELS[st.o]}</td>
      <td>${VEL_LABELS[st.v]}</td>
      <td id="qcell-${st.idx}-0" class="q-cell">0.00</td>
      <td id="qcell-${st.idx}-1" class="q-cell">0.00</td>
      <td id="qpol-${st.idx}"></td>
      <td id="qvis-${st.idx}" style="text-align:right; color:var(--muted);">0</td>
    `;
        tbody.appendChild(tr);
    }
}

function buildPolicyGridDOM() {
    const table = document.getElementById("policyGrid");
    let html = `
    <thead>
      <tr>
        <th>Obstáculo / Vel.</th>
        ${DIST_LABELS.map((l) => `<th>${l.replace("MUITO ", "M. ")}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
  `;
    for (let v = 0; v < 2; v++) {
        for (let o = 0; o < 2; o++) {
            html += `<tr><th>${OBS_LABELS[o]} · ${VEL_LABELS[v]}</th>`;
            for (let d = 0; d < 5; d++) {
                const sIdx = stateIndexMap[`${d}-${o}-${v}`];
                html += `<td id="pcell-${sIdx}" class="policy-cell">—</td>`;
            }
            html += `</tr>`;
        }
    }
    html += `</tbody>`;
    table.innerHTML = html;
}

function heatColor(val) {
    if (Math.abs(val) < 0.01) return "transparent";
    if (val > 0) {
        const intensity = Math.min(0.45, (val / 35) * 0.45);
        return `rgba(34, 197, 94, ${intensity.toFixed(3)})`;
    }
    const intensity = Math.min(0.48, (Math.abs(val) / 60) * 0.48);
    return `rgba(239, 68, 68, ${intensity.toFixed(3)})`;
}

function renderQTable(forceFlash = false) {
    const curIdx = currentStateInfo.sIdx;

    for (const st of STATES) {
        const i = st.idx;
        const row = document.getElementById(`qrow-${i}`);
        if (i === curIdx) row.classList.add("current-state");
        else row.classList.remove("current-state");

        const q0 = qTable[i][0];
        const q1 = qTable[i][1];

        const c0 = document.getElementById(`qcell-${i}-0`);
        const c1 = document.getElementById(`qcell-${i}-1`);
        c0.textContent = q0.toFixed(2);
        c1.textContent = q1.toFixed(2);
        c0.style.backgroundColor = heatColor(q0);
        c1.style.backgroundColor = heatColor(q1);

        if (lastUpdatedCell && lastUpdatedCell.sIdx === i) {
            const targetCell = lastUpdatedCell.action === 0 ? c0 : c1;
            targetCell.classList.remove("flash-up", "flash-down");
            void targetCell.offsetWidth;
            targetCell.classList.add(lastUpdatedCell.delta >= 0 ? "flash-up" : "flash-down");
        }

        const polCell = document.getElementById(`qpol-${i}`);
        if (Math.abs(q0 - q1) < 0.001) {
            polCell.innerHTML = `<span class="action-badge action-tie">⚖️ Indeciso</span>`;
        } else if (q1 > q0) {
            polCell.innerHTML = `<span class="action-badge action-jump">🦘 Saltar</span>`;
        } else {
            polCell.innerHTML = `<span class="action-badge action-run">🏃 Correr</span>`;
        }

        document.getElementById(`qvis-${i}`).textContent = visitCounts[i];
    }
    if (!forceFlash) lastUpdatedCell = null;
}

function renderPolicyGrid() {
    const curIdx = currentStateInfo.sIdx;
    for (const st of STATES) {
        const i = st.idx;
        const cell = document.getElementById(`pcell-${i}`);
        const q0 = qTable[i][0];
        const q1 = qTable[i][1];

        if (i === curIdx) cell.classList.add("active-cell");
        else cell.classList.remove("active-cell");

        if (Math.abs(q0 - q1) < 0.001) {
            cell.textContent = "—";
            cell.style.background = "transparent";
            cell.style.color = "var(--muted)";
        } else if (q1 > q0) {
            cell.textContent = "🦘";
            cell.style.background = "rgba(34, 197, 94, 0.25)";
            cell.style.color = "#86efac";
        } else {
            cell.textContent = "🏃";
            cell.style.background = "rgba(56, 189, 248, 0.2)";
            cell.style.color = "#7dd3fc";
        }
    }
}

function renderLiveBrainUI() {
    const s = currentStateInfo;
    document.getElementById("curStateLabel").textContent =
        `[${DIST_LABELS[s.d]} | ${OBS_LABELS[s.o]} | ${VEL_LABELS[s.v]}]`;
    document.getElementById("curDistPx").textContent = s.distPx >= 900 ? "Livre" : `${s.distPx} px`;
    document.getElementById("curSpeedPx").textContent = `${world.speed.toFixed(1)} px/tick`;
    document.getElementById("decisionTypeBadge").textContent = manualMode ? "Controle Manual" : lastDecisionReason;

    document.querySelectorAll("#tagsDist .dim-tag").forEach((el) =>
        el.classList.toggle("active", Number(el.dataset.dist) === s.d)
    );
    document.querySelectorAll("#tagsObs .dim-tag").forEach((el) =>
        el.classList.toggle("active", Number(el.dataset.obs) === s.o)
    );
    document.querySelectorAll("#tagsVel .dim-tag").forEach((el) =>
        el.classList.toggle("active", Number(el.dataset.vel) === s.v)
    );

    const q0 = qTable[s.sIdx][0];
    const q1 = qTable[s.sIdx][1];
    document.getElementById("curQRun").textContent = q0.toFixed(2);
    document.getElementById("curQJump").textContent = q1.toFixed(2);

    const maxAbs = Math.max(20, Math.abs(q0), Math.abs(q1));
    const pct0 = Math.max(5, Math.min(100, ((q0 + maxAbs) / (2 * maxAbs)) * 100));
    const pct1 = Math.max(5, Math.min(100, ((q1 + maxAbs) / (2 * maxAbs)) * 100));

    const barRun = document.getElementById("barRun");
    const barJump = document.getElementById("barJump");
    barRun.style.width = `${pct0}%`;
    barJump.style.width = `${pct1}%`;
    barRun.style.background = q0 >= 0 ? "#38bdf8" : "#ef4444";
    barJump.style.background = q1 >= 0 ? "#22c55e" : "#ef4444";

    const chosen = pendingTransition ? pendingTransition.action : -1;
    document.getElementById("meterRun").classList.toggle("chosen", chosen === 0);
    document.getElementById("meterJump").classList.toggle("chosen", chosen === 1);

    document.getElementById("statEpisode").textContent = episode;
    document.getElementById("statScore").textContent = `${world.score} (${world.obstaclesCleared})`;
    document.getElementById("statBest").textContent = bestObstacles;

    const last10 = episodeHistory.slice(-10);
    const avg = last10.length ? last10.reduce((a, b) => a + b, 0) / last10.length : 0;
    document.getElementById("statAvg").textContent = avg.toFixed(1);
}

function drawChart() {
    const c = document.getElementById("chartCanvas");
    const g = c.getContext("2d");
    const W = c.width;
    const H = c.height;

    g.clearRect(0, 0, W, H);
    g.fillStyle = "#0f172a";
    g.fillRect(0, 0, W, H);

    const data = episodeHistory.slice(-80);
    if (data.length < 2) {
        g.fillStyle = "#64748b";
        g.font = "12px sans-serif";
        g.fillText("Complete 2+ episódios para visualizar a curva de aprendizado...", 20, H / 2);
        return;
    }

    const maxVal = Math.max(5, ...data);
    const padL = 32, padR = 10, padT = 14, padB = 20;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    g.strokeStyle = "rgba(51, 65, 85, 0.6)";
    g.lineWidth = 1;
    g.fillStyle = "#64748b";
    g.font = "10px monospace";
    for (let i = 0; i <= 2; i++) {
        const y = padT + (plotH * i) / 2;
        const val = Math.round(maxVal * (1 - i / 2));
        g.beginPath();
        g.moveTo(padL, y);
        g.lineTo(W - padR, y);
        g.stroke();
        g.fillText(val, 4, y + 3);
    }

    g.strokeStyle = "rgba(56, 189, 248, 0.4)";
    g.lineWidth = 1.5;
    g.beginPath();
    data.forEach((v, idx) => {
        const x = padL + (idx / (data.length - 1)) * plotW;
        const y = padT + plotH - (v / maxVal) * plotH;
        if (idx === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
    });
    g.stroke();

    g.strokeStyle = "#22c55e";
    g.lineWidth = 2.5;
    g.beginPath();
    data.forEach((_, idx) => {
        const start = Math.max(0, idx - 9);
        const slice = data.slice(start, idx + 1);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        const x = padL + (idx / (data.length - 1)) * plotW;
        const y = padT + plotH - (avg / maxVal) * plotH;
        if (idx === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
    });
    g.stroke();
}

// =========================================================================
// 6. CONTROLES E LOOP PRINCIPAL
// =========================================================================
function syncHyperparameterUI() {
    document.getElementById("sliderAlpha").value = alpha;
    document.getElementById("valAlpha").textContent = alpha.toFixed(2);
    document.getElementById("sliderGamma").value = gamma;
    document.getElementById("valGamma").textContent = gamma.toFixed(2);
    document.getElementById("sliderEpsilon").value = epsilon;
    document.getElementById("valEpsilon").textContent = epsilon.toFixed(2);
}

document.getElementById("sliderAlpha").addEventListener("input", (e) => {
    alpha = parseFloat(e.target.value);
    document.getElementById("valAlpha").textContent = alpha.toFixed(2);
});

document.getElementById("sliderGamma").addEventListener("input", (e) => {
    gamma = parseFloat(e.target.value);
    document.getElementById("valGamma").textContent = gamma.toFixed(2);
});

document.getElementById("sliderEpsilon").addEventListener("input", (e) => {
    epsilon = parseFloat(e.target.value);
    document.getElementById("valEpsilon").textContent = epsilon.toFixed(2);
});

document.getElementById("autoDecayCheck").addEventListener("change", (e) => {
    autoDecay = e.target.checked;
});

document.getElementById("envSpeedMode").addEventListener("change", (e) => {
    envSpeedMode = e.target.value;
    resetEpisode();
});

document.getElementById("playPauseBtn").addEventListener("click", () => {
    isRunning = !isRunning;
    document.getElementById("playPauseBtn").textContent = isRunning ? "⏸️ Pausar" : "▶️ Continuar";
});

document.getElementById("stepBtn").addEventListener("click", () => {
    isRunning = false;
    document.getElementById("playPauseBtn").textContent = "▶️ Continuar";
    stepSimulation(false);
    drawGame();
    renderLiveBrainUI();
    renderQTable();
    renderPolicyGrid();
    drawChart();
});

document.querySelectorAll(".speed-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".speed-btn").forEach((b) => b.classList.remove("active-speed"));
        btn.classList.add("active-speed");
        simSpeed = Number(btn.dataset.speed);
    });
});

document.getElementById("resetQBtn").addEventListener("click", () => {
    resetQTable();
    episode = 1;
    bestObstacles = 0;
    episodeHistory = [];
    epsilon = 0.40;
    syncHyperparameterUI();
    resetEpisode();
    drawChart();
});

document.getElementById("fastTrainBtn").addEventListener("click", () => {
    if (manualMode) return;
    const targetEp = episode + 50;
    let guard = 0;
    while (episode < targetEp && guard < 150000) {
        stepSimulation(true);
        guard++;
    }
    resetEpisode();
    syncHyperparameterUI();
    drawGame();
    renderLiveBrainUI();
    renderQTable(true);
    renderPolicyGrid();
    drawChart();
});

document.getElementById("toggleSensorsBtn").addEventListener("click", (e) => {
    showSensors = !showSensors;
    e.target.textContent = showSensors ? "👁️ Sensores: ON" : "👁️ Sensores: OFF";
    e.target.classList.toggle("active-speed", showSensors);
});

document.getElementById("toggleModeBtn").addEventListener("click", (e) => {
    manualMode = !manualMode;
    e.target.textContent = manualMode ? "🤖 Voltar para IA (Q-Learning)" : "🕹️ Jogar Manualmente";
    document.getElementById("modeBadge").textContent = manualMode
        ? "Modo: Manual (Espaço / Seta ↑ para saltar)"
        : "Modo: Agente Q-Learning";
    resetEpisode();
});

document.getElementById("exportQBtn").addEventListener("click", () => {
    const payload = {
        dino: activeDinoKey,
        episode,
        bestObstacles,
        hyperparameters: { alpha, gamma, epsilon },
        states: STATES.map((s) => ({
            id: s.id,
            distancia: DIST_LABELS[s.d],
            obstaculo: OBS_LABELS[s.o],
            velocidade: VEL_LABELS[s.v],
            Q_correr: Number(qTable[s.idx][0].toFixed(4)),
            Q_saltar: Number(qTable[s.idx][1].toFixed(4)),
            visitas: visitCounts[s.idx]
        }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dino-qtable-ep${episode}.json`;
    a.click();
});

function triggerManualJump() {
    if (manualMode && dino.grounded && dino.hurtTimer === 0) {
        dino.vy = JUMP_VEL;
        dino.grounded = false;
    }
}

window.addEventListener("keydown", (e) => {
    if (manualMode && (e.code === "Space" || e.code === "ArrowUp")) {
        e.preventDefault();
        triggerManualJump();
    }
});

canvas.addEventListener("pointerdown", triggerManualJump);

let uiFrameCounter = 0;
let lastEpDrawn = 0;

function mainLoop() {
    if (isRunning) {
        const steps = manualMode ? 1 : simSpeed;
        for (let i = 0; i < steps; i++) {
            stepSimulation(i < steps - 1);
        }
        drawGame();

        uiFrameCounter++;
        const refreshEvery = simSpeed >= 5 ? 3 : 1;
        if (uiFrameCounter % refreshEvery === 0) {
            renderLiveBrainUI();
            renderQTable();
            renderPolicyGrid();
        }
        if (episode !== lastEpDrawn) {
            lastEpDrawn = episode;
            drawChart();
        }
    }
    requestAnimationFrame(mainLoop);
}

// Inicialização
drawPreviews();
updateAssetStatusBadge();
probeLocalAssets();
buildQTableDOM();
buildPolicyGridDOM();
resetQTable();
resetEpisode();
syncHyperparameterUI();
drawGame();
renderLiveBrainUI();
drawChart();
requestAnimationFrame(mainLoop);