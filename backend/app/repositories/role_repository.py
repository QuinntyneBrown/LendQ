from app.models.user import Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository):
    model = Role

    def get_by_name(self, name):
        return Role.query.filter_by(name=name).first()
