# 🚀 The Middleman Developer Playbook

Welcome to the team! To keep our codebase clean, stable, and production-ready, we use a structured Git workflow. Please read and follow these steps carefully before writing or submitting any code.

---

## 🛡️ 1. Core Repository Rules

### 🚫 The Golden Rule: Protected Main Branch
The `main` branch is our production line. It is strictly locked by a branch protection rule. 
* **NEVER try to push code directly to `main`** from your local terminal—GitHub will reject it instantly.
* All code changes must enter `main` through an approved **Pull Request (PR)**.

### 👥 Code Review Requirements
* Every Pull Request requires at least **1 approval** from a teammate or team lead before it can be merged into production.
* If changes are requested during review, fix them on your feature branch and push them up—the PR updates automatically.

---

## 🏎️ 2. The Standard Git Workflow (Step-by-Step)

Whenever you are assigned a new feature, UI component, or bug fix, execute this exact lifecycle:

### Step 1: Sync Your Local Main
Before starting any new work, ensure your local machine has the absolute latest code from the organization repository.
```bash
git checkout main
git pull origin main
