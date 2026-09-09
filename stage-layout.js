// Coordinates are measured on the actual sprites, not inferred from dialogue.
export const ACTOR_STAGING = {
  "lin-lan": { posture: "seated", facing: "right", eye: .15 },
  "gu-mingyuan": { posture: "seated", facing: "right", eye: .16 },
  "sumaya": { posture: "seated", facing: "right", eye: .14 },
  "family-caregiver": { posture: "standing", facing: "left", eye: .105 },
  "returning-relative": { posture: "standing", facing: "left", eye: .115 }
};

export function actorStaging(scenario) {
  return ACTOR_STAGING[scenario.actor.split("/").at(-1).replace(/\.png$/, "")];
}

export function stagedDoctorAsset(scenario, pose) {
  const posture = actorStaging(scenario).posture;
  if (posture === "standing") return `assets/doctors/standing-${pose}.webp`;
  if (pose === "urgent") return "assets/doctors/seated-urgent.webp";
  return `assets/doctors/doctor-${pose}.webp`;
}

export function stageCharacter(image, side, facing, posture, eye) {
  image.dataset.side = side;
  image.dataset.posture = posture;
  image.dataset.facing = side === "left" ? "right" : "left";
  image.style.setProperty("--facing", image.dataset.facing === facing ? "1" : "-1");
  image.style.setProperty("--eye", eye);
}

export function observeStage(stage) {
  const resize = () => {
    if (!stage.clientWidth || !stage.clientHeight) return;
    stage.style.setProperty("--figure-height", `${Math.min(stage.clientHeight * 1.04, stage.clientWidth * .66)}px`);
  };
  new ResizeObserver(resize).observe(stage);
  resize();
}
