// Apparitions progressives au scroll, avec affichage de secours si le déclenchement ne part pas.
document.documentElement.classList.add("js-enabled");

const revealElements = Array.from(document.querySelectorAll(".reveal"));

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.14 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
  window.setTimeout(() => {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }, 1600);
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

// Étapes scrollytelling déclenchées élément par élément sur tout le parcours.
const storySteps = Array.from(
  document.querySelectorAll(
    "#ouverture .story-step, .orientation .story-step, [data-section] .story-step, .narrative-transition .story-step, .conclusion .story-step"
  )
);
const reducedStoryMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (storySteps.length) {
  const resetStoryStep = (element) => {
    element.classList.remove("is-story-visible");
  };

  const playStoryStep = (element) => {
    element.classList.remove("is-story-visible");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        element.classList.add("is-story-visible");
      });
    });
  };

  const showStoryStep = (element) => {
    element.classList.add("is-story-visible");
  };

  if ("IntersectionObserver" in window && !reducedStoryMotion.matches) {
    const storyStepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playStoryStep(entry.target);
          } else {
            resetStoryStep(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -14% 0px" }
    );

    storySteps.forEach((step) => storyStepObserver.observe(step));
  } else {
    storySteps.forEach(showStoryStep);
  }
}

// Base générique pour de futures scènes scrollytelling progressives.
const initScrollyScenes = () => {
  const scrollyScenes = Array.from(document.querySelectorAll("[data-scrolly-scene]"));
  if (!scrollyScenes.length) return;

  scrollyScenes.forEach((scene) => {
    const scrollySteps = Array.from(scene.querySelectorAll("[data-scrolly-step]"));
    if (!scrollySteps.length) return;

    const activateScrollyStep = (activeStep) => {
      const activeStepId = activeStep.dataset.scrollyStep || String(scrollySteps.indexOf(activeStep) + 1);
      scene.dataset.activeStep = activeStepId;

      scrollySteps.forEach((step) => {
        const isActive = step === activeStep;
        step.classList.toggle("is-scrolly-active", isActive);
        if (isActive) {
          step.setAttribute("aria-current", "step");
        } else {
          step.removeAttribute("aria-current");
        }
      });
    };

    activateScrollyStep(scrollySteps[0]);

    const updateActiveScrollyStep = () => {
      const viewportCenter = window.innerHeight * 0.5;
      const activeZoneTop = window.innerHeight * 0.18;
      const activeZoneBottom = window.innerHeight * 0.88;
      const closestStep = scrollySteps.reduce(
        (closest, step) => {
          const rect = step.getBoundingClientRect();
          const stepCenter = rect.top + rect.height * 0.5;
          const distance = Math.abs(stepCenter - viewportCenter);
          const isNearViewport = rect.bottom > activeZoneTop && rect.top < activeZoneBottom;

          if (!isNearViewport) return closest;
          if (!closest || distance < closest.distance) {
            return { distance, step };
          }

          return closest;
        },
        null
      );

      if (closestStep?.step) {
        activateScrollyStep(closestStep.step);
        return;
      }

      const allStepsAboveViewport = scrollySteps.every((step) => {
        const rect = step.getBoundingClientRect();
        return rect.bottom < activeZoneTop;
      });
      const allStepsBelowViewport = scrollySteps.every((step) => {
        const rect = step.getBoundingClientRect();
        return rect.top > activeZoneBottom;
      });

      if (allStepsAboveViewport) {
        activateScrollyStep(scrollySteps[scrollySteps.length - 1]);
      } else if (allStepsBelowViewport) {
        activateScrollyStep(scrollySteps[0]);
      }
    };

    let scrollyTicking = false;
    const requestScrollyUpdate = () => {
      if (scrollyTicking) return;
      scrollyTicking = true;
      window.requestAnimationFrame(() => {
        updateActiveScrollyStep();
        scrollyTicking = false;
      });
    };

    if ("IntersectionObserver" in window) {
      const scrollyObserver = new IntersectionObserver(
        (entries) => {
          const visibleEntries = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

          if (visibleEntries[0]) {
            activateScrollyStep(visibleEntries[0].target);
          }

          requestScrollyUpdate();
        },
        { threshold: [0.12, 0.28, 0.5, 0.74], rootMargin: "-18% 0px -18% 0px" }
      );

      scrollySteps.forEach((step) => scrollyObserver.observe(step));
    }

    const stepSentinels = scrollySteps.map((step) => {
      const sentinel = document.createElement("span");
      sentinel.className = "scrolly-scene__sentinel";
      sentinel.setAttribute("aria-hidden", "true");
      step.appendChild(sentinel);
      return sentinel;
    });

    if ("IntersectionObserver" in window) {
      const sentinelObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const step = entry.target.closest("[data-scrolly-step]");
            if (step) {
              activateScrollyStep(step);
            }
          });
        },
        { threshold: 0.01, rootMargin: "-48% 0px -48% 0px" }
      );

      stepSentinels.forEach((sentinel) => sentinelObserver.observe(sentinel));
    }

    window.addEventListener("scroll", requestScrollyUpdate, { passive: true });
    document.addEventListener("scroll", requestScrollyUpdate, { passive: true, capture: true });
    window.addEventListener("resize", requestScrollyUpdate);
    requestScrollyUpdate();
  });
};

initScrollyScenes();

