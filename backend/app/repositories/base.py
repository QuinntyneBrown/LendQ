from app.extensions import db


class BaseRepository:
    model = None

    def get_by_id(self, entity_id):
        return db.session.get(self.model, entity_id)

    def get_all(self):
        return self.model.query.all()

    def get_paginated(self, page=1, per_page=20, filters=None, order_by=None):
        query = self.model.query
        if filters:
            for f in filters:
                query = query.filter(f)
        if order_by is not None:
            query = query.order_by(order_by)
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def create(self, entity):
        db.session.add(entity)
        db.session.flush()
        return entity

    def update(self, entity):
        db.session.flush()
        return entity

    def delete(self, entity):
        db.session.delete(entity)
        db.session.flush()

    def commit(self):
        db.session.commit()

    def rollback(self):
        db.session.rollback()
