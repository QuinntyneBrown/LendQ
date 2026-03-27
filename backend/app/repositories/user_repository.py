from sqlalchemy import or_

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    model = User

    def get_by_email(self, email):
        return User.query.filter_by(email=email).first()

    def get_by_reset_token_hash(self, token_hash):
        return User.query.filter_by(reset_token_hash=token_hash).first()

    def search(self, query_str, page=1, per_page=20, role=None, is_active=None):
        query = User.query
        if query_str:
            search = f"%{query_str}%"
            query = query.filter(
                or_(User.name.ilike(search), User.email.ilike(search))
            )
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        if role:
            query = query.filter(User.roles.any(name=role))
        query = query.order_by(User.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }
