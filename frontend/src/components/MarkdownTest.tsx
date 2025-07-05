import MarkdownRenderer from './MarkdownRenderer';

export default function MarkdownTest() {
  // Sample GPT response with proper LaTeX formatting
  const sampleResponse = `
# Differential Equation Example

Consider a simple first-order differential equation:

$$\\frac{dy}{dx} + 2y = e^{-x}$$

This is a linear differential equation where:
- $y$ is the dependent variable
- $x$ is the independent variable  
- The coefficient of $y$ is $2$

## Solution Method

To solve this equation, we use an integrating factor. The integrating factor $\\mu(x)$ is:

$$\\mu(x) = e^{\\int 2 \\, dx} = e^{2x}$$

Multiplying both sides by the integrating factor:

$$e^{2x}\\frac{dy}{dx} + 2e^{2x}y = e^{2x}e^{-x}$$

This simplifies to:

$$\\frac{d}{dx}(e^{2x}y) = e^{x}$$

Integrating both sides:

$$e^{2x}y = \\int e^{x} \\, dx = e^{x} + C$$

Therefore, the general solution is:

$$y = e^{-x} + Ce^{-2x}$$

where $C$ is the constant of integration.
`;

  return (
    <div className="p-8 bg-white dark:bg-zinc-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Markdown + LaTeX Test</h1>
      <div className="border rounded-lg p-6 bg-gray-50 dark:bg-zinc-800">
        <MarkdownRenderer content={sampleResponse} />
      </div>
    </div>
  );
} 