// Portrait d'évaluation du chapitre 6 : progression automatique au scroll.
const initAssessmentPortraits = () => {
  const portraits = Array.from(document.querySelectorAll("[data-assessment-portrait]"));
  if (!portraits.length) return;

  portraits.forEach((portrait) => {
    const steps = Array.from(portrait.querySelectorAll("[data-assessment-step]"));
    const images = Array.from(portrait.querySelectorAll("[data-assessment-image]"));
    if (!steps.length || !images.length) return;

    const activateStep = (step) => {
      const stepId = step.dataset.assessmentStep || "1";
      portrait.dataset.assessmentActive = stepId;

      steps.forEach((item) => {
        const isActive = item === step;
        item.classList.toggle("is-active", isActive);

        if (isActive) {
          item.setAttribute("aria-current", "step");
        } else {
          item.removeAttribute("aria-current");
        }
      });

      images.forEach((image) => {
        image.classList.toggle("is-active", image.dataset.assessmentImage === stepId);
      });
    };

    const getClosestStep = () => {
      const viewportCenter = window.innerHeight * 0.5;
      const activeZoneTop = window.innerHeight * 0.14;
      const activeZoneBottom = window.innerHeight * 0.88;

      const closest = steps.reduce((currentClosest, step) => {
        const rect = step.getBoundingClientRect();
        const stepCenter = rect.top + rect.height * 0.5;
        const isNearViewport = rect.bottom > activeZoneTop && rect.top < activeZoneBottom;

        if (!isNearViewport) return currentClosest;

        const distance = Math.abs(stepCenter - viewportCenter);

        if (!currentClosest || distance < currentClosest.distance) {
          return { step, distance };
        }

        return currentClosest;
      }, null);

      if (closest?.step) return closest.step;

      const allAbove = steps.every((step) => step.getBoundingClientRect().bottom < activeZoneTop);
      const allBelow = steps.every((step) => step.getBoundingClientRect().top > activeZoneBottom);

      if (allAbove) return steps[steps.length - 1];
      if (allBelow) return steps[0];

      return null;
    };

    let ticking = false;

    const updateFromScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        const closestStep = getClosestStep();

        if (closestStep) {
          activateStep(closestStep);
        }

        ticking = false;
      });
    };

    activateStep(steps[0]);

    steps.forEach((step) => {
      step.addEventListener("mouseenter", () => activateStep(step));
      step.addEventListener("focusin", () => activateStep(step));
      step.addEventListener("click", () => activateStep(step));
      step.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activateStep(step);
      });
    });

    window.addEventListener("scroll", updateFromScroll, { passive: true });
    document.addEventListener("scroll", updateFromScroll, { passive: true, capture: true });
    window.addEventListener("resize", updateFromScroll);

    if ("IntersectionObserver" in window) {
      const portraitObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) updateFromScroll();
          });
        },
        { threshold: 0.01, rootMargin: "18% 0px 18% 0px" }
      );

      portraitObserver.observe(portrait);
    }

    updateFromScroll();
  });
};

initAssessmentPortraits();

// Scene de competences du chapitre 5 : la zone active synchronise texte et visuel.
const initCompetencyStages = () => {
  const stages = Array.from(document.querySelectorAll("[data-competency-stage]"));
  if (!stages.length) return;

  stages.forEach((stage) => {
    const steps = Array.from(stage.querySelectorAll("[data-competency-step]"));
    const panelTitle = stage.querySelector("[data-competency-panel-title]");
    const panelText = stage.querySelector("[data-competency-panel-text]");
    if (!steps.length || !panelTitle || !panelText) return;

    const activateStep = (step) => {
      const stepId = step.dataset.competencyStep || "1";
      const title = step.dataset.title || step.querySelector("h4")?.textContent?.trim() || "";
      const text = step.dataset.text || step.querySelector("p")?.textContent?.trim() || "";

      stage.dataset.competencyActive = stepId;
      panelTitle.textContent = title;
      panelText.textContent = text;

      steps.forEach((item) => {
        const isActive = item === step;
        item.classList.toggle("is-active", isActive);
        if (isActive) {
          item.setAttribute("aria-current", "step");
          item.setAttribute("aria-selected", "true");
          item.setAttribute("tabindex", "0");
        } else {
          item.removeAttribute("aria-current");
          item.setAttribute("aria-selected", "false");
          item.setAttribute("tabindex", "-1");
        }
      });
    };

    activateStep(steps[0]);

    steps.forEach((step, index) => {
      step.addEventListener("pointerenter", () => activateStep(step));
      step.addEventListener("click", () => activateStep(step));
      step.addEventListener("focus", () => activateStep(step));
      step.addEventListener("keydown", (event) => {
        const horizontalStep = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        const verticalStep = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
        const offset = horizontalStep || verticalStep;

        if (offset) {
          event.preventDefault();
          const nextIndex = (index + offset + steps.length) % steps.length;
          steps[nextIndex].focus();
          return;
        }

        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activateStep(step);
      });
    });
  });
};

initCompetencyStages();

// Progression sobre des figures où l'espace d'action se resserre.
const initAgencyClosureProgress = () => {
  const figures = Array.from(document.querySelectorAll(".interaction-block--agency-map .agency-closure-figure"));
  if (!figures.length) return;

  figures.forEach((figure) => {
    const stage = figure.querySelector(".agency-closure-stage");
    if (!stage) return;

    const phaseItems = [
      { element: figure.querySelector(".agency-closure-panel--speech"), phase: 2 },
      { element: figure.querySelector(".agency-closure-panel--choice"), phase: 3 },
      { element: figure.querySelector(".agency-closure-panel--confidence"), phase: 4 },
      { element: figure.querySelector(".agency-closure-core"), phase: 4 },
      { element: figure.querySelector(".agency-closure-note"), phase: 5 }
    ].filter((item) => item.element);

    const applyAgencyPhase = (phase) => {
      const activePhase = String(phase);
      figure.dataset.agencyActive = activePhase;
      stage.dataset.agencyActive = activePhase;

      phaseItems.forEach((item) => {
        item.element.classList.toggle("is-agency-active", phase >= item.phase);
      });
    };

    if (reducedStoryMotion.matches) {
      applyAgencyPhase(5);
      figure.classList.add("is-agency-progress-ready");
      return;
    }

    applyAgencyPhase(1);
    figure.classList.add("is-agency-progress-ready");

    const getAgencyPhase = () => {
      const rect = figure.getBoundingClientRect();
      const startLine = window.innerHeight * 0.82;
      const endLine = window.innerHeight * 0.28;
      const travel = rect.height + startLine - endLine;
      const progress = Math.min(1, Math.max(0, (startLine - rect.top) / travel));

      if (progress < 0.2) return 1;
      if (progress < 0.4) return 2;
      if (progress < 0.62) return 3;
      if (progress < 0.82) return 4;
      return 5;
    };

    let agencyTicking = false;
    let agencyInRange = true;

    const requestAgencyUpdate = () => {
      if (!agencyInRange || agencyTicking) return;
      agencyTicking = true;
      window.requestAnimationFrame(() => {
        applyAgencyPhase(getAgencyPhase());
        agencyTicking = false;
      });
    };

    if ("IntersectionObserver" in window) {
      const agencyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            agencyInRange = entry.isIntersecting;
            if (agencyInRange) requestAgencyUpdate();
          });
        },
        { rootMargin: "18% 0px 18% 0px", threshold: 0.01 }
      );

      agencyObserver.observe(figure);
    }

    window.addEventListener("scroll", requestAgencyUpdate, { passive: true });
    window.addEventListener("resize", requestAgencyUpdate);
    requestAgencyUpdate();
  });
};

initAgencyClosureProgress();

// Interaction légère autour de la marge d'action.
const initActionMarginBlocks = () => {
  const blocks = Array.from(document.querySelectorAll(".interaction-block--obstacle-stage"));
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const cards = Array.from(block.querySelectorAll(".support-card"));
    if (!cards.length) return;

    const clearActiveSupport = () => {
      cards.forEach((card) => card.classList.remove("is-support-active"));
      delete block.dataset.supportTone;
    };

    const activateSupportCard = (card) => {
      const isAlreadyActive = card.classList.contains("is-support-active");
      clearActiveSupport();

      if (isAlreadyActive) return;

      card.classList.add("is-support-active");
      block.dataset.supportTone = card.closest(".support-field--helps") ? "opens" : "blocks";
    };

    cards.forEach((card) => {
      card.addEventListener("click", () => activateSupportCard(card));

      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateSupportCard(card);
        }

        if (event.key === "Escape") {
          clearActiveSupport();
        }
      });
    });
  });
};

initActionMarginBlocks();

