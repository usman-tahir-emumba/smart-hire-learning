import { setTimeout as sleep } from 'timers/promises';

const BASE_URL = process.env.SEED_BASE_URL ?? 'http://localhost:8000';

interface JobSeed {
  title: string;
  description: string;
  employmentType: string;
  requiredSkills: string[];
  minExperience?: number;
  maxApplications?: number;
  publish?: boolean;
  close?: boolean;
}

interface CandidateSeed {
  email: string;
  fullName: string;
  phone?: string;
  headline?: string;
  experienceYears?: number;
  skills?: string[];
  resumeUrl?: string;
}

const jobs: JobSeed[] = [
  {
    title: 'Senior Backend Engineer',
    description: 'Design and build scalable services and APIs.',
    employmentType: 'full_time',
    requiredSkills: ['node.js', 'postgresql', 'typescript'],
    minExperience: 5,
    maxApplications: 100,
    publish: true,
  },
  {
    title: 'Frontend Engineer',
    description: 'Build responsive interfaces for the recruiter console.',
    employmentType: 'full_time',
    requiredSkills: ['react', 'typescript', 'css'],
    minExperience: 3,
    publish: true,
  },
  {
    title: 'DevOps Engineer',
    description: 'Own CI/CD, containers, and observability.',
    employmentType: 'contract',
    requiredSkills: ['docker', 'kubernetes', 'terraform'],
    minExperience: 4,
    publish: true,
  },
  {
    title: 'QA Automation Engineer',
    description: 'Automate end-to-end and integration testing.',
    employmentType: 'part_time',
    requiredSkills: ['playwright', 'typescript'],
    minExperience: 2,
  },
  {
    title: 'Data Platform Intern',
    description: 'Support data pipelines and analytics tooling.',
    employmentType: 'internship',
    requiredSkills: ['python', 'sql'],
    minExperience: 0,
    publish: true,
    close: true,
  },
];

const candidates: CandidateSeed[] = [
  {
    email: 'ada.lovelace@example.com',
    fullName: 'Ada Lovelace',
    headline: 'Backend engineer',
    experienceYears: 8,
    skills: ['node.js', 'postgresql', 'typescript', 'go'],
  },
  {
    email: 'grace.hopper@example.com',
    fullName: 'Grace Hopper',
    headline: 'Systems engineer',
    experienceYears: 12,
    skills: ['python', 'sql', 'c'],
  },
  {
    email: 'linus.torvalds@example.com',
    fullName: 'Linus Torvalds',
    headline: 'Platform engineer',
    experienceYears: 15,
    skills: ['docker', 'kubernetes', 'c'],
  },
  {
    email: 'margaret.hamilton@example.com',
    fullName: 'Margaret Hamilton',
    headline: 'Frontend engineer',
    experienceYears: 4,
    skills: ['react', 'typescript', 'css'],
  },
  {
    email: 'katherine.johnson@example.com',
    fullName: 'Katherine Johnson',
    headline: 'Junior data engineer',
    experienceYears: 1,
    skills: ['python', 'sql'],
  },
];

async function api(method: string, path: string, body?: unknown): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, data };
}

async function waitForApi(): Promise<void> {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await api('GET', '/health/ready');
      if (res.status === 200) return;
    } catch {
      // ignore until the API is reachable
    }
    await sleep(1000);
  }
  throw new Error(`API not reachable at ${BASE_URL}`);
}

async function seedCandidates(): Promise<void> {
  for (const c of candidates) {
    const res = await api('POST', '/candidates', c);
    if (res.status === 201) {
      console.log(`candidate created: ${c.email}`);
    } else if (res.status === 409) {
      console.log(`candidate exists:  ${c.email}`);
    } else {
      console.log(`candidate failed:  ${c.email} (${res.status})`, res.data?.error ?? res.data);
    }
  }
}

async function seedJobs(): Promise<void> {
  for (const j of jobs) {
    const { publish, close, ...create } = j;
    const res = await api('POST', '/jobs', create);
    if (res.status !== 201) {
      console.log(`job failed: ${j.title} (${res.status})`, res.data?.error ?? res.data);
      continue;
    }
    const id = res.data.id as string;
    console.log(`job created: ${j.title}`);

    if (publish) {
      const pub = await api('POST', `/jobs/${id}/publish`);
      console.log(`  publish -> ${pub.status === 200 ? pub.data.status : pub.status}`);
    }
    if (close) {
      const cl = await api('POST', `/jobs/${id}/close`);
      console.log(`  close   -> ${cl.status === 200 ? cl.data.status : cl.status}`);
    }
  }
}

async function main(): Promise<void> {
  console.log(`Seeding SmartHire at ${BASE_URL}`);
  await waitForApi();
  await seedCandidates();
  await seedJobs();

  const jobsTotal = (await api('GET', '/jobs?limit=1')).data?.total ?? 0;
  const candidatesTotal = (await api('GET', '/candidates?limit=1')).data?.total ?? 0;
  console.log(`Done. Jobs: ${jobsTotal}, Candidates: ${candidatesTotal}`);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
