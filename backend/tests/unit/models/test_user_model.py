class TestUserModel:
    def test_user_has_role(self, app, admin_user):
        with app.app_context():
            assert admin_user.has_role("Admin")
            assert not admin_user.has_role("Borrower")

    def test_user_has_any_role(self, app, admin_user):
        with app.app_context():
            assert admin_user.has_any_role("Admin", "Creditor")
            assert not admin_user.has_any_role("Creditor", "Borrower")

    def test_user_role_names(self, app, borrower_user):
        with app.app_context():
            assert "Borrower" in borrower_user.role_names