// Carnet de notes construit progressivement.
const initToolTraceBlocks = () => {
  const blocks = Array.from(document.querySelectorAll(".interaction-block--tool-stage"));
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const traceScene = block.querySelector("[data-tool-trace]");
    if (!traceScene) return;

    const noteItems = Array.from(traceScene.querySelectorAll("[data-tool-note-item]"));
    const noteSections = Array.from(traceScene.querySelectorAll(".tool-note-section"));
    const toolSteps = Array.from(block.querySelectorAll("[data-tool-trace-step]"));
    const maxNoteStep = noteItems.length;

    const noteStepByPhase = {
      1: 6,
      2: 12,
      3: 18,
      4: 18
    };

    const getPhaseFromNoteStep = (noteStep) => {
      if (noteStep <= 0) return 0;
      if (noteStep <= 6) return 1;
      if (noteStep <= 12) return 2;
      return 3;
    };

    const applyNotebookStep = (noteStep) => {
      const activeNoteStep = Math.min(maxNoteStep, Math.max(0, noteStep));
      const phase = getPhaseFromNoteStep(activeNoteStep);
      const activePhase = String(phase);
      traceScene.dataset.toolPhase = activePhase;
      traceScene.dataset.toolNote = String(activeNoteStep);
      traceScene.style.setProperty("--tool-note-step", String(activeNoteStep));
      block.dataset.toolPhase = activePhase;

      noteItems.forEach((item) => {
        const itemStep = Number(item.dataset.toolNoteItem) || 0;
        item.classList.toggle("is-tool-note-visible", itemStep <= activeNoteStep);
      });

      noteSections.forEach((section) => {
        section.classList.toggle(
          "is-tool-note-section-active",
          (phase === 1 && section.classList.contains("tool-note-section--observations")) ||
            (phase === 2 && section.classList.contains("tool-note-section--structure")) ||
            (phase === 3 && section.classList.contains("tool-note-section--share"))
        );
      });

      toolSteps.forEach((step) => {
        const stepPhase = Number(step.dataset.toolTraceStep) || 1;
        const isActive = stepPhase === phase;
        const isRevealed = phase >= stepPhase;
        step.classList.toggle("is-tool-step-active", isActive);
        step.classList.toggle("is-tool-step-revealed", isRevealed);

        if (isActive) {
          step.setAttribute("aria-current", "step");
        } else {
          step.removeAttribute("aria-current");
        }
      });
    };

    if (reducedStoryMotion.matches) {
      applyNotebookStep(maxNoteStep);
      return;
    }

    const getNotebookStep = () => {
      const rect = traceScene.getBoundingClientRect();
      const startLine = window.innerHeight * 0.84;
      const endLine = window.innerHeight * 0.22;
      const travel = Math.max(1, rect.height + startLine - endLine);
      const progress = Math.min(1, Math.max(0, (startLine - rect.top) / travel));
      return Math.min(maxNoteStep, Math.max(0, Math.floor(progress * (maxNoteStep + 1))));
    };

    let toolTicking = false;
    let forcedNotebookStep = null;

    const requestToolUpdate = () => {
      if (toolTicking) return;
      toolTicking = true;
      window.requestAnimationFrame(() => {
        applyNotebookStep(forcedNotebookStep ?? getNotebookStep());
        toolTicking = false;
      });
    };

    if ("IntersectionObserver" in window) {
      const toolObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) requestToolUpdate();
          });
        },
        { rootMargin: "18% 0px 18% 0px", threshold: 0.01 }
      );

      toolObserver.observe(block);
    }

    toolSteps.forEach((step) => {
      const phase = Number(step.dataset.toolTraceStep) || 1;
      const noteStep = noteStepByPhase[phase] || phase;
      const revealStep = () => {
        forcedNotebookStep = noteStep;
        applyNotebookStep(noteStep);
      };
      const releaseStep = () => {
        forcedNotebookStep = null;
        requestToolUpdate();
      };

      step.addEventListener("focus", revealStep);
      step.addEventListener("focusin", revealStep);
      step.addEventListener("mouseenter", revealStep);
      step.addEventListener("mouseover", revealStep);
      step.addEventListener("pointerenter", revealStep);
      step.addEventListener("click", revealStep);
      step.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        revealStep();
      });
      step.addEventListener("mouseleave", releaseStep);
      step.addEventListener("pointerleave", releaseStep);
      step.addEventListener("focusout", releaseStep);
    });

    const guardrail = block.querySelector(".tool-guardrail");
    if (guardrail) {
      const revealGuardrail = () => {
        forcedNotebookStep = maxNoteStep;
        applyNotebookStep(maxNoteStep);
      };
      const releaseGuardrail = () => {
        forcedNotebookStep = null;
        requestToolUpdate();
      };

      guardrail.addEventListener("focus", revealGuardrail);
      guardrail.addEventListener("focusin", revealGuardrail);
      guardrail.addEventListener("mouseenter", revealGuardrail);
      guardrail.addEventListener("mouseover", revealGuardrail);
      guardrail.addEventListener("pointerenter", revealGuardrail);
      guardrail.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        revealGuardrail();
      });
      guardrail.addEventListener("mouseleave", releaseGuardrail);
      guardrail.addEventListener("pointerleave", releaseGuardrail);
      guardrail.addEventListener("focusout", releaseGuardrail);
    }

    window.addEventListener("scroll", requestToolUpdate, { passive: true });
    window.addEventListener("resize", requestToolUpdate);
    requestToolUpdate();
  });
};

initToolTraceBlocks();

// Image du chapitre 1 : particules relancées au survol, réinitialisées hors viewport.
const chapterOneImage = document.querySelector("#chapitre-1 .chapter-image-breath");

if (chapterOneImage) {
  let chapterOneImageInView = false;

  const resetChapterImageAnimation = () => {
    chapterOneImage.classList.remove("is-image-active");
  };

  const startChapterImageAnimation = () => {
    if (!chapterOneImageInView || reducedStoryMotion.matches) return;
    chapterOneImage.classList.remove("is-image-active");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        chapterOneImage.classList.add("is-image-active");
      });
    });
  };

  chapterOneImage.addEventListener("mouseenter", startChapterImageAnimation);
  chapterOneImage.addEventListener("mouseleave", resetChapterImageAnimation);

  if ("IntersectionObserver" in window && !reducedStoryMotion.matches) {
    const chapterImageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            chapterOneImageInView = true;
            chapterOneImage.classList.add("is-image-in-view");
            if (chapterOneImage.matches(":hover")) {
              startChapterImageAnimation();
            }
          } else {
            chapterOneImageInView = false;
            chapterOneImage.classList.remove("is-image-in-view");
            resetChapterImageAnimation();
          }
        });
      },
      { threshold: 0.34, rootMargin: "0px 0px -10% 0px" }
    );

    chapterImageObserver.observe(chapterOneImage);
  } else {
    chapterOneImageInView = true;
    resetChapterImageAnimation();
  }
}

// Chapitre 7 : animation des images de titre au survol du badge ou du repère de navigation.
const chapterSevenHeading = document.querySelector("#chapitre-7 .chapter-heading");
const chapterSevenBadge = document.querySelector("#chapitre-7 .chapter-number");
const chapterSevenNavLink = document.querySelector('.chapter-nav a[href="#chapitre-7"]');

