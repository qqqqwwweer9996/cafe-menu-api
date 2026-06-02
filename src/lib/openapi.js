// OpenAPI 3.0 specification served at GET /api/docs and rendered by Swagger UI
// at /api-docs.

const menuProperties = {
  id: { type: "integer", example: 1 },
  name: { type: "string", example: "아메리카노" },
  description: {
    type: "string",
    nullable: true,
    example: "에스프레소에 물을 더한 기본 커피",
  },
  price: { type: "integer", description: "Price in KRW", example: 4500 },
  categoryId: { type: "integer", example: 1 },
  category: { type: "string", description: "Category name", example: "coffee" },
  imageUrl: {
    type: "string",
    format: "uri",
    nullable: true,
    example: "https://picsum.photos/seed/americano/400/300",
  },
  isAvailable: { type: "boolean", example: true },
  createdAt: { type: "string", example: "2026-06-02 09:30:00" },
  updatedAt: { type: "string", example: "2026-06-02 09:30:00" },
};

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Cafe Menu Management API",
    version: "1.0.0",
    description:
      "Node.js (Next.js Route Handlers) + SQLite REST API for managing a cafe menu. " +
      "Supports full CRUD, category filtering, price sorting, search, price-range " +
      "filtering and pagination.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Menus", description: "Menu CRUD, filtering and sorting" },
    { name: "Categories", description: "Category resource (normalized table)" },
    { name: "Stats", description: "Aggregate menu statistics" },
    { name: "System", description: "Health check" },
  ],
  components: {
    schemas: {
      Menu: {
        type: "object",
        properties: menuProperties,
      },
      MenuInput: {
        type: "object",
        required: ["name", "price", "category"],
        properties: {
          name: { type: "string", maxLength: 100, example: "카페라떼" },
          description: {
            type: "string",
            maxLength: 500,
            example: "에스프레소와 스팀밀크",
          },
          price: { type: "integer", minimum: 0, example: 5000 },
          category: { type: "string", maxLength: 50, example: "coffee" },
          imageUrl: {
            type: "string",
            format: "uri",
            example: "https://picsum.photos/seed/latte/400/300",
          },
          isAvailable: { type: "boolean", default: true },
        },
      },
      MenuUpdate: {
        type: "object",
        description: "At least one field is required.",
        properties: {
          name: { type: "string", maxLength: 100 },
          description: { type: "string", maxLength: 500 },
          price: { type: "integer", minimum: 0 },
          category: { type: "string", maxLength: 50 },
          imageUrl: { type: "string", format: "uri" },
          isAvailable: { type: "boolean" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 3 },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "coffee" },
          menuCount: { type: "integer", example: 4 },
          createdAt: { type: "string", example: "2026-06-02 09:30:00" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Validation failed" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    path: { type: "string", example: "price" },
                    message: {
                      type: "string",
                      example: "price must be 0 or greater",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/menus": {
      get: {
        tags: ["Menus"],
        summary: "List menus",
        description:
          "Returns a paginated list of menus. Supports category filtering, " +
          "keyword search, price-range filtering, availability filtering and price/name sorting.",
        parameters: [
          {
            name: "category",
            in: "query",
            schema: { type: "string" },
            description: "Filter by category (exact match).",
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Case-insensitive keyword match on menu name.",
          },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["price", "name", "createdAt"],
              default: "createdAt",
            },
          },
          {
            name: "order",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
            description: "Sort direction. Use with sort=price for price asc/desc.",
          },
          { name: "minPrice", in: "query", schema: { type: "integer", minimum: 0 } },
          { name: "maxPrice", in: "query", schema: { type: "integer", minimum: 0 } },
          {
            name: "available",
            in: "query",
            schema: { type: "string", enum: ["true", "false"] },
            description: "Filter by availability.",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          200: {
            description: "A list of menus.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Menu" } },
                    meta: {
                      type: "object",
                      properties: {
                        pagination: { $ref: "#/components/schemas/Pagination" },
                        sort: {
                          type: "object",
                          properties: {
                            field: { type: "string", example: "price" },
                            order: { type: "string", example: "asc" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid query parameters.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Menus"],
        summary: "Create a menu",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MenuInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Menu created.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Menu" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/menus/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
      ],
      get: {
        tags: ["Menus"],
        summary: "Get a menu by id",
        responses: {
          200: {
            description: "The requested menu.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Menu" },
                  },
                },
              },
            },
          },
          404: {
            description: "Menu not found.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Menus"],
        summary: "Update a menu",
        description: "Updates the provided fields. At least one field is required.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MenuUpdate" },
            },
          },
        },
        responses: {
          200: { description: "Menu updated." },
          400: { description: "Validation error." },
          404: { description: "Menu not found." },
        },
      },
      patch: {
        tags: ["Menus"],
        summary: "Partially update a menu",
        description: "Alias of PUT — updates the provided fields.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MenuUpdate" },
            },
          },
        },
        responses: {
          200: { description: "Menu updated." },
          400: { description: "Validation error." },
          404: { description: "Menu not found." },
        },
      },
      delete: {
        tags: ["Menus"],
        summary: "Delete a menu",
        responses: {
          200: { description: "Menu deleted." },
          404: { description: "Menu not found." },
        },
      },
    },
    "/api/menus/stats": {
      get: {
        tags: ["Stats"],
        summary: "Menu statistics",
        description:
          "Returns overall menu count and average price, plus per-category counts and price summaries.",
        responses: { 200: { description: "Aggregate statistics." } },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "List categories",
        description: "Returns all categories with the number of menus in each.",
        responses: {
          200: {
            description: "A list of categories.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Category" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Create a category",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: { name: { type: "string", example: "smoothie" } },
              },
            },
          },
        },
        responses: {
          201: { description: "Category created." },
          400: { description: "Validation error." },
          409: { description: "Category name already exists." },
        },
      },
    },
    "/api/categories/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      delete: {
        tags: ["Categories"],
        summary: "Delete a category",
        description: "Fails with 409 if any menus still reference the category.",
        responses: {
          200: { description: "Category deleted." },
          404: { description: "Category not found." },
          409: { description: "Category is referenced by menus." },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: { 200: { description: "Service is healthy." } },
      },
    },
  },
};
