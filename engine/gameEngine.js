export class GameEngine {
  constructor(totalRounds = 5) {
    this.totalRounds = totalRounds;
    this.resetSession();
  }

  setTotalRounds(totalRounds) {
    const parsed = Number(totalRounds);
    if (Number.isFinite(parsed) && parsed > 0) {
      this.totalRounds = parsed;
    }
  }

  resetSession() {
    this.currentCategory = "";
    this.currentMolecule = null;
    this.lastDrawingDataUrl = "";
    this.currentRound = 0;
    this.totalScore = 0;
    this.totalXp = 0;
    this.streak = 0;
  }

  startSession(category, totalRounds) {
    this.resetSession();
    this.currentCategory = category;
    this.setTotalRounds(totalRounds);
  }

  beginRound(molecule) {
    this.currentRound += 1;
    this.currentMolecule = molecule;

    return {
      roundNumber: this.currentRound,
      totalRounds: this.totalRounds,
      molecule,
      totalScore: this.totalScore,
      totalXp: this.totalXp,
      streak: this.streak,
      multiplier: this.getMultiplierForStreak(this.streak),
    };
  }

  finishRound(drawingDataUrl) {
    this.lastDrawingDataUrl = drawingDataUrl;

    const score = this.calculatePlaceholderScore();

    if (score >= 80) {
      this.streak += 1;
    } else {
      this.streak = 0;
    }

    const multiplier = this.getMultiplierForStreak(this.streak);
    const xpEarned = Math.round(score * multiplier);

    this.totalScore += score;
    this.totalXp += xpEarned;

    return {
      category: this.currentCategory,
      molecule: this.currentMolecule,
      drawingDataUrl: this.lastDrawingDataUrl,
      roundNumber: this.currentRound,
      totalRounds: this.totalRounds,
      roundScore: score,
      totalScore: this.totalScore,
      xpEarned,
      totalXp: this.totalXp,
      streak: this.streak,
      multiplier,
      comboText: this.getComboText(score),
      feedbackText: this.getFeedbackText(score),
      isFinalRound: this.currentRound >= this.totalRounds,
    };
  }

  getMultiplierForStreak(streak) {
    if (streak >= 3) return 2;
    if (streak === 2) return 1.5;
    return 1;
  }

  getComboText(score) {
    if (score >= 95) return "Molecular Master!";
    if (score >= 90) return "Chem Wizard!";
    if (score >= 80) return "Clean Structure!";
    return "Combo Broken";
  }

  getFeedbackText(score) {
    if (score <= 50) return "Structural Collapse!";
    if (score <= 70) return "Needs Stabilization!";
    if (score <= 85) return "Solid Bonds!";
    if (score <= 94) return "Chemistry Ace!";
    return "Periodic Table Legend!";
  }

  calculatePlaceholderScore() {
    const roll = Math.random();
    if (roll < 0.1) return 45 + Math.floor(Math.random() * 11);
    if (roll < 0.35) return 56 + Math.floor(Math.random() * 16);
    if (roll < 0.75) return 72 + Math.floor(Math.random() * 14);
    if (roll < 0.95) return 86 + Math.floor(Math.random() * 9);
    return 95 + Math.floor(Math.random() * 6);
  }
}
