"use strict";

/**
 * @typedef {Object} SoundSettings
 * @property {number} [gain] - Volume gain multiplier (default: 1)
 * @property {number} [pan] - Stereo panning value from -1 (left) to 1 (right) (default: 0)
 * @property {boolean} [mono] - Whether to convert stereo to mono (default: false)
 * @property {boolean} [flip] - Whether to flip left and right channels (default: false)
 */

/**
 * @typedef {Object} MediaElement
 * @property {string} type - Type of media element ('audio' or 'video')
 * @property {boolean} isPlaying - Whether the element is currently playing
 * @property {SoundSettings} [settings] - Current sound settings for the element
 */

/**
 * @typedef {Object} GlobalSettings
 * @property {number} globalGain - Global gain multiplier (default: 1.5)
 * @property {Object.<string, number>} domainOverrides - Domain-specific gain overrides
 */

// Tab ID of the current tab
let tid = 0;
// Current tab URL for domain detection
let currentUrl = "";
// Global settings loaded from storage
let globalSettings = { globalGain: 1.5, domainOverrides: {} };
// Map from frame ID to map of media elements
/** @type {Map<number, Map<string, MediaElement>>} */
const frameMap = new Map();
const elementsList = document.getElementById("elements-list");
const allElements = document.getElementById("all-elements");
const indivElements = document.getElementById("individual-elements");
const elementsTpl = document.getElementById("elements-tpl");

// Global settings UI elements
const globalGainSlider = document.getElementById("global-gain");
const globalGainNumber = document.getElementById("global-gain-num");
const domainGainSlider = document.getElementById("domain-gain");
const domainGainNumber = document.getElementById("domain-gain-num");
const currentDomainSpan = document.getElementById("current-domain");
const saveDomainBtn = document.getElementById("save-domain-override");
const clearDomainBtn = document.getElementById("clear-domain-override");

/**
 * Load global settings from browser storage
 * @returns {Promise<GlobalSettings>}
 */
async function loadGlobalSettings() {
    try {
        const result = await browser.storage.sync.get(["lyra_settings"]);
        if (result.lyra_settings) {
            return { ...globalSettings, ...result.lyra_settings };
        }
    } catch (error) {
        console.warn("Failed to load settings:", error);
    }
    return globalSettings;
}

/**
 * Save global settings to browser storage
 * @param {GlobalSettings} settings
 */
async function saveGlobalSettings(settings) {
    try {
        await browser.storage.sync.set({ lyra_settings: settings });
        globalSettings = settings;
    } catch (error) {
        console.error("Failed to save settings:", error);
    }
}

/**
 * Get the domain from a URL
 * @param {string} url
 * @returns {string}
 */
function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return "unknown";
    }
}

/**
 * Get the effective gain for the current domain
 * @returns {number}
 */
function getEffectiveGain() {
    const domain = getDomain(currentUrl);
    return globalSettings.domainOverrides[domain] || globalSettings.globalGain;
}

/**
 * Update the global settings UI
 */
function updateGlobalSettingsUI() {
    const domain = getDomain(currentUrl);
    const effectiveGain = getEffectiveGain();
    const hasOverride = domain in globalSettings.domainOverrides;

    globalGainSlider.value = globalSettings.globalGain;
    globalGainNumber.value = globalSettings.globalGain;

    domainGainSlider.value = effectiveGain;
    domainGainNumber.value = effectiveGain;

    currentDomainSpan.textContent = domain;
    clearDomainBtn.style.display = hasOverride ? "inline-block" : "none";
}

/**
 * Applies sound modification settings to a specific media element
 *
 * Sets up an AudioContext pipeline for the media element if it doesn't exist yet,
 * then applies the requested sound settings (gain, pan, mono, flip).
 *
 * Side effects:
 * - Creates AudioContext nodes on the target element
 * - Modifies audio properties on the target element
 *
 * @param {number} fid - Frame ID containing the element
 * @param {string} elid - Element ID (data-x-soundfixer-id attribute value)
 * @param {SoundSettings} newSettings - New sound settings to apply
 * @returns {Promise} Promise that resolves when settings are applied
 */
