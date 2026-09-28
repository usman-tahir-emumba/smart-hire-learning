export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SmartHire API',
    version: '1.0.0',
    description:
      'Core recruitment platform: job and candidate management with a job posting lifecycle.',
  },
  servers: [{ url: '/', description: 'Current host' }],
  tags: [
    { name: 'Jobs', description: 'Job postings and lifecycle' },
    { name: 'Candidates', description: 'Candidate profiles' },
    { name: 'Health', description: 'Liveness and readiness probes' },
  ],
  paths: {
    '/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        responses: { '200': { description: 'Process is alive' } },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe (checks database)',
        responses: {
          '200': { description: 'Ready' },
          '503': { description: 'A dependency is unavailable' },
        },
      },
    },
    '/jobs': {
      post: {
        tags: ['Jobs'],
        summary: 'Create a job (always starts as draft)',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/JobCreate' } },
          },
        },
        responses: {
          '201': { description: 'Created', content: jsonSchema('Job') },
          '422': errorResponse('Validation failed'),
        },
      },
      get: {
        tags: ['Jobs'],
        summary: 'List jobs with filters and pagination',
        parameters: [
          queryParam('status', 'Filter by status', ['draft', 'published', 'closed']),
          queryParam('skill', 'Filter by a required skill (exact, case-insensitive)'),
          queryParam('title', 'Filter by title substring'),
          ...paginationParams(),
        ],
        responses: { '200': { description: 'Page of jobs', content: jsonSchema('JobPage') } },
      },
    },
    '/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        summary: 'Get a job by id',
        parameters: [idParam()],
        responses: {
          '200': { description: 'Job', content: jsonSchema('Job') },
          '404': errorResponse('Not found'),
        },
      },
      patch: {
        tags: ['Jobs'],
        summary: 'Update a job (rejected when closed)',
        parameters: [idParam()],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/JobUpdate' } },
          },
        },
        responses: {
          '200': { description: 'Updated', content: jsonSchema('Job') },
          '404': errorResponse('Not found'),
          '409': errorResponse('Illegal state'),
        },
      },
      delete: {
        tags: ['Jobs'],
        summary: 'Delete a job',
        parameters: [idParam()],
        responses: { '204': { description: 'Deleted' }, '404': errorResponse('Not found') },
      },
    },
    '/jobs/{id}/publish': transitionPath('Publish a draft job'),
    '/jobs/{id}/close': transitionPath('Close a job'),
    '/jobs/{id}/reopen': transitionPath('Reopen a closed job'),
    '/candidates': {
      post: {
        tags: ['Candidates'],
        summary: 'Register a candidate',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CandidateCreate' } },
          },
        },
        responses: {
          '201': { description: 'Created', content: jsonSchema('Candidate') },
          '409': errorResponse('Email already exists'),
          '422': errorResponse('Validation failed'),
        },
      },
      get: {
        tags: ['Candidates'],
        summary: 'List candidates with filters and pagination',
        parameters: [
          queryParam('skill', 'Filter by a skill (exact, case-insensitive)'),
          queryParam('name', 'Filter by name substring'),
          queryParam('minExperience', 'Minimum years of experience'),
          ...paginationParams(),
        ],
        responses: {
          '200': { description: 'Page of candidates', content: jsonSchema('CandidatePage') },
        },
      },
    },
    '/candidates/{id}': {
      get: {
        tags: ['Candidates'],
        summary: 'Get a candidate by id',
        parameters: [idParam()],
        responses: {
          '200': { description: 'Candidate', content: jsonSchema('Candidate') },
          '404': errorResponse('Not found'),
        },
      },
      patch: {
        tags: ['Candidates'],
        summary: 'Update a candidate (email is immutable)',
        parameters: [idParam()],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CandidateUpdate' } },
          },
        },
        responses: {
          '200': { description: 'Updated', content: jsonSchema('Candidate') },
          '404': errorResponse('Not found'),
        },
      },
      delete: {
        tags: ['Candidates'],
        summary: 'Delete a candidate',
        parameters: [idParam()],
        responses: { '204': { description: 'Deleted' }, '404': errorResponse('Not found') },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              requestId: { type: 'string' },
              details: { type: 'object', additionalProperties: true, nullable: true },
            },
            required: ['code', 'message', 'requestId'],
          },
        },
      },
      JobCreate: {
        type: 'object',
        required: ['title', 'description', 'employmentType'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          employmentType: {
            type: 'string',
            enum: ['full_time', 'part_time', 'contract', 'internship'],
          },
          requiredSkills: { type: 'array', items: { type: 'string' } },
          minExperience: { type: 'integer', minimum: 0 },
          maxApplications: { type: 'integer', minimum: 1, nullable: true },
        },
      },
      JobUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          employmentType: {
            type: 'string',
            enum: ['full_time', 'part_time', 'contract', 'internship'],
          },
          requiredSkills: { type: 'array', items: { type: 'string' } },
          minExperience: { type: 'integer', minimum: 0 },
          maxApplications: { type: 'integer', minimum: 1, nullable: true },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'closed'] },
          employmentType: {
            type: 'string',
            enum: ['full_time', 'part_time', 'contract', 'internship'],
          },
          requiredSkills: { type: 'array', items: { type: 'string' } },
          minExperience: { type: 'integer' },
          maxApplications: { type: 'integer', nullable: true },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      JobPage: pageSchema('Job'),
      CandidateCreate: {
        type: 'object',
        required: ['email', 'fullName'],
        properties: {
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          phone: { type: 'string', nullable: true },
          headline: { type: 'string', nullable: true },
          experienceYears: { type: 'integer', minimum: 0 },
          skills: { type: 'array', items: { type: 'string' } },
          resumeUrl: { type: 'string', format: 'uri', nullable: true },
        },
      },
      CandidateUpdate: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          phone: { type: 'string', nullable: true },
          headline: { type: 'string', nullable: true },
          experienceYears: { type: 'integer', minimum: 0 },
          skills: { type: 'array', items: { type: 'string' } },
          resumeUrl: { type: 'string', format: 'uri', nullable: true },
        },
      },
      Candidate: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          phone: { type: 'string', nullable: true },
          headline: { type: 'string', nullable: true },
          experienceYears: { type: 'integer' },
          skills: { type: 'array', items: { type: 'string' } },
          resumeUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CandidatePage: pageSchema('Candidate'),
    },
  },
};

function jsonSchema(ref: string) {
  return { 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } };
}

function errorResponse(description: string) {
  return { description, content: jsonSchema('Error') };
}

function idParam() {
  return {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  };
}

function queryParam(name: string, description: string, enumValues?: string[]) {
  const schema: Record<string, unknown> = { type: 'string' };
  if (enumValues) schema.enum = enumValues;
  return { name, in: 'query', required: false, description, schema };
}

function paginationParams() {
  return [
    {
      name: 'limit',
      in: 'query',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
    {
      name: 'offset',
      in: 'query',
      required: false,
      schema: { type: 'integer', minimum: 0, default: 0 },
    },
  ];
}

function transitionPath(summary: string) {
  return {
    post: {
      tags: ['Jobs'],
      summary,
      parameters: [idParam()],
      responses: {
        '200': { description: 'Updated', content: jsonSchema('Job') },
        '404': errorResponse('Not found'),
        '409': errorResponse('Illegal state transition'),
      },
    },
  };
}

function pageSchema(itemRef: string) {
  return {
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: `#/components/schemas/${itemRef}` } },
      total: { type: 'integer' },
      limit: { type: 'integer' },
      offset: { type: 'integer' },
    },
  };
}
