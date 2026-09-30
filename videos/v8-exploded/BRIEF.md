---
workflow: general-video
flow: automation
storyboard: yes
message: "A V8 is a precision machine — every part earns its place"
destination: reels-shorts
aspect: 1080x1920
language: ko
audience: car enthusiasts on vertical social feeds
length: 15s
narration: no
---

## Intent

3D 그래픽 느낌으로 V8 엔진이 분해됐다가 다시 합쳐지는 모션. 시네마틱하고 리얼하며,
자동차의 멋짐을 만들어내는 느낌. 세로 화면비. 무음.

## Customizations

- Model built procedurally in Three.js (user agreed: "모델방식은 동의해") — every part a separate mesh so it can explode and reassemble.
- Short end title (user chose "짧은 타이틀").

## Notes

- Explode along the vertical axis so the tall 9:16 frame is filled (integration check: a V8 is wider than tall).
- Silent render — sound can be added after the picture is locked.
- cdn.jsdelivr.net is blocked in this environment: vendor three.js and GSAP locally, no CDN imports.
- Rendering is software WebGL (SwiftShader): ~1.5s/frame at 1080p for a mid-weight scene; keep geometry and post passes within that budget.