if (chapterSevenHeading) {
  const activateChapterSevenTitleImages = () => {
    if (reducedStoryMotion.matches) return;
    chapterSevenHeading.classList.add("is-title-image-active");
  };

  const resetChapterSevenTitleImages = () => {
    chapterSevenHeading.classList.remove("is-title-image-active");
  };

  [chapterSevenBadge, chapterSevenNavLink].filter(Boolean).forEach((trigger) => {
    trigger.addEventListener("mouseenter", activateChapterSevenTitleImages);
    trigger.addEventListener("mouseleave", resetChapterSevenTitleImages);
    trigger.addEventListener("focusin", activateChapterSevenTitleImages);
    trigger.addEventListener("focusout", resetChapterSevenTitleImages);
  });
}

// Barre de progression discrète : elle accompagne le parcours sans concurrencer la navigation.
const progressBar = document.querySelector(".reading-progress__bar");

const updateReadingProgress = () => {
  if (!progressBar) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
  progressBar.style.transform = `scaleX(${progress})`;
};

if (progressBar) {
  updateReadingProgress();
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  window.addEventListener("resize", updateReadingProgress);
}

// Onglets réutilisables pour les blocs Littérature, Terrain et Intégration.
document.querySelectorAll("[data-tabs]").forEach((tabs) => {
  const buttons = Array.from(tabs.querySelectorAll('[role="tab"]'));
  const panels = Array.from(tabs.querySelectorAll('[role="tabpanel"]'));
  if (!buttons.length || !panels.length) return;

  const activateTab = (button, shouldFocus = false) => {
    const activePanelId = button.getAttribute("aria-controls");
    buttons.forEach((item) => {
      const isActive = item === button;
      item.setAttribute("aria-selected", String(isActive));
      item.setAttribute("tabindex", isActive ? "0" : "-1");
    });
    panels.forEach((panel) => {
      const isActive = panel.id === activePanelId;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active-panel", isActive);
    });
    if (shouldFocus) button.focus();
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => activateTab(button));
    button.addEventListener("keydown", (event) => {
      const nextKeys = ["ArrowRight", "ArrowDown"];
      const previousKeys = ["ArrowLeft", "ArrowUp"];

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        activateTab(event.key === "Home" ? buttons[0] : buttons[buttons.length - 1], true);
        return;
      }

      if (nextKeys.includes(event.key) || previousKeys.includes(event.key)) {
        event.preventDefault();
        const direction = nextKeys.includes(event.key) ? 1 : -1;
        const next = buttons[(index + direction + buttons.length) % buttons.length];
        activateTab(next, true);
      }
    });
  });

  const selectedButton = buttons.find((button) => button.getAttribute("aria-selected") === "true") || buttons[0];
  activateTab(selectedButton);
});

// Cartes détaillables pour les éléments qui révèlent un complément au clic.
document.querySelectorAll("[data-expand-card]").forEach((card) => {
  if (!card.hasAttribute("tabindex")) {
    card.setAttribute("tabindex", "0");
  }

  if (!card.hasAttribute("role")) {
    card.setAttribute("role", "button");
  }

  const toggleCard = () => {
    const isExpanded = card.getAttribute("aria-expanded") === "true";
    const detail = card.querySelector("small");
    card.setAttribute("aria-expanded", String(!isExpanded));
    if (detail) detail.hidden = isExpanded;
  };

  card.addEventListener("click", toggleCard);
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleCard();
  });
});

