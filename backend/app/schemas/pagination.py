from marshmallow import Schema, fields


class PaginatedResponseSchema(Schema):
    total = fields.Integer()
    page = fields.Integer()
    per_page = fields.Integer()
    pages = fields.Integer()


def paginated_response(items_schema, data):
    return {
        "items": items_schema.dump(data["items"], many=True),
        "total": data["total"],
        "page": data["page"],
        "per_page": data["per_page"],
        "pages": data["pages"],
    }
