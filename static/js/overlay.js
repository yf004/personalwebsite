
const svg = document.getElementById("scene");
const overlay = document.getElementById("overlay");
const outline = document.getElementById("outline");

const nav_outline = document.getElementById("nav-outline");
const radiusFactor = 0.02;


const points = [
    [0.02,0.02],

    [0.5, 0.02],
    [0.55, 0.09],
    [0.85, 0.09],
    [0.9, 0.02],

    [0.98,0.02],
    [0.98,0.98],
    [0.02,0.98]
];

const nav = [
    [0.52,0.025],
    [0.88, 0.025],

    [0.84, 0.075],
    [0.56, 0.075],

];

function scalePoints(points, w, h) {
    return points.map(([x,y]) => [x*w, y*h]);
}

function normalize([x,y]) {
    const len = Math.hypot(x,y);
    return len ? [x/len,y/len] : [0,0];
}

function roundedPolygon(points, r) {
    const path = [];
    const n = points.length;

    for (let i=0;i<n;i++) {
        const prev = points[(i+n-1)%n];
        const curr = points[i];
        const next = points[(i+1)%n];

        const v1 = normalize([prev[0]-curr[0], prev[1]-curr[1]]);
        const v2 = normalize([next[0]-curr[0], next[1]-curr[1]]);

        const d1 = Math.hypot(prev[0]-curr[0], prev[1]-curr[1]);
        const d2 = Math.hypot(next[0]-curr[0], next[1]-curr[1]);

        const rr = Math.min(r, d1/2, d2/2);

        const start = [
            curr[0] + v1[0]*rr,
            curr[1] + v1[1]*rr
        ];

        const end = [
            curr[0] + v2[0]*rr,
            curr[1] + v2[1]*rr
        ];

        if(i===0)
            path.push(`M ${start[0]} ${start[1]}`);
        else
            path.push(`L ${start[0]} ${start[1]}`);

        path.push(`Q ${curr[0]} ${curr[1]} ${end[0]} ${end[1]}`);
    }

    path.push("Z");
    return path.join(" ");
}

function render() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const r = Math.min(Math.min(w, h) * radiusFactor, 14);

    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    const scaled = scalePoints(points, w, h);
    const d = roundedPolygon(scaled, r);

    outline.setAttribute("d", d);

    const outer = `
        M 0 0
        L ${w} 0
        L ${w} ${h}
        L 0 ${h}
        Z
    `;

    overlay.setAttribute("d", outer + " " + d);

    const nav_scaled = scalePoints(nav, w, h);
    const nav_d = roundedPolygon(nav_scaled, r*1.2);
    nav_outline.setAttribute("d", nav_d);   
}

window.addEventListener("resize", render);
render();