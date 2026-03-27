import bcrypt


class PasswordService:
    WORK_FACTOR = 12

    def hash_password(self, password):
        return bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt(rounds=self.WORK_FACTOR)
        ).decode("utf-8")

    def verify_password(self, password, password_hash):
        return bcrypt.checkpw(
            password.encode("utf-8"), password_hash.encode("utf-8")
        )
