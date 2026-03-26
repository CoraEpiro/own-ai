import { normalizeAssistantMarkdown } from './src/utils/markdown';

const testCases = [
  'L=T-V',
  '\\T=\\frac12 m \\dot x^2,\\quad=V(x)',
  'F=-c\\dot x]',
  'from the force law, if conservative, you get $V$',
  '### Pendulum',
];

testCases.forEach(test => {
  const result = normalizeAssistantMarkdown(test);
  console.log('INPUT: ', test);
  console.log('OUTPUT:', result);
  console.log('---');
});