document.querySelectorAll("[data-journey]").forEach((journey) => {
  const steps = Array.from(journey.querySelectorAll(".journey-step"));
  const detail = journey.parentElement.querySelector(".journey-detail");
  const line = journey.querySelector(".journey-line");

  const setProgress = (activeIndex) => {
    if (!line) return;
    const progress = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 0;
    line.style.setProperty("--journey-progress", `${progress}%`);
  };

  const setActiveStep = (activeStep, activeIndex) => {
    steps.forEach((item) => {
      const isActive = item === activeStep;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    detail.textContent = activeStep.dataset.stepText;
    setProgress(activeIndex);
  };

  steps.forEach((step, index) => {
    step.setAttribute("aria-pressed", String(step.classList.contains("is-active")));
    step.addEventListener("click", () => {
      setActiveStep(step, index);
    });
    step.addEventListener("keydown", (event) => {
      const nextKeys = ["ArrowRight", "ArrowDown"];
      const previousKeys = ["ArrowLeft", "ArrowUp"];

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveStep(step, index);
        return;
      }

      if (nextKeys.includes(event.key) || previousKeys.includes(event.key)) {
        event.preventDefault();
        const direction = nextKeys.includes(event.key) ? 1 : -1;
        const nextIndex = (index + direction + steps.length) % steps.length;
        steps[nextIndex].focus();
        setActiveStep(steps[nextIndex], nextIndex);
      }
    });
  });

  setProgress(0);
});

document.querySelectorAll(".chapter-interactive-panel").forEach((panel) => {
  const choices = Array.from(panel.querySelectorAll(".interactive-choice"));
  const display = panel.querySelector(".interactive-display");
  const titleTarget = panel.querySelector(".interactive-display-title");
  const textTarget = panel.querySelector(".interactive-display-text");

  const activateChoice = (activeChoice, shouldFocus = false) => {
    if (!activeChoice || !titleTarget || !textTarget) return;

    choices.forEach((choice) => {
      const isActive = choice === activeChoice;
      choice.classList.toggle("is-active", isActive);
      choice.setAttribute("aria-selected", String(isActive));
      choice.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    titleTarget.textContent = activeChoice.dataset.title || "";
    textTarget.textContent = activeChoice.dataset.text || "";
    display?.classList.add("is-updated");

    if (shouldFocus) {
      activeChoice.focus();
    }
  };

  choices.forEach((choice, index) => {
    choice.addEventListener("click", () => activateChoice(choice));
    choice.addEventListener("keydown", (event) => {
      const nextKeys = ["ArrowRight", "ArrowDown"];
      const previousKeys = ["ArrowLeft", "ArrowUp"];

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateChoice(choice);
      }

      if (nextKeys.includes(event.key) || previousKeys.includes(event.key)) {
        event.preventDefault();
        const direction = nextKeys.includes(event.key) ? 1 : -1;
        const nextIndex = (index + direction + choices.length) % choices.length;
        activateChoice(choices[nextIndex], true);
      }
    });
  });

  const initialChoice = choices.find((choice) => choice.classList.contains("is-active")) || choices[0];
  if (initialChoice) {
    activateChoice(initialChoice);
  }
});

const balanceRange = document.querySelector("#balanceRange");
const balanceText = document.querySelector("#balanceText");

if (balanceRange && balanceText) {
  const updateBalance = () => {
    const value = Number(balanceRange.value);
    balanceRange.closest("[data-balance]")?.style.setProperty("--balance", `${value}%`);
    if (value < 40) {
      balanceText.textContent =
        "Respecter le rythme, la volonté et les droits décisionnels de la personne, même lorsque la situation inquiète.";
    } else if (value > 60) {
      balanceText.textContent =
        "Intensifier lorsque l'inaction devient difficile à justifier : mobiliser des ressources, sécuriser, signaler ou agir plus fermement.";
    } else {
      balanceText.textContent =
        "Ajuster la réponse selon le risque, le lien et la volonté de la personne.";
    }
  };

  balanceRange.addEventListener("input", updateBalance);
  updateBalance();
}

const navLinks = Array.from(document.querySelectorAll(".chapter-nav a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("is-active", isCurrent);
        if (isCurrent) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  },
  { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 }
);

sections.forEach((section) => navObserver.observe(section));

// Données de la grille finale. Les portraits sont extraits dans outputs/assets/portraits/.
const storyParticipants = [
  {
    id: "recit-01",
    nom: "Camille",
    image: "assets/portraits/participant-01-camille.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Maltraitance financière et psychologique à domicile",
    population: "Personne aînée vivant seule",
    recitComplet: ""
  },
  {
    id: "recit-02",
    nom: "Mathieu",
    image: "assets/portraits/participant-02-mathieu.png",
    typeEmploi: "Travailleur social",
    contexteIntervention: "Contrôle conjugal, peur et dénigrement",
    population: "Femme adulte/aînée en contexte conjugal violent",
    recitComplet: ""
  },
  {
    id: "recit-03",
    nom: "Élise",
    image: "assets/portraits/participant-03-elise.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Négligence possible, confusion et désorientation",
    population: "Personne aînée vulnérable",
    recitComplet: ""
  },
  {
    id: "recit-04",
    nom: "Samuel",
    image: "assets/portraits/participant-04-samuel.png",
    typeEmploi: "Infirmier",
    contexteIntervention: "Refus familial de soins et douleur non soulagée",
    population: "Personne très âgée avec démence avancée",
    recitComplet: ""
  },
  {
    id: "recit-05",
    nom: "Anne-Marie",
    image: "assets/portraits/participant-05-anne-marie.png",
    typeEmploi: "Infirmière-chef",
    contexteIntervention: "Pression familiale autour des soins palliatifs",
    population: "Personne âgée en fin de vie",
    recitComplet: ""
  },
  {
    id: "recit-06",
    nom: "Laurence",
    image: "assets/portraits/participant-06-laurence.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Maltraitance psychologique en CHSLD",
    population: "Personne aînée avec troubles cognitifs",
    recitComplet: ""
  },
  {
    id: "recit-07",
    nom: "Catherine",
    image: "assets/portraits/participant-07-catherine.png",
    typeEmploi: "Travailleuse sociale / intervenante pivot",
    contexteIntervention: "Négligence grave et isolement à domicile",
    population: "Adulte avec DI-TSA-DP",
    recitComplet: ""
  },
  {
    id: "recit-08",
    nom: "Olivier",
    image: "assets/portraits/participant-08-olivier.png",
    typeEmploi: "Travailleur social / intervenant pivot",
    contexteIntervention: "Négligence possible liée à l’épuisement familial",
    population: "Adulte avec déficience intellectuelle et physique",
    recitComplet: ""
  },
  {
    id: "recit-09",
    nom: "Sophie",
    image: "assets/portraits/participant-09-sophie.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Négligence familiale progressive",
    population: "Adulte avec déficience intellectuelle légère",
    recitComplet: ""
  },
  {
    id: "recit-10",
    nom: "Marianne",
    image: "assets/portraits/participant-10-marianne.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Violence conjugale, contrôle et menaces",
    population: "Jeune femme avec déficience intellectuelle",
    recitComplet: ""
  },
  {
    id: "recit-11",
    nom: "Isabelle",
    image: "assets/portraits/participant-11-isabelle.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Isolement, contrôle et exploitation financière",
    population: "Personne aînée avec problèmes visuels",
    recitComplet: ""
  },
  {
    id: "recit-12",
    nom: "Valérie",
    image: "assets/portraits/participant-12-valerie.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Contrôle familial et manipulation financière",
    population: "Personne aînée avec Alzheimer",
    recitComplet: ""
  },
  {
    id: "recit-13",
    nom: "Julie",
    image: "assets/portraits/participant-13-julie.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Maltraitance psychologique conjugale et enjeux financiers",
    population: "Personne aînée avec trouble neurocognitif",
    recitComplet: ""
  },
  {
    id: "recit-14",
    nom: "Nathalie",
    image: "assets/portraits/participant-14-nathalie.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Tensions familiales et pratiques relationnelles en CHSLD",
    population: "Personne aînée avec démence à corps de Lewy",
    recitComplet: ""
  },
  {
    id: "recit-15",
    nom: "Geneviève",
    image: "assets/portraits/participant-15-genevieve.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Négligence et surcharge familiale",
    population: "Personne aînée avec maladie neurodégénérative",
    recitComplet: ""
  },
  {
    id: "recit-16",
    nom: "Audrey",
    image: "assets/portraits/participant-16-audrey.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Maltraitance psychologique sous tutelle privée",
    population: "Femme adulte/aînée avec déficience intellectuelle",
    recitComplet: ""
  },
  {
    id: "recit-17",
    nom: "Mélanie",
    image: "assets/portraits/participant-17-melanie.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Maltraitance intrafamiliale, financière et psychologique",
    population: "Personne aînée avec déficience intellectuelle et déclin cognitif",
    recitComplet: ""
  },
  {
    id: "recit-18",
    nom: "Alexandre",
    image: "assets/portraits/participant-18-alexandre.png",
    typeEmploi: "Infirmier clinicien",
    contexteIntervention: "Violence psychologique familiale",
    population: "Adulte avec psychose toxique et consommation de substances",
    recitComplet: ""
  },
  {
    id: "recit-19",
    nom: "Caroline",
    image: "assets/portraits/participant-19-caroline.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Exploitation financière et chantage affectif",
    population: "Personne aînée avec trouble anxieux sévère",
    recitComplet: ""
  },
  {
    id: "recit-20",
    nom: "Véronique",
    image: "assets/portraits/participant-20-veronique.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Maltraitance organisationnelle et relationnelle",
    population: "Personne aînée avec troubles neurocognitifs fluctuants",
    recitComplet: ""
  },
  {
    id: "recit-21",
    nom: "Patricia",
    image: "assets/portraits/participant-21-patricia.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Infantilisation, rigidité et propos dénigrants",
    population: "Résidents aînés en CHSLD",
    recitComplet: ""
  },
  {
    id: "recit-22",
    nom: "Marco",
    image: "assets/portraits/participant-22-marco.png",
    typeEmploi: "Infirmier",
    contexteIntervention: "Chantage affectif et financier",
    population: "Personne aînée en CHSLD",
    recitComplet: ""
  },
  {
    id: "recit-23",
    nom: "Stéphanie",
    image: "assets/portraits/participant-23-stephanie.png",
    typeEmploi: "Intervenante clinique / travailleuse sociale",
    contexteIntervention: "Propos menaçants durant un soin",
    population: "Résidente aînée avec troubles cognitifs sévères",
    recitComplet: ""
  },
  {
    id: "recit-24",
    nom: "Noémie",
    image: "assets/portraits/participant-24-noemie.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Contrôle conjugal et retrait de médication",
    population: "Femme adulte vulnérable avec pertes de mémoire",
    recitComplet: ""
  },
  {
    id: "recit-25",
    nom: "Amélie",
    image: "assets/portraits/participant-25-amelie.png",
    typeEmploi: "Psychoéducatrice / éducatrice spécialisée",
    contexteIntervention: "Négligence diffuse en milieu familial instable",
    population: "Femme adulte avec déficience intellectuelle importante",
    recitComplet: ""
  },
  {
    id: "recit-26",
    nom: "Sarah",
    image: "assets/portraits/participant-26-sarah.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Sollicitations financières et culpabilisation par un proche",
    population: "Personne aînée seule et précaire",
    recitComplet: ""
  },
  {
    id: "recit-27",
    nom: "Émilien",
    image: "assets/portraits/participant-27-emilien.png",
    typeEmploi: "Stagiaire en ergothérapie",
    contexteIntervention: "Discours familial décourageant",
    population: "Personne aînée en perte d’autonomie",
    recitComplet: ""
  },
  {
    id: "recit-28",
    nom: "Florence",
    image: "assets/portraits/participant-28-florence.png",
    typeEmploi: "Ergothérapeute",
    contexteIntervention: "Conflit autour des soins, de la médication et de l’influence conjugale",
    population: "Personne aînée avec troubles cognitifs",
    recitComplet: ""
  },
  {
    id: "recit-29",
    nom: "Simon",
    image: "assets/portraits/participant-29-simon.png",
    typeEmploi: "Travailleur social",
    contexteIntervention: "Maltraitance psychologique conjugale et détresse suicidaire",
    population: "Couple aîné épuisé et interdépendant",
    recitComplet: ""
  },
  {
    id: "recit-30",
    nom: "Justine",
    image: "assets/portraits/participant-30-justine.png",
    typeEmploi: "Ergothérapeute",
    contexteIntervention: "Violence psychologique conjugale",
    population: "Femme aînée avec déclin neurocognitif et moteur",
    recitComplet: ""
  },
  {
    id: "recit-31",
    nom: "Maude",
    image: "assets/portraits/participant-31-maude.png",
    typeEmploi: "Travailleuse sociale",
    contexteIntervention: "Violence conjugale, contrôle et négligence du milieu",
    population: "Femme adulte avec déficience intellectuelle modérée",
    recitComplet: ""
  },
  {
    id: "recit-32",
    nom: "Vincent",
    image: "assets/portraits/participant-32-vincent.png",
    typeEmploi: "Travailleur social / intervenant CLSC-DITSA",
    contexteIntervention: "Maltraitance psychologique, financière et environnementale",
    population: "Personne aînée non voyante en logement adapté",
    recitComplet: ""
  }
];

const storyGrid = document.querySelector("[data-story-grid]");
const storyModal = document.querySelector("[data-story-modal]");

if (storyGrid && storyModal) {
  const storyDialog = storyModal.querySelector(".story-modal__dialog");
  const storyName = storyModal.querySelector("[data-story-modal-name]");
  const storyRole = storyModal.querySelector("[data-story-modal-role]");
  const storyText = storyModal.querySelector("[data-story-modal-story]");
  const closeButtons = Array.from(storyModal.querySelectorAll("[data-story-modal-close]"));
  let lastFocusedElement = null;

  const buildStoryPhoto = (participant, mode = "card") => {
    const wrapper = document.createElement("div");
    wrapper.className = `story-photo story-photo--${mode}`;

    if (participant.image) {
      const image = document.createElement("img");
      image.src = participant.image;
      image.alt = `Portrait anonymisé de ${participant.nom}`;
      image.className = "participant-portrait";
      image.loading = "lazy";
      wrapper.append(image);
      return wrapper;
    }

    const placeholder = document.createElement("span");
    placeholder.textContent = "Portrait à intégrer";
    wrapper.append(placeholder);
    return wrapper;
  };

  const fillStoryModal = (participant) => {
    storyName.textContent = participant.nom;
    storyRole.textContent = participant.typeEmploi;
    storyText.textContent = participant.recitComplet || "";
  };

  const openStoryModal = (participant, trigger) => {
    lastFocusedElement = trigger;
    fillStoryModal(participant);
    storyModal.hidden = false;
    document.body.classList.add("story-modal-open");
    requestAnimationFrame(() => {
      storyModal.classList.add("is-open");
      storyDialog.focus();
    });
  };

  const closeStoryModal = () => {
    storyModal.classList.remove("is-open");
    storyModal.hidden = true;
    document.body.classList.remove("story-modal-open");
    lastFocusedElement?.focus();
  };

  const createMetaItem = (label, value) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const definition = document.createElement("dd");
    term.textContent = label;
    definition.textContent = value;
    item.append(term, definition);
    return item;
  };

  const createStoryCard = (participant, index) => {
    const card = document.createElement("article");
    card.className = "story-card";
    card.style.setProperty("--story-index", index);

    const titleButton = document.createElement("button");
    titleButton.type = "button";
    titleButton.className = "story-card__title";
    titleButton.textContent = participant.nom;
    titleButton.setAttribute("aria-label", `Ouvrir le récit de ${participant.nom}`);

    const imageButton = document.createElement("button");
    imageButton.type = "button";
    imageButton.className = "story-card__image";
    imageButton.setAttribute("aria-label", `Ouvrir le récit de ${participant.nom}`);
    imageButton.append(buildStoryPhoto(participant));

    const meta = document.createElement("dl");
    meta.className = "story-card__meta";
    meta.append(
      createMetaItem("Type d'emploi", participant.typeEmploi),
      createMetaItem("Contexte d'intervention", participant.contexteIntervention),
      createMetaItem("Population", participant.population)
    );

    const readButton = document.createElement("button");
    readButton.type = "button";
    readButton.className = "story-card__link";
    readButton.setAttribute("aria-label", `Ouvrir le récit de ${participant.nom}`);
    readButton.textContent = "Récit complet";

    [titleButton, imageButton, readButton].forEach((button) => {
      button.disabled = false;
      button.removeAttribute("aria-disabled");
      button.addEventListener("click", () => openStoryModal(participant, button));
    });

    card.append(titleButton, imageButton, meta, readButton);
    return card;
  };

  const storyFragment = document.createDocumentFragment();
  storyParticipants.forEach((participant, index) => {
    storyFragment.append(createStoryCard(participant, index));
  });
  storyGrid.append(storyFragment);

  const storyCards = Array.from(storyGrid.querySelectorAll(".story-card"));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
    const storyCardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            storyCardObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    storyCards.forEach((card) => storyCardObserver.observe(card));
  } else {
    storyCards.forEach((card) => card.classList.add("is-visible"));
  }

  closeButtons.forEach((button) => button.addEventListener("click", closeStoryModal));

  storyModal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeStoryModal();
      return;
    }

    if (event.key !== "Tab") return;
    const focusableElements = Array.from(
      storyModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((element) => !element.hasAttribute("disabled"));

    if (!focusableElements.length) return;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });
}
