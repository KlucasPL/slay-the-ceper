import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const WORKFLOWS = join(ROOT, '.github/workflows');

function loadWorkflow(name) {
  const raw = readFileSync(join(WORKFLOWS, name), 'utf8');
  return yaml.load(raw);
}

function stepNames(job) {
  return (job.steps ?? []).map((s) => s.name ?? s.uses ?? '');
}

function stepRun(job, nameFragment) {
  const step = job.steps.find((s) => s.name?.includes(nameFragment));
  return step?.run ?? null;
}

describe('balance-check.yml', () => {
  const wf = loadWorkflow('balance-check.yml');

  it('shouldParseAsValidYaml', () => {
    expect(wf).toBeDefined();
    expect(typeof wf).toBe('object');
  });

  it('shouldTriggerOnPullRequestLabeled', () => {
    expect(wf.on.pull_request.types).toContain('labeled');
  });

  it('shouldGateOnBalanceCheckLabel', () => {
    const job = wf.jobs['balance-check'];
    expect(job.if).toContain('balance-check');
  });

  it('shouldHaveCheckoutStep', () => {
    const job = wf.jobs['balance-check'];
    const step = job.steps.find((s) => s.uses?.startsWith('actions/checkout@'));
    expect(step).toBeDefined();
    expect(step.uses).toMatch(/^actions\/checkout@[0-9a-f]{40}/);
  });

  it('shouldHaveSetupNodeStep', () => {
    const job = wf.jobs['balance-check'];
    const step = job.steps.find((s) => s.uses?.startsWith('actions/setup-node@'));
    expect(step).toBeDefined();
    expect(step.uses).toMatch(/^actions\/setup-node@[0-9a-f]{40}/);
    expect(step.with['node-version']).toBe(20);
  });

  it('shouldRunSimWith5kGames', () => {
    const job = wf.jobs['balance-check'];
    const run = stepRun(job, 'Run baseline simulation');
    expect(run).toBeTruthy();
    expect(run).toContain('--games 5000');
  });

  it('shouldAnalyzeSimOutput', () => {
    const job = wf.jobs['balance-check'];
    const run = stepRun(job, 'Analyze simulation');
    expect(run).toBeTruthy();
    expect(run).toContain('scripts/analyze.js');
  });

  it('shouldDiffAgainstMainBaseline', () => {
    const job = wf.jobs['balance-check'];
    const step = job.steps.find((s) => s.name?.includes('Diff'));
    expect(step).toBeDefined();
    expect(step.run).toContain('diff-baseline.js');
    expect(step.run).toContain('baselines/main.metrics.json');
    expect(step.run).toContain('baselines/thresholds.json');
    expect(step['continue-on-error']).toBe(true);
  });

  it('shouldPostPrComment', () => {
    const job = wf.jobs['balance-check'];
    const run = stepRun(job, 'Post diff comment');
    expect(run).toBeTruthy();
    expect(run).toContain('gh pr comment');
  });

  it('shouldFailOnDrift', () => {
    const job = wf.jobs['balance-check'];
    const step = job.steps.find((s) => s.name?.includes('Fail on drift'));
    expect(step).toBeDefined();
    expect(step.if).toContain('failure');
    expect(step.run).toContain('exit 2');
  });

  it('shouldHavePullRequestsWritePermission', () => {
    const job = wf.jobs['balance-check'];
    expect(job.permissions?.['pull-requests']).toBe('write');
  });

  it('shouldRunStepsInOrder', () => {
    const job = wf.jobs['balance-check'];
    const names = stepNames(job);
    const simIdx = names.findIndex((n) => n.includes('simulation'));
    const analyzeIdx = names.findIndex((n) => n.includes('Analyze'));
    const diffIdx = names.findIndex((n) => n.includes('Diff'));
    const commentIdx = names.findIndex((n) => n.includes('comment'));
    const failIdx = names.findIndex((n) => n.includes('Fail'));
    expect(simIdx).toBeLessThan(analyzeIdx);
    expect(analyzeIdx).toBeLessThan(diffIdx);
    expect(diffIdx).toBeLessThan(commentIdx);
    expect(commentIdx).toBeLessThan(failIdx);
  });
});

describe('baseline-update.yml', () => {
  const wf = loadWorkflow('baseline-update.yml');

  it('shouldParseAsValidYaml', () => {
    expect(wf).toBeDefined();
    expect(typeof wf).toBe('object');
  });

  it('shouldTriggerOnPullRequestLabeled', () => {
    expect(wf.on.pull_request.types).toContain('labeled');
  });

  it('shouldGateOnBaselineUpdateLabel', () => {
    const job = wf.jobs['baseline-update'];
    expect(job.if).toContain('baseline-update');
  });

  it('shouldHaveCheckoutStep', () => {
    const job = wf.jobs['baseline-update'];
    const step = job.steps.find((s) => s.uses?.startsWith('actions/checkout@'));
    expect(step).toBeDefined();
    expect(step.uses).toMatch(/^actions\/checkout@[0-9a-f]{40}/);
  });

  it('shouldCheckoutHeadRef', () => {
    const job = wf.jobs['baseline-update'];
    const step = job.steps.find((s) => s.uses?.startsWith('actions/checkout@'));
    expect(step.with?.ref).toContain('head_ref');
  });

  it('shouldRunSimWith10kGames', () => {
    const job = wf.jobs['baseline-update'];
    const run = stepRun(job, 'Run baseline simulation');
    expect(run).toBeTruthy();
    expect(run).toContain('--games 10000');
  });

  it('shouldAnalyzeIntoMainMetrics', () => {
    const job = wf.jobs['baseline-update'];
    const run = stepRun(job, 'Analyze simulation');
    expect(run).toBeTruthy();
    expect(run).toContain('baselines/main.metrics.json');
  });

  it('shouldCommitUpdatedBaseline', () => {
    const job = wf.jobs['baseline-update'];
    const step = job.steps.find((s) => s.name?.includes('Commit'));
    expect(step).toBeDefined();
    expect(step.run).toContain('git commit');
    expect(step.run).toContain('baselines/main.metrics.json');
    expect(step.run).toContain('git push');
  });

  it('shouldUseGithubActionsBotIdentity', () => {
    const job = wf.jobs['baseline-update'];
    const step = job.steps.find((s) => s.name?.includes('Commit'));
    expect(step.run).toContain('github-actions[bot]');
  });

  it('shouldHaveContentsWritePermission', () => {
    const job = wf.jobs['baseline-update'];
    expect(job.permissions?.contents).toBe('write');
  });

  it('shouldRunStepsInOrder', () => {
    const job = wf.jobs['baseline-update'];
    const names = stepNames(job);
    const simIdx = names.findIndex((n) => n.includes('simulation'));
    const analyzeIdx = names.findIndex((n) => n.includes('Analyze'));
    const commitIdx = names.findIndex((n) => n.includes('Commit'));
    expect(simIdx).toBeLessThan(analyzeIdx);
    expect(analyzeIdx).toBeLessThan(commitIdx);
  });
});
