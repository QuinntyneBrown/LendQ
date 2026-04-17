"""Docs-sync tests.

Pin specific phrases in the user guide that must match the shipped design
so a passing pytest run catches drift. Started with the mobile-nav fix
from bug 2026-04-17-user-guide-mobile-nav-mismatch.
"""

from pathlib import Path


DOCS_ROOT = Path(__file__).resolve().parents[3] / "docs" / "user-guide"


class TestUserGuideSync:
    def test_navigation_guide_describes_actual_mobile_tabs(self):
        """The mobile-nav section of 03-navigation.md must list the labels
        actually shipped in the design + app: Home, Loans, Owed, Alerts, More.

        See docs/bugs/2026-04-17-user-guide-mobile-nav-mismatch.md.
        """
        content = (DOCS_ROOT / "03-navigation.md").read_text(encoding="utf-8")

        # Narrow to the Mobile section — the Desktop section legitimately
        # mentions "My Loans" / "Borrowings" as the sidebar labels.
        mobile_start = content.find("## Mobile")
        assert mobile_start != -1, "Expected a '## Mobile' section header"
        next_section = content.find("\n## ", mobile_start + 1)
        mobile_section = content[mobile_start:next_section if next_section != -1 else None]

        required = ["Home", "Loans", "Owed", "Alerts", "More"]
        for label in required:
            assert label in mobile_section, (
                f"Mobile nav section must mention {label!r} — see "
                "docs/bugs/2026-04-17-user-guide-mobile-nav-mismatch.md"
            )

        # Stale labels must not appear as primary tabs in the mobile section.
        # "Savings" is fine as part of More; "Borrowings" was the old name.
        forbidden_as_primary = [
            "Borrowings, Savings, Notifications",
            "Dashboard, My Loans, Borrowings",
        ]
        for phrase in forbidden_as_primary:
            assert phrase not in mobile_section, (
                f"Stale mobile-nav wording remains: {phrase!r}"
            )