function applySettings(fid, elid, newSettings) {
    return browser.tabs.executeScript(tid, {
        frameId: fid,
        code: `(function () {
		const el = document.querySelector('[data-x-soundfixer-id="${elid}"]')
		if (!el.xSoundFixerContext) {
			el.xSoundFixerContext = new AudioContext()
			el.xSoundFixerGain = el.xSoundFixerContext.createGain()
			el.xSoundFixerPan = el.xSoundFixerContext.createStereoPanner()
			el.xSoundFixerSplit = el.xSoundFixerContext.createChannelSplitter(2)
			el.xSoundFixerMerge = el.xSoundFixerContext.createChannelMerger(2)
			el.xSoundFixerSource = el.xSoundFixerContext.createMediaElementSource(el)
			el.xSoundFixerSource.connect(el.xSoundFixerGain)
			el.xSoundFixerGain.connect(el.xSoundFixerPan)
			el.xSoundFixerPan.connect(el.xSoundFixerContext.destination)
			el.xSoundFixerOriginalChannels = el.xSoundFixerContext.destination.channelCount
		}
		const newSettings = ${JSON.stringify(newSettings)}
		if ('gain' in newSettings) {
			el.xSoundFixerGain.gain.value = newSettings.gain
		}
		if ('pan' in newSettings) {
			el.xSoundFixerPan.pan.value = newSettings.pan
		}
		if ('mono' in newSettings) {
			el.xSoundFixerContext.destination.channelCount = newSettings.mono ? 1 : el.xSoundFixerOriginalChannels
		}
		if ('flip' in newSettings) {
			el.xSoundFixerFlipped = newSettings.flip
			el.xSoundFixerMerge.disconnect()
			el.xSoundFixerPan.disconnect()
			if (el.xSoundFixerFlipped) {
				el.xSoundFixerPan.connect(el.xSoundFixerSplit)
				el.xSoundFixerSplit.connect(el.xSoundFixerMerge, 0, 1)
				el.xSoundFixerSplit.connect(el.xSoundFixerMerge, 1, 0)
				el.xSoundFixerMerge.connect(el.xSoundFixerContext.destination)
			} else {
				el.xSoundFixerPan.connect(el.xSoundFixerContext.destination)
			}
		}
		el.xSoundFixerSettings = {
			gain: el.xSoundFixerGain.gain.value,
			pan: el.xSoundFixerPan.pan.value,
			mono: el.xSoundFixerContext.destination.channelCount == 1,
			flip: el.xSoundFixerFlipped,
		}
	})()`,
    });
}

/**
 * Initialize global settings event handlers
 */
function initializeGlobalSettings() {
    // Global gain slider
    globalGainSlider.addEventListener("input", async () => {
        globalSettings.globalGain = parseFloat(globalGainSlider.value);
        globalGainNumber.value = globalGainSlider.value;
        await saveGlobalSettings(globalSettings);

        // Apply to current page if no domain override
        const domain = getDomain(currentUrl);
        if (!(domain in globalSettings.domainOverrides)) {
            applyGainToAllElements(globalSettings.globalGain);
        }
    });

    globalGainNumber.addEventListener("input", async function () {
        if (+this.value > +this.getAttribute("max"))
            this.value = this.getAttribute("max");
        if (+this.value < +this.getAttribute("min"))
            this.value = this.getAttribute("min");

        globalSettings.globalGain = parseFloat(this.value);
        globalGainSlider.value = this.value;
        await saveGlobalSettings(globalSettings);

        // Apply to current page if no domain override
        const domain = getDomain(currentUrl);
        if (!(domain in globalSettings.domainOverrides)) {
            applyGainToAllElements(globalSettings.globalGain);
        }
    });

    // Domain override sliders
    domainGainSlider.addEventListener("input", () => {
        domainGainNumber.value = domainGainSlider.value;
        applyGainToAllElements(parseFloat(domainGainSlider.value));
    });

    domainGainNumber.addEventListener("input", function () {
        if (+this.value > +this.getAttribute("max"))
            this.value = this.getAttribute("max");
        if (+this.value < +this.getAttribute("min"))
            this.value = this.getAttribute("min");

        domainGainSlider.value = this.value;
        applyGainToAllElements(parseFloat(this.value));
    });

    // Save domain override button
    saveDomainBtn.addEventListener("click", async () => {
        const domain = getDomain(currentUrl);
        const gainValue = parseFloat(domainGainSlider.value);

        globalSettings.domainOverrides[domain] = gainValue;
        await saveGlobalSettings(globalSettings);
        updateGlobalSettingsUI();
    });

    // Clear domain override button
    clearDomainBtn.addEventListener("click", async () => {
        const domain = getDomain(currentUrl);
        delete globalSettings.domainOverrides[domain];
        await saveGlobalSettings(globalSettings);
        updateGlobalSettingsUI();

        // Apply global gain instead
        applyGainToAllElements(globalSettings.globalGain);
    });
}

