"""Guard-rail test for docs/bugs/2026-04-17-staging-demo-seed-missing-loans.md.

The local seed code is correct — see test_seed_demo.py. The staging bug is
caused by how the deploy workflow applies `SEED_ON_STARTUP=demo`:

- The env var is set in a step that runs AFTER the image update and health
  check, which means the first revision of a new deploy boots WITHOUT the
  var, completes its startup, reports healthy, and never runs the demo seed.
- The step is marked `continue-on-error: true` with `|| true`, so if applying
  the env var silently fails (e.g. because another revision is still rolling),
  nothing fails the build.

This test codifies the fix: `SEED_ON_STARTUP` must be applied as part of the
image update step (so the new revision starts with the var set) and the step
must not silently swallow failures.
"""

from pathlib import Path


DEPLOY_WORKFLOW = (
    Path(__file__).resolve().parents[3]
    / ".github"
    / "workflows"
    / "deploy-staging.yml"
)


def _read_workflow() -> str:
    return DEPLOY_WORKFLOW.read_text(encoding="utf-8")


class TestDeployWorkflowSeedContract:
    def test_workflow_file_exists(self):
        assert DEPLOY_WORKFLOW.exists(), f"{DEPLOY_WORKFLOW} not found"

    def test_seed_env_var_is_applied_in_image_update_step(self):
        """SEED_ON_STARTUP must be set in the same step that updates the
        container image, so the new revision boots with the var in place.

        Previously the var was applied in a separate, post-health-check step.
        """
        content = _read_workflow()

        lines = content.splitlines()
        in_image_step = False
        image_step_lines: list[str] = []
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("- name:") and "Update container app images" in stripped:
                in_image_step = True
                image_step_lines = []
                continue
            if in_image_step and stripped.startswith("- name:"):
                break
            if in_image_step:
                image_step_lines.append(line)

        image_step_text = "\n".join(image_step_lines)
        assert "SEED_ON_STARTUP" in image_step_text, (
            "SEED_ON_STARTUP=demo must be applied in the 'Update container app images' "
            "step so the new revision starts with the seed env var in place. See "
            "docs/bugs/2026-04-17-staging-demo-seed-missing-loans.md."
        )

    def test_env_var_step_does_not_swallow_failures(self):
        """If a separate env-var-ensuring step still exists, it must not
        swallow errors with `continue-on-error: true` plus `|| true`."""
        content = _read_workflow()

        if "Ensure staging env vars on API" not in content:
            # Step was inlined into image update; nothing to check.
            return

        # The section between this step name and the next "- name:" must not
        # contain both `continue-on-error: true` and `|| true` — that belt-and-
        # braces combination made earlier seed failures invisible.
        start = content.index("Ensure staging env vars on API")
        tail = content[start:]
        next_step = tail.find("\n      - name:")
        section = tail if next_step == -1 else tail[:next_step]

        has_continue = "continue-on-error: true" in section
        has_or_true = "|| true" in section
        assert not (has_continue and has_or_true), (
            "The env-var step must not combine `continue-on-error: true` with "
            "`|| true` — that pair hides seed application failures in the deploy "
            "log. Pick one (prefer removing both)."
        )
