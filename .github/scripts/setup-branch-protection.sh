#!/usr/bin/env bash
# Aplica branch protection em `main` e ajusta merge settings do repo.
# Idempotente: roda quantas vezes precisar. Requer `gh auth login` com token
# de admin do repo. Override OWNER/REPO via env se rodar em fork.
#
# Este script é source-of-truth — sobrescreve mudanças manuais feitas via UI
# (regras de branch protection, política de branch do environment, etc).
# Se algo precisar mudar, mudar AQUI e rodar de novo.
set -euo pipefail

OWNER="${OWNER:-ICEI-PUC-Minas-PBE-SI-TI}"
REPO="${REPO:-2026-1-p5-tias-foodloop}"

echo "→ Aplicando branch protection em $OWNER/$REPO@main..."
gh api -X PUT "repos/$OWNER/$REPO/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci-success"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "restrictions": null
}
JSON

echo "→ Forçando squash merge only + auto-delete branch..."
gh api -X PATCH "repos/$OWNER/$REPO" \
  -F allow_squash_merge=true \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true \
  -F squash_merge_commit_title=PR_TITLE \
  -F squash_merge_commit_message=PR_BODY \
  > /dev/null

echo "→ Configurando environment 'production' (wait timer, self-review, branch policy)..."
gh api -X PUT "repos/$OWNER/$REPO/environments/production" \
  -F wait_timer=5 \
  -F prevent_self_review=true \
  -F "deployment_branch_policy[protected_branches]=true" \
  -F "deployment_branch_policy[custom_branch_policies]=false" \
  > /dev/null

echo "✓ Pronto. Required reviewers do environment 'production' ainda precisam ser adicionados manualmente em Settings → Environments → production (a API exige IDs numéricos dos usuários, mais simples fazer pelo painel)."
