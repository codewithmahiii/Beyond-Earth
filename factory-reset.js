(() => {
    "use strict";

    const dialog = document.getElementById("factory-reset-dialog");
    const openButton = document.getElementById("factory-reset-open");
    const firstStep = document.getElementById("factory-reset-first-step");
    const secondStep = document.getElementById("factory-reset-second-step");
    const continueButton = document.getElementById("factory-reset-continue");
    const cancelButtons = [...document.querySelectorAll("[data-factory-reset-cancel]")];
    const confirmationInput = document.getElementById("factory-reset-confirmation");
    const confirmButton = document.getElementById("factory-reset-confirm");
    const feedback = document.getElementById("factory-reset-feedback");

    function showStep(step) {
        const confirming = step === "confirmation";
        firstStep.hidden = confirming;
        secondStep.hidden = !confirming;
        feedback.textContent = "";
        if (confirming) {
            confirmationInput.value = "";
            confirmButton.disabled = true;
            confirmationInput.focus();
        }
    }

    function openConfirmation() {
        showStep("warning");
        if (!dialog.open) dialog.showModal();
    }

    async function resetGame() {
        confirmButton.disabled = true;
        cancelButtons.forEach((button) => { button.disabled = true; });
        feedback.textContent = "RESETTING GAME DATA…";

        try {
            await window.BeyondEarthMinigames?.dispose?.();
            window.SpaceAudio?.resetPreferences?.();
            window.BeyondEarthStorage.clearGameData();
            feedback.textContent = "Reset complete. Restarting the game…";
            window.location.reload();
        } catch (error) {
            console.error("The game factory reset could not be completed.", error);
            feedback.textContent = `Reset failed: ${error.message || "game data could not be cleared."}`;
            confirmButton.disabled = confirmationInput.value !== "RESET";
            cancelButtons.forEach((button) => { button.disabled = false; });
        }
    }

    openButton?.addEventListener("click", openConfirmation);
    continueButton?.addEventListener("click", () => showStep("confirmation"));
    cancelButtons.forEach((button) => {
        button.addEventListener("click", () => dialog.close());
    });
    confirmationInput?.addEventListener("input", () => {
        confirmButton.disabled = confirmationInput.value !== "RESET";
        feedback.textContent = "";
    });
    confirmButton?.addEventListener("click", resetGame);
    dialog?.addEventListener("close", () => {
        showStep("warning");
        openButton?.focus({ preventScroll: true });
    });
})();