/**
 * Apply gain to all media elements on the page
 * @param {number} gainValue
 */
function applyGainToAllElements(gainValue) {
    for (const [fid, els] of frameMap) {
        for (const [elid, el] of els) {
            applySettings(fid, elid, { gain: gainValue });
            // Update individual element UI sliders
            const egain = document.querySelector(
                `[data-fid="${fid}"][data-elid="${elid}"] .element-gain`,
            );
            if (egain) {
                egain.value = gainValue;
                egain.parentElement.querySelector(".element-gain-num").value =
                    "" + gainValue;
            }
        }
    }

    // Update the "All elements" slider if it exists
    const allGain = document.querySelector("#all-elements .element-gain");
    if (allGain) {
        allGain.value = gainValue;
        allGain.parentElement.querySelector(".element-gain-num").value =
            "" + gainValue;
    }
}

/**
 * Initialize the popup by:
 * 1. Loading global settings
 * 2. Finding all audio/video elements in the current tab
 * 3. Setting up controls for each element
 * 4. Creating a master control panel for all elements
 * 5. Applying saved gain settings
 *
 * Uses browser.tabs and browser.webNavigation APIs to inject scripts
 * into all frames of the current tab.
 */
async function initializePopup() {
    // Load global settings first
    globalSettings = await loadGlobalSettings();
    initializeGlobalSettings();

    const tabs = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });
    tid = tabs[0].id;
    currentUrl = tabs[0].url;
    updateGlobalSettingsUI();

    try {
        const frames = await browser.webNavigation.getAllFrames({ tabId: tid });

        await Promise.all(
            frames.map((frame) => {
                const fid = frame.frameId;
                return browser.tabs
                    .executeScript(tid, {
                        frameId: fid,
                        code: `(function () {
			const result = new Map()
			for (const el of document.querySelectorAll('video, audio')) {
				if (!el.hasAttribute('data-x-soundfixer-id')) {
					el.setAttribute('data-x-soundfixer-id',
						Math.random().toString(36).substr(2, 10))
				}
				result.set(el.getAttribute('data-x-soundfixer-id'), {
					type: el.tagName.toLowerCase(),
					isPlaying: (el.currentTime > 0 && !el.paused && !el.ended && el.readyState > 2),
					settings: el.xSoundFixerSettings
				})
			}
			return result
		})()`,
                    })
                    .then((result) => frameMap.set(fid, result[0]))
                    .catch((err) =>
                        console.error(`tab ${tid} frame ${fid}`, err),
                    );
            }),
        );

        const effectiveGain = getEffectiveGain();
        elementsList.textContent = "";
        let elCount = 0;
        for (const [fid, els] of frameMap) {
            for (const [elid, el] of els) {
                const settings = el.settings || {};
                const node = document.createElement("li");
                node.appendChild(
                    document.importNode(elementsTpl.content, true),
                );
                node.dataset.fid = fid;
                node.dataset.elid = elid;
                node.querySelector(".element-label").textContent = `
				${el.type.charAt(0).toUpperCase() + el.type.slice(1)}
				${elCount + 1}
				${fid ? `in frame ${fid}` : ""}
				${el.isPlaying ? "" : "(not playing)"}
			`;
                if (!el.isPlaying)
                    node.querySelector(".element-label").classList.add(
                        "element-not-playing",
                    );
                const gain = node.querySelector(".element-gain");
                const gainNumberInput = node.querySelector(".element-gain-num");
                gain.value = settings.gain || 1;
                gain.parentElement.querySelector(".element-gain-num").value =
                    "" + gain.value;
                gain.addEventListener("input", function () {
                    // We used a function expression so 'this' refers to the gain slider
                    applySettings(fid, elid, { gain: parseFloat(this.value) });
                    this.parentElement.querySelector(
                        ".element-gain-num",
                    ).value = "" + this.value;
                });
                gainNumberInput.addEventListener("input", function () {
                    if (+this.value > +this.getAttribute("max"))
                        this.value = this.getAttribute("max");
                    if (+this.value < +this.getAttribute("min"))
                        this.value = this.getAttribute("min");

                    applySettings(fid, elid, { gain: parseFloat(this.value) });
                    this.parentElement.querySelector(".element-gain").value =
                        "" + this.value;
                });
                const pan = node.querySelector(".element-pan");
                const panNumberInput = node.querySelector(".element-pan-num");
                pan.value = settings.pan || 0;
                pan.parentElement.querySelector(".element-pan-num").value =
                    "" + pan.value;
                pan.addEventListener("input", function () {
                    applySettings(fid, elid, { pan: parseFloat(this.value) });
                    this.parentElement.querySelector(".element-pan-num").value =
                        "" + this.value;
                });
                panNumberInput.addEventListener("input", function () {
                    if (+this.value > +this.getAttribute("max"))
                        this.value = this.getAttribute("max");
                    if (+this.value < +this.getAttribute("min"))
                        this.value = this.getAttribute("min");

                    applySettings(fid, elid, { pan: parseFloat(this.value) });
                    this.parentElement.querySelector(".element-pan").value =
                        "" + this.value;
                });
                const mono = node.querySelector(".element-mono");
                mono.checked = settings.mono || false;
                mono.addEventListener("change", (_) => {
                    applySettings(fid, elid, { mono: mono.checked });
                });
                const flip = node.querySelector(".element-flip");
                flip.checked = settings.flip || false;
                flip.addEventListener("change", (_) => {
                    applySettings(fid, elid, { flip: flip.checked });
                });
                /**
                 * Reset all audio settings for this element to defaults
                 */
                node.querySelector(".element-reset").onclick = function () {
                    gain.value = 1;
                    gain.parentElement.querySelector(
                        ".element-gain-num",
                    ).value = "" + gain.value;
                    pan.value = 0;
                    pan.parentElement.querySelector(".element-pan-num").value =
                        "" + pan.value;
                    mono.checked = false;
                    flip.checked = false;
                    applySettings(fid, elid, {
                        gain: 1,
                        pan: 0,
                        mono: false,
                        flip: false,
                    });
                };
                elementsList.appendChild(node);
                elCount += 1;
            }
        }
        if (elCount == 0) {
            allElements.innerHTML =
                "No audio/video found in the current tab. Note that some websites do not work because of cross-domain security restrictions.";
            indivElements.remove();
        } else {
            const node = document.createElement("div");
            node.appendChild(document.importNode(elementsTpl.content, true));
            node.querySelector(".element-label").textContent =
                `All media on the page`;
            const gain = node.querySelector(".element-gain");
            const gainNumberInput = node.querySelector(".element-gain-num");
            gain.value = effectiveGain;
            gainNumberInput.value = "" + effectiveGain;
            /**
             * Applies gain value to all media elements on the page
             *
             * Updates both the UI sliders and the actual audio elements
             *
             * @param {number} value - Gain value to apply
             */
            function applyGain(value) {
                for (const [fid, els] of frameMap) {
                    for (const [elid, el] of els) {
                        applySettings(fid, elid, { gain: parseFloat(value) });
                        const egain = document.querySelector(
                            `[data-fid="${fid}"][data-elid="${elid}"] .element-gain`,
                        );
                        egain.value = value;
                        egain.parentElement.querySelector(
                            ".element-gain-num",
                        ).value = "" + value;
                    }
                }
                gain.value = value;
                gainNumberInput.value = "" + value;
            }
            gain.addEventListener("input", (_) => applyGain(gain.value));
            gainNumberInput.addEventListener("input", function () {
                if (+this.value > +this.getAttribute("max"))
                    this.value = this.getAttribute("max");
                if (+this.value < +this.getAttribute("min"))
                    this.value = this.getAttribute("min");
                applyGain(+this.value);
            });
            const pan = node.querySelector(".element-pan");
            const panNumberInput = node.querySelector(".element-pan-num");
            pan.value = 0;
            panNumberInput.value = "" + pan.value;
            /**
             * Applies pan value to all media elements on the page
             *
             * Updates both the UI sliders and the actual audio elements
             *
             * @param {number} value - Pan value to apply (-1 to 1)
             */
            function applyPan(value) {
                for (const [fid, els] of frameMap) {
                    for (const [elid, el] of els) {
                        applySettings(fid, elid, { pan: parseFloat(value) });
                        const epan = document.querySelector(
                            `[data-fid="${fid}"][data-elid="${elid}"] .element-pan`,
                        );
                        epan.value = value;
                        epan.parentElement.querySelector(
                            ".element-pan-num",
                        ).value = "" + value;
                    }
                }
                pan.value = value;
                panNumberInput.value = "" + value;
            }
            pan.addEventListener("input", (_) => applyPan(pan.value));
            panNumberInput.addEventListener("input", function () {
                if (+this.value > +this.getAttribute("max"))
                    this.value = this.getAttribute("max");
                if (+this.value < +this.getAttribute("min"))
                    this.value = this.getAttribute("min");
                applyPan(+this.value);
            });
            const mono = node.querySelector(".element-mono");
            mono.checked = false;
            mono.addEventListener("change", (_) => {
                for (const [fid, els] of frameMap) {
                    for (const [elid, el] of els) {
                        applySettings(fid, elid, { mono: mono.checked });
                        const emono = document.querySelector(
                            `[data-fid="${fid}"][data-elid="${elid}"] .element-mono`,
                        );
                        emono.checked = mono.checked;
                    }
                }
            });
            const flip = node.querySelector(".element-flip");
            flip.checked = false;
            flip.addEventListener("change", (_) => {
                for (const [fid, els] of frameMap) {
                    for (const [elid, el] of els) {
                        applySettings(fid, elid, { flip: flip.checked });
                        const eflip = document.querySelector(
                            `[data-fid="${fid}"][data-elid="${elid}"] .element-flip`,
                        );
                        eflip.checked = flip.checked;
                    }
                }
            });
            /**
             * Reset all audio settings for all elements to defaults
             */
            node.querySelector(".element-reset").onclick = function () {
                gain.value = 1;
                gain.parentElement.querySelector(".element-gain-num").value =
                    "" + gain.value;
                pan.value = 0;
                pan.parentElement.querySelector(".element-pan-num").value =
                    "" + pan.value;
                mono.checked = false;
                flip.checked = false;
                for (const [fid, els] of frameMap) {
                    for (const [elid, el] of els) {
                        const egain = document.querySelector(
                            `[data-fid="${fid}"][data-elid="${elid}"] .element-gain`,
                        );
                        egain.value = 1;
                        egain.parentElement.querySelector(
                            ".element-gain-num",
                        ).value = "" + egain.value;
                        const epan = document.querySelector(
                            `[data-fid="${fid}"][data-elid="${elid}"] .element-pan`,
                        );
                        epan.value = 0;
                        epan.parentElement.querySelector(
                            ".element-pan-num",
                        ).value = "" + epan.value;
                        document.querySelector(
                            `[data-fid="${fid}"][data-elid="${elid}"] .element-mono`,
                        ).checked = false;
                        document.querySelector(
                            `[data-fid="${fid}"][data-elid="${elid}"] .element-flip`,
                        ).checked = false;
                        applySettings(fid, elid, {
                            gain: effectiveGain,
                            pan: 0,
                            mono: false,
                            flip: false,
                        });
                    }
                }
            };
            allElements.appendChild(node);

            // Apply the effective gain to all elements on page load
            applyGainToAllElements(effectiveGain);
        }
    } catch (error) {
        console.error("Failed to initialize popup:", error);
        allElements.innerHTML =
            "Error loading media elements. Please refresh the page and try again.";
    }
}

// Initialize the popup
initializePopup();
